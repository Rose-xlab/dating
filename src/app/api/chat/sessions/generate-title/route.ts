import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

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

    if (!openai) {
        return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
    }

    const { messages } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    // Combine the content of the messages into a single string.
    const conversation = messages.map((message: { role: string, content: string}) => `${message.role}: ${message.content}`).join('\n');

    const prompt = `Based on the following conversation, create a short, descriptive title of 5-7 words. The title should capture the main topic or essence of the chat.

Conversation:
"""
${conversation.substring(0, 2000)}
"""

Title:`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 20,
      n: 1,
    });

    const title = completion.choices[0].message?.content?.trim().replace(/"/g, '') || 'Untitled Chat';

    return NextResponse.json({ title });

  } catch (error) {
    console.error('Title generation error:', error);
    return NextResponse.json({ error: 'Failed to generate title.' }, { status: 500 });
  }
}

