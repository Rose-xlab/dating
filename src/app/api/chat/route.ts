import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { DatingSafetyPromptBuilder } from '@/lib/prompt-builder';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    const lastUserMessage = messages[messages.length - 1]?.content || '';

    if (!openai) {
      // Return helpful response even without OpenAI
      return NextResponse.json({
        content: "I'm currently in demo mode. In production, I'll help you analyze dating conversations, identify red flags, and provide safety advice. You can still upload screenshots for pattern analysis!"
      });
    }

    // Use the comprehensive prompt builder
    const systemPrompt = DatingSafetyPromptBuilder.getSystemPrompt();
    const contextPrompt = DatingSafetyPromptBuilder.getChatResponsePrompt(
      'Dating safety conversation',
      lastUserMessage
    );

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(0, -1), // Previous messages
        { role: 'user', content: contextPrompt } // Enhanced last message
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = completion.choices[0].message.content || "I'm here to help! Could you tell me more about what you'd like to discuss?";

    return NextResponse.json({ content });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Try to get the last message from request body
    let lastMessage = '';
    try {
      const body = await request.clone().json();
      lastMessage = body.messages?.[body.messages.length - 1]?.content?.toLowerCase() || '';
    } catch (e) {
      // If we can't parse the body, use empty string
      lastMessage = '';
    }
    
    let fallbackResponse = "I'm here to help you stay safe while dating online! You can ask me about red flags, share dating scenarios, or upload screenshots for analysis.";
    
    // Check for specific topics and provide relevant responses
    if (lastMessage.includes('red flag')) {
      fallbackResponse = "Common red flags include: asking for money, avoiding video calls, pushing to move off the app quickly, love bombing (excessive affection too soon), and inconsistent stories. Would you like me to explain any of these in detail?";
    } else if (lastMessage.includes('green flag')) {
      fallbackResponse = "Great green flags include: consistent communication, respecting your boundaries, showing genuine interest in your life, being patient with your pace, and being open to video calls or public meetups. These show emotional maturity!";
    } else if (lastMessage.includes('safe') || lastMessage.includes('safety')) {
      fallbackResponse = "For safe online dating: 1) Keep conversations on the app initially, 2) Video call before meeting, 3) Meet in public places, 4) Tell a friend your plans, 5) Trust your instincts. What specific safety concern do you have?";
    } else if (lastMessage.includes('money') || lastMessage.includes('financial')) {
      fallbackResponse = "🚩 MAJOR RED FLAG! Never send money to someone you've only met online. Common scams include: emergency medical bills, travel expenses, investment opportunities, or gift cards. This is likely a romance scam. Please block and report them.";
    } else if (lastMessage.includes('meet') || lastMessage.includes('date')) {
      fallbackResponse = "For a safe first meeting: 1) Always meet in a public place, 2) Tell a friend where you're going, 3) Have your own transportation, 4) Keep it short (coffee or lunch), 5) Trust your gut. How long have you been chatting with this person?";
    } else if (lastMessage.includes('photo') || lastMessage.includes('nude')) {
      fallbackResponse = "⚠️ Be very careful with photo requests! Never send intimate photos to someone you haven't met. This can lead to sextortion. If they're pressuring you, that's a red flag. A genuine person will respect your boundaries.";
    }

    return NextResponse.json({ content: fallbackResponse });
  }
}