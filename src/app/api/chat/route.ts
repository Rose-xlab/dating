import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { DatingSafetyPromptBuilder } from '@/lib/prompt-builder';
import { ratelimit } from '@/lib/rate-limit';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(request: NextRequest) {
  const supabase = createClient();
  
  try {
    // 1. Get Authenticated User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Rate limit per user
    const { success } = await ratelimit.limit(user.id);
    if (!success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { messages: newMessages, hasAnalysisContext } = await request.json();
    const lastUserMessage = newMessages[newMessages.length - 1]?.content || '';

    if (!openai) {
      return NextResponse.json({
        content: "I'm currently in demo mode. In production, I'll remember our conversation and help you analyze dating chats, identify red flags, and provide safety advice."
      });
    }

    // 3. Fetch Chat History from Supabase
    const { data: history } = await supabase
      .from('chat_history')
      .select('messages')
      .eq('user_id', user.id)
      .single();

    const pastMessages = history ? history.messages : [];

    // 4. Build context messages
    let contextMessages = [];
    
    // If there's analysis context, create a more detailed system message
    if (hasAnalysisContext && newMessages[0]?.role === 'system') {
      const analysisContext = newMessages[0].content;
      const enhancedSystemPrompt = `${DatingSafetyPromptBuilder.getSystemPrompt()}

CURRENT ANALYSIS CONTEXT:
${analysisContext}

CRITICAL INSTRUCTIONS FOR FLAG REFERENCES:
When discussing specific flags from the analysis, you MUST format them as clickable references using this exact format:
[[FLAG_ID::FLAG_TEXT::FLAG_TYPE]]

Examples:
- For a red flag: [[flag-123456789::Love bombing - excessive affection too quickly::red]]
- For a green flag: [[flag-987654321::Respects boundaries when you say no::green]]

The FLAG_ID must be the exact ID from the analysis context above.
The FLAG_TEXT should be a short, descriptive summary of the flag (not the full message).
The FLAG_TYPE must be either "red" or "green".

When the user asks about:
- "What are the red flags?" - List each red flag with its clickable reference
- "Explain the love bombing" - Reference the specific love bombing flag with its ID
- "Tell me about the concerns" - Reference each concerning flag individually
- "What positive signs are there?" - Reference each green flag with its ID

Always make flag names clickable so users can view the full details in the analysis dashboard.
Be specific and reference the actual findings from the analysis, not generic examples.`;

      contextMessages.push({ role: 'system', content: enhancedSystemPrompt });
      
      // Add the conversation context (excluding the system message)
      contextMessages.push(...newMessages.slice(1));
    } else {
      // Regular conversation without analysis context
      contextMessages = [
        { role: 'system', content: DatingSafetyPromptBuilder.getSystemPrompt() },
        ...pastMessages.slice(-5), // Last 5 messages for context
        ...newMessages
      ];
    }

    // 5. Call OpenAI with Full Context
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: contextMessages,
      temperature: 0.7,
      max_tokens: 700,
    });

    const assistantResponse = completion.choices[0].message;

    // 6. Save Updated History to Supabase (only text messages, not analysis context)
    if (!hasAnalysisContext) {
      const updatedHistory = [...pastMessages, ...newMessages.filter(m => m.role !== 'system'), assistantResponse];
      await supabase
        .from('chat_history')
        .upsert({
          user_id: user.id,
          messages: updatedHistory.slice(-20), // Keep last 20 messages
        }, { onConflict: 'user_id' });
    }
    
    return NextResponse.json({ content: assistantResponse.content || "I'm not sure how to respond to that. Could you ask in a different way?" });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Enhanced fallback responses
    let lastMessage = '';
    try {
      const body = await request.clone().json();
      lastMessage = body.messages?.[body.messages.length - 1]?.content?.toLowerCase() || '';
    } catch (e) {
      lastMessage = '';
    }
    
    let fallbackResponse = "I seem to be having trouble connecting to my full brain right now, but I can still help! You can ask me general questions about red flags, safety, or what to do about concerning behavior.";
    
    // Enhanced fallback logic for analysis questions
    if (lastMessage.includes('red flag') || lastMessage.includes('concern')) {
      fallbackResponse = "While I can't access the specific flags right now, common red flags include: love bombing, financial requests, avoiding video calls, and pushing boundaries. Click 'View Full Analysis' to see your specific results.";
    } else if (lastMessage.includes('explain') || lastMessage.includes('what does')) {
      fallbackResponse = "I'd love to explain the specific flags in detail, but I'm having connection issues. You can click 'View Full Analysis' above to see detailed explanations of each flag, or try asking again in a moment.";
    } else if (lastMessage.includes('respond') || lastMessage.includes('reply')) {
      fallbackResponse = "For safe responses: 1) Set clear boundaries, 2) Don't share personal/financial info, 3) Trust your gut, 4) If uncomfortable, it's okay to unmatch. Check the 'Suggested Replies' in your full analysis for specific examples.";
    } else if (lastMessage.includes('safe') || lastMessage.includes('danger')) {
      fallbackResponse = "Your safety is paramount. High risk scores (70%+) or critical flags mean you should consider ending contact. Click 'View Full Analysis' to see your specific safety recommendations and exit strategies.";
    }
    
    return NextResponse.json({ content: fallbackResponse });
  }
}