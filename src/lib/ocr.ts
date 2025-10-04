import Tesseract from 'tesseract.js';
import { ChatMessage } from '@/types';

export interface OCRResult {
  text: string;
  confidence: number;
  messages: ChatMessage[];
}

export async function processImage(imageUrl: string): Promise<OCRResult> {
  try {
    const { data } = await Tesseract.recognize(imageUrl, 'eng', {
      logger: (m) => console.log(m),
    });

    // Parse the extracted text into chat messages
    const messages = parseTextToMessages(data.text);

    return {
      text: data.text,
      confidence: data.confidence,
      messages,
    };
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error('Failed to process image');
  }
}

function parseTextToMessages(text: string): ChatMessage[] {
  const lines = text.split('\n').filter((line) => line.trim());
  const messages: ChatMessage[] = [];
  
  // Common patterns for chat messages
  const patterns = {
    timestamp: /(\d{1,2}:\d{2}(?:\s*[AP]M)?)/i,
    sender: /^([^:]+):\s*(.+)$/,
  };

  let currentSender: 'user' | 'match' = 'match';
  let messageBuffer = '';
  let timestamp = new Date();

  for (const line of lines) {
    // Check if line contains timestamp
    const timestampMatch = line.match(patterns.timestamp);
    if (timestampMatch) {
      // Extract and parse timestamp
      timestamp = parseTimestamp(timestampMatch[1]);
      continue;
    }

    // Check if line contains sender and message
    const senderMatch = line.match(patterns.sender);
    if (senderMatch) {
      // Save previous message if exists
      if (messageBuffer) {
        messages.push({
          id: `msg-${messages.length}`,
          sender: currentSender,
          content: messageBuffer.trim(),
          timestamp,
        });
        messageBuffer = '';
      }

      // Determine sender (simplified - in real app, would need user config)
      currentSender = determineSender(senderMatch[1]);
      messageBuffer = senderMatch[2];
    } else {
      // Continue previous message
      messageBuffer += ' ' + line;
    }
  }

  // Add final message
  if (messageBuffer) {
    messages.push({
      id: `msg-${messages.length}`,
      sender: currentSender,
      content: messageBuffer.trim(),
      timestamp,
    });
  }

  return messages;
}

function parseTimestamp(timeStr: string): Date {
  // Simple timestamp parsing - in production, use more robust solution
  const now = new Date();
  const [time, period] = timeStr.split(/\s+/);
  const [hours, minutes] = time.split(':').map(Number);
  
  let adjustedHours = hours;
  if (period?.toUpperCase() === 'PM' && hours !== 12) {
    adjustedHours += 12;
  } else if (period?.toUpperCase() === 'AM' && hours === 12) {
    adjustedHours = 0;
  }

  now.setHours(adjustedHours, minutes, 0, 0);
  return now;
}

function determineSender(senderText: string): 'user' | 'match' {
  // In a real app, this would be configured by the user
  // For now, use simple heuristics
  const userIndicators = ['me', 'you', 'self'];
  const normalized = senderText.toLowerCase().trim();
  
  return userIndicators.some(indicator => normalized.includes(indicator)) 
    ? 'user' 
    : 'match';
}

// Redact personal information from text
export function redactPersonalInfo(text: string): string {
  // Patterns for personal information
  const patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /(\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    // Add more patterns as needed
  };

  let redactedText = text;
  
  // Replace with generic placeholders
  redactedText = redactedText.replace(patterns.email, '[EMAIL]');
  redactedText = redactedText.replace(patterns.phone, '[PHONE]');
  redactedText = redactedText.replace(patterns.ssn, '[SSN]');
  redactedText = redactedText.replace(patterns.creditCard, '[CARD]');

  return redactedText;
}