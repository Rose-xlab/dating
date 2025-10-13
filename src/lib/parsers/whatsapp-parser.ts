// src/lib/parsers/whatsapp-parser.ts
import { ChatMessage } from '@/types';

export interface WhatsAppParseResult {
  messages: ChatMessage[];
  metadata: {
    platform: 'whatsapp';
    totalCalls: number;
    deletedMessages: number;
    mediaMessages: number;
    editedMessages: number;
    senderNames: string[];
    harassmentIndicators: {
      excessiveCalls: boolean;
      callCount: number;
      deletedMessageCount: number;
      thirdPartyContact: boolean;
    };
  };
}

export function detectWhatsAppFormat(text: string): boolean {
  return text.includes('end-to-end encrypted') || 
         /^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2} -/.test(text.trim());
}

export function extractSenderNames(text: string): string[] {
  const senders = new Set<string>();
  const lines = text.split('\n');
  const messagePattern = /^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2} - ([^:]+): /;
  
  for (const line of lines) {
    const match = line.match(messagePattern);
    if (match && match[1] && !match[1].includes('end-to-end encrypted')) {
      senders.add(match[1].trim());
    }
  }
  
  return Array.from(senders);
}

export function parseWhatsAppExport(
  text: string, 
  userIdentifier: string
): WhatsAppParseResult {
  const lines = text.split('\n');
  const messages: ChatMessage[] = [];
  const metadata = {
    platform: 'whatsapp' as const,
    totalCalls: 0,
    deletedMessages: 0,
    mediaMessages: 0,
    editedMessages: 0,
    senderNames: [] as string[],
    harassmentIndicators: {
      excessiveCalls: false,
      callCount: 0,
      deletedMessageCount: 0,
      thirdPartyContact: false
    }
  };

  const messagePattern = /^(\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}) - ([^:]+): (.*)$/;
  const systemMessagePattern = /^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2} - (.+)$/;
  
  let currentMessage: string | null = null;
  let currentSender: 'user' | 'match' = 'match';
  let currentTimestamp: Date | null = null;
  let messageId = 0;

  // Collect all sender names first
  const senderSet = new Set<string>();
  
  for (const line of lines) {
    const match = line.match(messagePattern);
    if (match && match[2]) {
      senderSet.add(match[2].trim());
    }
  }
  metadata.senderNames = Array.from(senderSet);

  // Process messages
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check for system messages (encryption notice, etc.)
    const systemMatch = line.match(systemMessagePattern);
    if (systemMatch && !systemMatch[1].includes(': ')) {
      continue; // Skip system messages
    }

    const messageMatch = line.match(messagePattern);
    
    if (messageMatch) {
      // Save previous message if exists
      if (currentMessage !== null && currentTimestamp) {
        messages.push({
          id: `wa-msg-${messageId++}`,
          sender: currentSender,
          content: currentMessage,
          timestamp: currentTimestamp
        });
      }
      
      const [, timestamp, sender, content] = messageMatch;
      
      // Determine if this is user or match
      currentSender = sender.trim().toLowerCase() === userIdentifier.toLowerCase() ? 'user' : 'match';
      currentTimestamp = parseWhatsAppDate(timestamp);
      currentMessage = content;
      
      // Track special patterns
      if (!content || content.trim() === '') {
        metadata.totalCalls++;
        metadata.harassmentIndicators.callCount++;
        currentMessage = '[Call attempt]';
      } else if (content.includes('This message was deleted')) {
        metadata.deletedMessages++;
        metadata.harassmentIndicators.deletedMessageCount++;
      } else if (content.includes('<Media omitted>')) {
        metadata.mediaMessages++;
      } else if (content.includes('<This message was edited>')) {
        metadata.editedMessages++;
      }
      
      // Check for third-party contact mentions
      if (currentSender === 'match' && 
          (content.toLowerCase().includes('called your') || 
           content.toLowerCase().includes('told your') ||
           content.toLowerCase().includes('texted your') ||
           content.toLowerCase().includes('your mom') ||
           content.toLowerCase().includes('your friend'))) {
        metadata.harassmentIndicators.thirdPartyContact = true;
      }
    } else if (currentMessage !== null) {
      // This is a continuation of the previous message
      currentMessage += '\n' + line;
    }
  }
  
  // Don't forget the last message
  if (currentMessage !== null && currentTimestamp) {
    messages.push({
      id: `wa-msg-${messageId}`,
      sender: currentSender,
      content: currentMessage,
      timestamp: currentTimestamp
    });
  }

  // Set harassment indicators
  metadata.harassmentIndicators.excessiveCalls = metadata.totalCalls >= 10;
  
  return {
    messages,
    metadata
  };
}

function parseWhatsAppDate(dateStr: string): Date {
  // Parse "DD/MM/YYYY, HH:MM" format
  const [datePart, timePart] = dateStr.split(', ');
  const [day, month, year] = datePart.split('/').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  return new Date(year, month - 1, day, hours, minutes);
}