// src/types/index.ts

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
  ocrMetadata?: OCRMetadata;
  behavioralProfile?: BehavioralProfile;
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
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  evidence: string;
  messageId: string;
  confidence: number;

  // Enhanced contextual fields from AI analysis
  meaning?: string;                    // Detailed explanation of the pattern
  whatToDo?: string;                  // Actionable safety advice
  aiSuggestedReply?: {               // AI-generated safe response
    content: string;
    tone: string;
    purpose?: string;
  };
  psychologicalInsight?: string;      // What this reveals about intentions
  safetyLevel?: 'immediate_danger' | 'high_caution' | 'moderate_caution' | 'low_concern' | 'positive_sign';
  boundaryingSuggestion?: string;     // How to set boundaries
  additionalQuestions?: string[];     // Questions to test authenticity
  exitStrategy?: string;              // How to safely end communication if needed
  patternDescription?: string;        // How this behavior manifests
  manipulationTactic?: string;        // Specific manipulation technique if applicable
  contextualMessages?: string[];      // Other messages that contribute to this pattern
}

export type FlagCategory = 
  | 'financial_ask'
  | 'off_platform_push'
  | 'love_bombing'
  | 'urgency_pressure'
  | 'boundary_violation'
  | 'identity_inconsistency'
  | 'timezone_mismatch'
  | 'emotional_manipulation'
  | 'avoidance_pattern'
  | 'suspicious_behavior'
  | 'gaslighting'
  | 'isolation_attempt'
  | 'timeline_inconsistency'
  | 'guilt_tripping'
  | 'remembers_details'
  | 'asks_reciprocal_questions'
  | 'video_call_offer'
  | 'respects_pace'
  | 'patient_response'
  | 'genuine_interest'
  | 'respects_boundaries'
  | 'consistent_communication'
  | 'emotional_maturity'
  | 'transparency'
  | 'healthy_pacing'
  | 'mutual_respect'
  | 'supportive_behavior'
  | 'authentic_sharing'
  | 'appropriate_vulnerability';

export interface TimelineEvent {
  timestamp: Date;
  type: 'emotional_shift' | 'request' | 'escalation' | 'boundary_test' | 'trust_building' | 'red_flag' | 'green_flag';
  from?: EmotionalTone;
  to?: EmotionalTone;
  description: string;
  severity?: 'low' | 'medium' | 'high';
  relatedFlagId?: string;
}

export type EmotionalTone = 
  | 'neutral'
  | 'playful'
  | 'intimate'
  | 'urgent'
  | 'pressuring'
  | 'supportive'
  | 'defensive'
  | 'aggressive'
  | 'manipulative'
  | 'anxious'
  | 'confident'
  | 'vulnerable';

export interface ReciprocityAnalysis {
  questionsAskedByUser: number;
  questionsAskedByMatch: number;
  personalInfoSharedByUser: number;
  personalInfoSharedByMatch: number;
  averageMessageLengthUser: number;
  averageMessageLengthMatch: number;
  balanceScore: number; // 0-100, 50 = perfectly balanced
  responseTimeUser?: number; // Average response time in seconds
  responseTimeMatch?: number;
  initiationRatio?: { user: number; match: number };
  emotionalLabor?: { user: number; match: number };
}

export interface ConsistencyAnalysis {
  claims: FactualClaim[];
  inconsistencies: Inconsistency[];
  evasions?: Question[];
  stabilityIndex: number;
  summary?: string;
  suspiciousPatterns?: string[];
}

export interface FactualClaim {
  id: string;
  category: 'location' | 'job' | 'personal' | 'timeline' | 'identity' | 'lifestyle' | 'other';
  claim: string;
  messageId: string;
  timestamp: Date;
  confidence?: number;
}

export interface Inconsistency {
  id: string;
  claim1: FactualClaim;
  claim2: FactualClaim;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  type: 'contradiction' | 'timeline_impossible' | 'detail_change' | 'story_evolution';
}

export interface Question {
  id: string;
  question: string;
  messageId: string;
  responseType: 'deflected' | 'vague' | 'ignored' | 'answered';
  suspicionLevel: 'low' | 'medium' | 'high';
}

export interface SuggestedReply {
  id: string;
  tone: 'friendly' | 'neutral' | 'assertive' | 'cautious' | 'firm' | 'supportive';
  content: string;
  context: string;
  relatedFlagId?: string;
  purpose: string;
  safetyLevel: 'safe' | 'boundary_setting' | 'clarification' | 'de_escalation';
  followUpQuestions?: string[];
}

export interface Evidence {
  id: string;
  messageId: string;
  startIndex?: number;
  endIndex?: number;
  text: string;
  flagId: string;
  explanation: string;
  category?: FlagCategory;
  type?: 'red' | 'green';
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface BehavioralProfile {
  attachmentStyle?: 'secure' | 'anxious' | 'avoidant' | 'disorganized';
  communicationStyle?: 'assertive' | 'passive' | 'aggressive' | 'passive_aggressive';
  emotionalRegulation?: 'stable' | 'variable' | 'poor';
  boundaryRespect?: 'high' | 'medium' | 'low';
  authenticityLevel?: 'high' | 'medium' | 'low' | 'deceptive';
  powerDynamics?: 'balanced' | 'controlling' | 'submissive';
  personalityIndicators?: string[];
}

export interface OCRMetadata {
  platform?: string;
  confidence?: 'high' | 'medium' | 'low';
  extractionNotes?: string;
  visualCues?: string;
  messageCount?: number;
  extractionIssues?: string[];
}

export interface UploadedImage {
  id: string;
  url: string;
  originalName: string;
  processedText?: string;
  highlights?: ImageHighlight[];
  ocrResult?: OCRMetadata;
}

export interface ImageHighlight {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  flagId: string;
  type: 'red' | 'green';
}

export interface AnalysisRequest {
  type: 'text' | 'image';
  content: string;
  imageUrl?: string;
  metadata?: {
    platform?: string;
    userPosition?: 'left' | 'right';
  };
}

export interface User {
  id: string;
  email: string;
  createdAt: Date;
  subscription: 'free' | 'premium';
  analysisCount: number;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  fullName?: string;
  username?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  emailNotifications: boolean;
  privacyLevel: 'high' | 'medium' | 'low';
  autoSaveAnalyses: boolean;
}

export interface SavedAnalysis {
  id: string;
  userId: string;
  analysisResult: AnalysisResult;
  title: string;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatHistory {
  id: string;
  userId: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Export type guards for runtime checking
export function isRedFlag(flag: Flag): boolean {
  return flag.type === 'red';
}

export function isGreenFlag(flag: Flag): boolean {
  return flag.type === 'green';
}

export function isCriticalFlag(flag: Flag): boolean {
  return flag.severity === 'critical' || flag.safetyLevel === 'immediate_danger';
}

export function hasManipulationTactic(flag: Flag): boolean {
  return !!flag.manipulationTactic;
}