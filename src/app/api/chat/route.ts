import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { DatingSafetyPromptBuilder } from '@/lib/prompt-builder';
import { chatRatelimit } from '@/lib/rate-limit'; // IMPORT SPECIFIC LIMITER

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(request: NextRequest) {
  const supabase = createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- CHAT RATE LIMIT CHECK ---
    const { success } = await chatRatelimit.limit(user.id);
    if (!success) {
       return NextResponse.json({ 
         content: "You're typing a bit too fast! Please wait a moment before sending another message." 
       }, { status: 429 });
    }
    // -----------------------------

    const { messages: newMessages, hasAnalysisContext } = await request.json();
    const lastUserMessage = newMessages[newMessages.length - 1]?.content || '';

    if (!openai) {
      return NextResponse.json({
        content: "I'm currently in demo mode. In production, I'll help you analyze dating chats."
      });
    }

    const { data: history } = await supabase
      .from('chat_history')
      .select('messages')
      .eq('user_id', user.id)
      .single();

    const pastMessages = history ? history.messages : [];

    let contextMessages = [];
    
    if (hasAnalysisContext && newMessages[0]?.role === 'system') {
      const analysisContext = newMessages[0].content;
      const enhancedSystemPrompt = `${DatingSafetyPromptBuilder.getSystemPrompt()}

CURRENT ANALYSIS CONTEXT:
${analysisContext}

CRITICAL INSTRUCTIONS FOR FLAG REFERENCES:
When discussing specific flags, use format: [[FLAG_ID::FLAG_TEXT::FLAG_TYPE]]
... (Rest of your system prompt logic)`;

      contextMessages.push({ role: 'system', content: enhancedSystemPrompt });
      contextMessages.push(...newMessages.slice(1));
    } else {
      contextMessages = [
        { role: 'system', content: DatingSafetyPromptBuilder.getSystemPrompt() },
        ...pastMessages.slice(-5),
        ...newMessages
      ];
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: contextMessages,
      temperature: 0.7,
      max_tokens: 700,
    });

    const assistantResponse = completion.choices[0].message;

    if (!hasAnalysisContext) {
      const updatedHistory = [...pastMessages, ...newMessages.filter((m: { role: string; }) => m.role !== 'system'), assistantResponse];
      await supabase
        .from('chat_history')
        .upsert({
          user_id: user.id,
          messages: updatedHistory.slice(-20),
        }, { onConflict: 'user_id' });
    }
    
    return NextResponse.json({ content: assistantResponse.content });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Fallback logic
    let fallbackResponse = "I seem to be having trouble connecting. You can ask me general questions about safety.";
    
    // (Your existing simple fallback logic here if needed)
    return NextResponse.json({ content: fallbackResponse });
  }
}