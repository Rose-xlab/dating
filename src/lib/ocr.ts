// src/lib/ocr.ts
// NOTE: This file is simplified. Image OCR is now handled by /api/ocr/openai

import { ChatMessage } from '@/types';

// Kept for type consistency across the app
export interface OCRResult {
  text: string;
  confidence: number;
  messages: ChatMessage[];
  metadata?: {
    platform?: string;
    extractionQuality: 'high' | 'medium' | 'low';
    userPosition?: 'left' | 'right';
    conversationFlow?: 'detected' | 'inferred';
  };
}

// This function is still useful for the "Paste Text" feature
export function redactPersonalInfo(text: string): string {
  const patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    address: /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Plaza|Pl)\b/gi,
    socialMedia: /@[A-Za-z0-9_]+/g,
    url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
    // A simplified list for example purposes
    firstName: /\b(John|Jane|Mike|Sarah|David|Emily|James|Jessica|Robert|Jennifer)\b/gi,
  };

  let redactedText = text;
  
  redactedText = redactedText.replace(patterns.email, '[EMAIL]');
  redactedText = redactedText.replace(patterns.phone, '[PHONE]');
  redactedText = redactedText.replace(patterns.ssn, '[SSN]');
  redactedText = redactedText.replace(patterns.creditCard, '[CARD]');
  redactedText = redactedText.replace(patterns.address, '[ADDRESS]');
  redactedText = redactedText.replace(patterns.socialMedia, '[SOCIAL]');
  redactedText = redactedText.replace(patterns.url, '[LINK]');
  redactedText = redactedText.replace(patterns.firstName, '[NAME]');

  return redactedText;
}

