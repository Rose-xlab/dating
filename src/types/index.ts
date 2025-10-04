// Core Types for Dating Safety AI

export interface AnalysisResult {
  id: string;
  userId?: string;
  createdAt: Date;
  chatContent: ChatMessage[];
  riskScore: number;
  trustScore: number;
  escalationIndex: number;
  flags: Flag[];
  timeline: TimelineEvent[];
  reciprocityScore: ReciprocityAnalysis;
  consistencyAnalysis: ConsistencyAnalysis;
  suggestedReplies: SuggestedReply[];
  evidence: Evidence[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'match';
  content: string;
  timestamp: Date;
  redactedContent?: string;
}

export interface Flag {
  id: string;
  type: 'red' | 'green';
  category: FlagCategory;
  severity: 'low' | 'medium' | 'high';
  message: string;
  evidence: string;
  messageId: string;
  confidence: number;
}

export type FlagCategory = 
  | 'financial_ask'
  | 'off_platform_push'
  | 'love_bombing'
  | 'urgency_pressure'
  | 'boundary_violation'
  | 'identity_inconsistency'
  | 'timezone_mismatch'
  | 'remembers_details'
  | 'asks_reciprocal_questions'
  | 'video_call_offer'
  | 'respects_pace'
  | 'patient_response';

export interface TimelineEvent {
  timestamp: Date;
  type: 'emotional_shift' | 'request' | 'escalation';
  from: EmotionalTone;
  to: EmotionalTone;
  description: string;
}

export type EmotionalTone = 
  | 'neutral'
  | 'playful'
  | 'intimate'
  | 'urgent'
  | 'pressuring'
  | 'supportive'
  | 'defensive';

export interface ReciprocityAnalysis {
  questionsAskedByUser: number;
  questionsAskedByMatch: number;
  personalInfoSharedByUser: number;
  personalInfoSharedByMatch: number;
  averageMessageLengthUser: number;
  averageMessageLengthMatch: number;
  balanceScore: number; // 0-100, 50 = perfectly balanced
}

export interface ConsistencyAnalysis {
  claims: FactualClaim[];
  inconsistencies: Inconsistency[];
  stabilityIndex: number; // 0-100, higher = more consistent
}

export interface FactualClaim {
  id: string;
  category: 'location' | 'job' | 'personal' | 'timeline' | 'other';
  claim: string;
  messageId: string;
  timestamp: Date;
}

export interface Inconsistency {
  id: string;
  claim1: FactualClaim;
  claim2: FactualClaim;
  description: string;
}

export interface SuggestedReply {
  id: string;
  tone: 'friendly' | 'neutral' | 'assertive';
  content: string;
  context: string;
  relatedFlagId?: string;
}

export interface Evidence {
  id: string;
  messageId: string;
  startIndex: number;
  endIndex: number;
  text: string;
  flagId: string;
  explanation: string;
}

export interface UploadedImage {
  id: string;
  url: string;
  originalName: string;
  processedText?: string;
  highlights?: ImageHighlight[];
}

export interface ImageHighlight {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  flagId: string;
}

export interface AnalysisRequest {
  type: 'text' | 'image';
  content: string;
  imageUrl?: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: Date;
  subscription: 'free' | 'premium';
  analysisCount: number;
}

export interface SavedAnalysis {
  id: string;
  userId: string;
  analysisResult: AnalysisResult;
  title: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}