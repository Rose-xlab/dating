import Tesseract from 'tesseract.js';
import { ChatMessage } from '@/types';

export interface OCRResult {
  text: string;
  confidence: number;
  messages: ChatMessage[];
  metadata?: {
    platform?: string;
    extractionQuality: 'high' | 'medium' | 'low';
  };
}

// Common dating app UI patterns
const DATING_APP_PATTERNS = {
  // Message patterns for different apps
  tinder: {
    message: /^(.+?)\s*(\d{1,2}:\d{2}\s*[AP]M)$/,
    dateSeparator: /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+.+$/i,
  },
  bumble: {
    message: /^(.+?)\s+(\d{1,2}:\d{2}\s*[AP]M)$/,
    sender: /(You|Them):/,
  },
  hinge: {
    message: /^(.+?)\s*(\d{1,2}:\d{2})$/,
    prompt: /^(Prompt:|Comment on)/i,
  },
  generic: {
    timestamp: /(\d{1,2}:\d{2}(?:\s*[AP]M)?)/i,
    sender: /^([^:]+):\s*(.+)$/,
    url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
  }
};

export async function processImage(imageUrl: string): Promise<OCRResult> {
  try {
    console.log('Starting OCR processing...');
    
    // Use Tesseract with basic settings
    const { data } = await Tesseract.recognize(imageUrl, 'eng', {
      logger: (m) => console.log(`OCR Progress: ${m.status} - ${m.progress}`),
    });

    console.log(`OCR completed with ${data.confidence}% confidence`);
    console.log('Extracted text:', data.text.substring(0, 200) + '...');

    // Use enhanced parsing if text was extracted
    if (data.text && data.text.trim().length > 0) {
      // Detect platform from text patterns
      const platform = detectPlatform(data.text);
      console.log('Detected platform:', platform || 'generic');

      // Parse messages based on detected platform
      const messages = parseMessagesAdvanced(data.text, platform);
      console.log(`Parsed ${messages.length} messages`);

      // Determine extraction quality
      const quality = data.confidence > 80 ? 'high' : data.confidence > 60 ? 'medium' : 'low' as const;

      return {
        text: data.text,
        confidence: data.confidence,
        messages,
        metadata: {
          platform,
          extractionQuality: quality,
        }
      };
    } else {
      // Fallback to simple parsing
      const messages = parseTextToMessages(data.text);
      return {
        text: data.text,
        confidence: data.confidence,
        messages,
      };
    }
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error('Failed to process image. Please ensure the image is clear and contains text.');
  }
}

function detectPlatform(text: string): string | undefined {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('tinder') || lowerText.includes('match')) {
    return 'tinder';
  } else if (lowerText.includes('bumble') || lowerText.includes('the question')) {
    return 'bumble';
  } else if (lowerText.includes('hinge') || lowerText.includes('prompt:')) {
    return 'hinge';
  }
  
  return undefined;
}

function parseMessagesAdvanced(text: string, platform?: string): ChatMessage[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const messages: ChatMessage[] = [];
  
  let currentSender: 'user' | 'match' = 'match';
  let messageBuffer = '';
  let currentTimestamp = new Date();
  let messageId = 0;

  // Track conversation context
  const context = {
    lastSender: null as 'user' | 'match' | null,
    isUserOnLeft: null as boolean | null,
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];
    
    // Skip UI elements and non-message text
    if (isUIElement(line)) {
      continue;
    }

    // Check for date separators
    if (isDateSeparator(line)) {
      currentTimestamp = parseDateSeparator(line) || currentTimestamp;
      continue;
    }

    // Try platform-specific parsing
    if (platform) {
      const platformMessage = parsePlatformSpecificMessage(line, platform, context);
      if (platformMessage && platformMessage.content && platformMessage.sender) {
        messages.push({
          id: `msg-${messageId++}`,
          sender: platformMessage.sender,
          content: platformMessage.content,
          timestamp: currentTimestamp,
        });
        context.lastSender = platformMessage.sender;
        continue;
      }
    }

    // Generic message parsing
    const genericMessage = parseGenericMessage(line, nextLine, context);
    if (genericMessage && genericMessage.content && genericMessage.sender) {
      messages.push({
        id: `msg-${messageId++}`,
        sender: genericMessage.sender,
        content: genericMessage.content,
        timestamp: currentTimestamp,
      });
      context.lastSender = genericMessage.sender;
    }
  }

  // Post-process to ensure sender alternation makes sense
  return postProcessMessages(messages);
}

// Simplified fallback parser
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

function isUIElement(text: string): boolean {
  const uiPatterns = [
    /^(type a message|send a message|message)/i,
    /^(online|active|typing|seen)/i,
    /^(back|menu|profile|settings)/i,
    /^\d+\s*(km|miles?)\s*away/i,
    /^(super like|like|nope)/i,
    /^(unmatch|report|block)/i,
  ];
  
  return uiPatterns.some(pattern => pattern.test(text));
}

function isDateSeparator(text: string): boolean {
  const datePatterns = [
    /^(today|yesterday|tomorrow)/i,
    /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/,
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  ];
  
  return datePatterns.some(pattern => pattern.test(text));
}

function parseDateSeparator(text: string): Date | null {
  const now = new Date();
  
  if (/today/i.test(text)) {
    return now;
  } else if (/yesterday/i.test(text)) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }
  
  // For other date formats, return null and keep current timestamp
  return null;
}

function parsePlatformSpecificMessage(
  line: string, 
  platform: string, 
  context: any
): { content?: string; sender?: 'user' | 'match' } | null {
  // Platform-specific parsing logic
  switch (platform) {
    case 'tinder':
      // Tinder typically shows messages with timestamps on the right
      const tinderMatch = line.match(/^(.+?)\s*(\d{1,2}:\d{2}\s*[AP]M?)$/);
      if (tinderMatch) {
        const [_, content, time] = tinderMatch;
        return {
          content: content.trim(),
          sender: determineSenderFromPosition(line, context),
        };
      }
      break;
      
    case 'bumble':
      // Bumble shows "You:" or just the message
      if (line.startsWith('You:')) {
        return {
          content: line.substring(4).trim(),
          sender: 'user',
        };
      }
      break;
  }
  
  return null;
}

function parseGenericMessage(
  line: string, 
  nextLine: string | undefined, 
  context: any
): { content?: string; sender?: 'user' | 'match' } | null {
  // Remove timestamps from the line
  const cleanedLine = line.replace(DATING_APP_PATTERNS.generic.timestamp, '').trim();
  
  // Skip empty results
  if (!cleanedLine) return null;
  
  // Check if it's a sender: message format
  const senderMatch = cleanedLine.match(/^([^:]+):\s*(.+)$/);
  if (senderMatch) {
    const [_, sender, content] = senderMatch;
    return {
      content: content.trim(),
      sender: determineSenderFromName(sender),
    };
  }
  
  // Otherwise, treat as a message and determine sender from context
  return {
    content: cleanedLine,
    sender: determineSenderFromContext(line, context),
  };
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

function determineSenderFromName(name: string): 'user' | 'match' {
  const userIndicators = ['me', 'you', 'i', 'self'];
  const normalized = name.toLowerCase().trim();
  
  if (userIndicators.includes(normalized)) {
    return 'user';
  }
  
  // Check for "You" specifically (capital Y)
  if (name.trim() === 'You') {
    return 'user';
  }
  
  return 'match';
}

function determineSenderFromPosition(line: string, context: any): 'user' | 'match' {
  // In many apps, messages on the right are from the user
  // This is a simplified heuristic - would need visual analysis for accuracy
  
  // If line starts with lots of spaces, might be right-aligned (user)
  const leadingSpaces = line.match(/^(\s*)/)?.[1]?.length || 0;
  if (leadingSpaces > 20) {
    return 'user';
  }
  
  // Alternate based on last sender
  if (context.lastSender) {
    return context.lastSender === 'user' ? 'match' : 'user';
  }
  
  return 'match';
}

function determineSenderFromContext(line: string, context: any): 'user' | 'match' {
  // Use context clues and alternation
  if (context.lastSender) {
    // Check if this seems like a continuation
    if (line.match(/^(and|but|or|so|also|anyway)/i)) {
      return context.lastSender;
    }
    // Otherwise alternate
    return context.lastSender === 'user' ? 'match' : 'user';
  }
  
  return 'match';
}

function postProcessMessages(messages: ChatMessage[]): ChatMessage[] {
  // Post-processing to improve message quality
  const processed: ChatMessage[] = [];
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    
    // Skip very short messages that might be artifacts
    if (msg.content.length < 2) continue;
    
    // Merge consecutive messages from same sender
    if (processed.length > 0) {
      const lastMsg = processed[processed.length - 1];
      if (lastMsg.sender === msg.sender && 
          msg.timestamp.getTime() - lastMsg.timestamp.getTime() < 60000) {
        // Merge messages
        lastMsg.content += ' ' + msg.content;
        continue;
      }
    }
    
    processed.push(msg);
  }
  
  return processed;
}

// Enhanced redaction function
export function redactPersonalInfo(text: string): string {
  const patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    address: /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Plaza|Pl)\b/gi,
    socialMedia: /@[A-Za-z0-9_]+/g,
    url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
  };

  let redactedText = text;
  
  redactedText = redactedText.replace(patterns.email, '[EMAIL]');
  redactedText = redactedText.replace(patterns.phone, '[PHONE]');
  redactedText = redactedText.replace(patterns.ssn, '[SSN]');
  redactedText = redactedText.replace(patterns.creditCard, '[CARD]');
  redactedText = redactedText.replace(patterns.address, '[ADDRESS]');
  redactedText = redactedText.replace(patterns.socialMedia, '[SOCIAL]');
  redactedText = redactedText.replace(patterns.url, '[LINK]');

  return redactedText;
}