import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { DatingSafetyPromptBuilder } from '@/lib/prompt-builder';

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

    const { messages: newMessages } = await request.json();
    const lastUserMessage = newMessages[newMessages.length - 1]?.content || '';

    if (!openai) {
      return NextResponse.json({
        content: "I'm currently in demo mode. In production, I'll remember our conversation and help you analyze dating chats, identify red flags, and provide safety advice."
      });
    }

    // 2. Fetch Chat History from Supabase
    const { data: history } = await supabase
      .from('chat_history')
      .select('messages')
      .eq('user_id', user.id)
      .single();

    const pastMessages = history ? history.messages : [];

    // 3. Combine History with New Message(s)
    // We send a rolling context of the last 10 messages to keep it efficient
    const contextMessages = [...pastMessages, ...newMessages].slice(-10);

    // 4. Call OpenAI with Full Context
    const systemPrompt = DatingSafetyPromptBuilder.getSystemPrompt();

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        // Pass the combined history and new message as context
        ...contextMessages.map((msg: any) => ({ role: msg.role, content: msg.content })),
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const assistantResponse = completion.choices[0].message;

    // 5. Save Updated History to Supabase
    const updatedHistory = [...contextMessages, assistantResponse];
    await supabase
      .from('chat_history')
      .upsert({
        user_id: user.id,
        messages: updatedHistory,
      }, { onConflict: 'user_id' });
    
    return NextResponse.json({ content: assistantResponse.content || "I'm not sure how to respond to that. Could you ask in a different way?" });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // --- YOUR EXCELLENT FALLBACK LOGIC IS PRESERVED HERE ---
    let lastMessage = '';
    try {
      const body = await request.clone().json();
      lastMessage = body.messages?.[body.messages.length - 1]?.content?.toLowerCase() || '';
    } catch (e) {
      lastMessage = '';
    }
    
    let fallbackResponse = "I seem to be having trouble connecting to my full brain right now, but I can still help! You can ask me general questions about red flags, safety, or what to do on a first date.";
    
    if (lastMessage.includes('red flag')) {
      fallbackResponse = "Common red flags include: asking for money, avoiding video calls, pushing to move off the app quickly, love bombing (excessive affection too soon), and inconsistent stories. Would you like me to explain any of these in detail?";
    } else if (lastMessage.includes('money') || lastMessage.includes('financial')) {
      fallbackResponse = "🚩 MAJOR RED FLAG! Never send money to someone you've only met online. This is very often a romance scam. Please be careful, and do not share any financial information.";
    } else if (lastMessage.includes('meet') || lastMessage.includes('date')) {
      fallbackResponse = "For a safe first meeting: 1) Always meet in a public place, 2) Tell a friend your plans, 3) Have your own transportation, 4) Trust your gut. How long have you been chatting with this person?";
    }
    
    return NextResponse.json({ content: fallbackResponse });
  }
}