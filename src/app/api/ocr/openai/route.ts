// src/app/api/ocr/openai/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChatMessage } from '@/types';

// Initialize the OpenAI client.
// Ensure OPENAI_API_KEY is set in your .env.local file.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Set the runtime to Node.js
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
    }

    // Convert the image file to a Base64 string for the API call
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString('base64');
    const mimeType = file.type;

    // This is the core instruction prompt for the AI model.
    // It's engineered to request a specific JSON structure.
    const prompt = `
      You are an expert OCR and conversation parsing AI. Your task is to analyze the provided screenshot of a dating app conversation.
      
      Instructions:
      1. Identify all messages in the conversation, correctly associating text with the sender.
      2. The user's messages are typically on the right side of the screen.
      3. The match's messages are on the left side.
      4. Extract the conversation into a valid JSON object with a single key "messages".
      5. The "messages" key should contain an array of message objects.
      6. Each object in the array must have two properties:
         - "sender": a string, which must be either 'user' or 'match'.
         - "content": a string, containing the full text of the message bubble.
      7. Order the messages chronologically from the top of the screenshot to the bottom.
      8. You MUST ignore all UI elements that are not part of a message bubble. This includes navigation bars, user profiles, text input fields, timestamps, and "online" indicators.
      9. If the image does not contain a discernible conversation, return an empty "messages" array.
    `;

    // Make the API call to OpenAI's Vision model (gpt-4o)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' }, // Enforce JSON output for reliability
      max_tokens: 3000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('OpenAI returned an empty response.');
    }

    const parsedJson = JSON.parse(content);
    const extractedMessages: ChatMessage[] = parsedJson.messages || [];

    if (!Array.isArray(extractedMessages)) {
        throw new Error('AI response was not in the expected format.');
    }

    // Add timestamp and ID to standardize the messages for the analysis step
    const formattedMessages: ChatMessage[] = extractedMessages.map((msg, index) => ({
        ...msg,
        id: `msg-${Date.now()}-${index}`,
        timestamp: new Date(Date.now() - (extractedMessages.length - index) * 60000), // Approximate timestamp
    }));

    return NextResponse.json({ messages: formattedMessages });

  } catch (error) {
    console.error('Error processing image with OpenAI:', error);
    return NextResponse.json(
      { error: 'Failed to analyze screenshot. The image might be unclear or not a conversation.' },
      { status: 500 }
    );
  }
}