//src\lib\analyze-enhanced.ts

import { ChatMessage, AnalysisResult, Flag, FlagCategory, TimelineEvent } from '@/types';
import OpenAI from 'openai';

// Initialize the OpenAI client.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ConversationContext {
  userMessages: ChatMessage[];
  matchMessages: ChatMessage[];
  totalMessages: number;
  conversationDuration: string;
}

// --- MAIN ANALYSIS FUNCTION ---

export async function analyzeConversationWithContext(
  messages: ChatMessage[],
  metadata?: { platform?: string; userPosition?: 'left' | 'right'; }
): Promise<AnalysisResult> {

  const context = createConversationContext(messages);
  
  const [
    rawFlagsResult,
    communicationPatterns,
    emotionalProgression,
    consistencyAnalysis
  ] = await Promise.all([
    detectRawFlags(context),
    analyzeCommunicationPatterns(context),
    analyzeEmotionalProgression(messages), // This function calculates escalation
    analyzeConsistencyWithAI(messages),
  ]);

  const { rawRedFlags, greenFlags } = rawFlagsResult;

  const redFlags = await enrichFlagsWithAIContext(rawRedFlags, messages, context, communicationPatterns);
  const behaviorAnalysis = { redFlags, greenFlags, consistency: consistencyAnalysis };
  
  const safetyAssessment = performSafetyAssessment(behaviorAnalysis);
  // This function calculates the final scores
  const scores = calculateContextualScores(behaviorAnalysis, safetyAssessment, emotionalProgression);
  const suggestedReplies = generateContextualReplies(behaviorAnalysis);

  return {
    id: generateAnalysisId(),
    createdAt: new Date(),
    chatContent: messages,
    riskScore: scores.risk,
    trustScore: scores.trust,
    escalationIndex: scores.escalation,
    flags: [...redFlags, ...greenFlags],
    timeline: emotionalProgression.timeline,
    reciprocityScore: communicationPatterns.reciprocity,
    consistencyAnalysis: behaviorAnalysis.consistency,
    suggestedReplies,
    evidence: extractDetailedEvidence(behaviorAnalysis),
  };
}

// --- All other functions are included below for completeness ---

async function enrichFlagsWithAIContext(rawFlags: Flag[], messages: ChatMessage[], context: ConversationContext, communicationPatterns: any): Promise<Flag[]> {
  if (rawFlags.length === 0) {
    return [];
  }

  const conversationTranscript = messages.map(msg => `${msg.sender.toUpperCase()}: ${msg.content}`).join('\n');
  
  const flagsToAnalyze = rawFlags.map(flag => {
    const messageIndex = messages.findIndex(m => m.id === flag.messageId);
    return {
      id: flag.id,
      category: flag.category,
      message: flag.message,
      context: `Detected at message #${messageIndex + 1} of ${messages.length}.`,
    };
  });

  try {
    const prompt = `
      You are a world-class dating safety expert. Your task is to analyze EACH detected pattern within the FULL CONTEXT of the provided conversation summary and transcript.

      ---
      CONVERSATION METADATA:
      - Total Duration: ${context.conversationDuration}
      - Total Messages: ${context.totalMessages}
      - User Messages: ${context.userMessages.length} (${communicationPatterns.reciprocity.averageMessageLengthUser.toFixed(0)} avg chars)
      - Match Messages: ${context.matchMessages.length} (${communicationPatterns.reciprocity.averageMessageLengthMatch.toFixed(0)} avg chars)
      - Conversation Balance Score: ${communicationPatterns.reciprocity.balanceScore}/100
      ---
      CONVERSATION TRANSCRIPT:
      ---
      ${conversationTranscript}
      ---
      DETECTED PATTERNS TO ANALYZE:
      ---
      ${JSON.stringify(flagsToAnalyze, null, 2)}
      ---

      INSTRUCTIONS:
      Based on ALL of the above information, provide a JSON object where each key is a flag 'id'. 
      The value for each key should be an object containing three properties:
      1. "meaning": For a RED flag, explain the risk. For a GREEN flag, explain why it's a positive sign. Your explanation MUST be tailored to the conversation's context.
      2. "whatToDo": For a RED flag, give actionable safety advice. For a GREEN flag, suggest how the user can encourage this positive behavior.
      3. "aiSuggestedReply": An object with "content" (a specific reply) and "tone" (e.g., "Positive", "Assertive").

      Your entire response must be ONLY the valid JSON object.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });
    
    const enrichedData = JSON.parse(response.choices[0].message.content || '{}');

    return rawFlags.map(flag => {
      if (enrichedData[flag.id]) {
        return { ...flag, ...enrichedData[flag.id] };
      }
      return flag;
    });

  } catch (error) {
    console.error('Full-context AI enrichment failed:', error);
    return rawFlags;
  }
}

async function analyzeConsistencyWithAI(messages: ChatMessage[]): Promise<any> {
    const conversationTranscript = messages.map(msg => `${msg.sender.toUpperCase()}: ${msg.content}`).join('\n');

  try {
    const prompt = `
      You are a meticulous analyst. Your task is to analyze the following conversation transcript for factual consistency.

      INSTRUCTIONS:
      1.  Identify all factual claims made by the 'MATCH' (e.g., "I work as a doctor," "I lived in Paris for 3 years").
      2.  Compare all claims to find any contradictions.
      3.  Based on your findings, calculate a 'stabilityIndex' from 0 (very inconsistent) to 100 (perfectly consistent).
      4.  Create a concise, natural language 'summary' of your findings.
      5.  Return a JSON object with four keys: "claims", "inconsistencies", "stabilityIndex", and "summary".
      
      Your entire response must be ONLY the valid JSON object. If no claims are found, return empty arrays.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });
    
    const content = response.choices[0].message.content;
    const parsedResult = content ? JSON.parse(content) : null;

    if (parsedResult && typeof parsedResult.stabilityIndex === 'number') {
      return parsedResult;
    }
    throw new Error("AI response for consistency analysis was not in the expected format.");

  } catch (error) {
    console.error('AI consistency analysis failed:', error);
    return { claims: [], inconsistencies: [], stabilityIndex: 100, summary: "Could not perform consistency analysis." };
  }
}

function detectRawFlags(context: ConversationContext): { rawRedFlags: Flag[], greenFlags: Flag[] } {
  const rawRedFlags: Flag[] = [];
  const greenFlags: Flag[] = [];

  context.matchMessages.forEach((msg) => {
    const content = msg.content.toLowerCase();
    
    if (checkFinancialRedFlags(content)) {
      rawRedFlags.push(createFlag('red', 'financial_ask', 'high', 'Potential financial request', msg));
    }
    if (checkLoveBombing(content)) {
      rawRedFlags.push(createFlag('red', 'love_bombing', 'high', 'Excessive early affection (love bombing)', msg));
    }
    if (checkOffPlatformPush(content)) {
      rawRedFlags.push(createFlag('red', 'off_platform_push', 'medium', 'Attempt to move conversation off-platform', msg));
    }
    if (checkUrgencyPressure(content)) {
      rawRedFlags.push(createFlag('red', 'urgency_pressure', 'medium', 'Creating false urgency or pressure', msg));
    }
    
    if (checkGenuineInterest(content)) {
        greenFlags.push(createFlag('green', 'asks_reciprocal_questions', 'low', 'Asks thoughtful questions', msg));
    }
    if (checkRespectfulBehavior(content)) {
        greenFlags.push(createFlag('green', 'respects_pace', 'low', 'Respects your pace and comfort', msg));
    }
  });

  return { rawRedFlags, greenFlags };
}

function createConversationContext(messages: ChatMessage[]): ConversationContext {
  const userMessages = messages.filter(m => m.sender === 'user');
  const matchMessages = messages.filter(m => m.sender === 'match');
  let conversationDuration = "Less than an hour";

  if (messages.length > 1) {
    const firstMsgTime = messages[0].timestamp.getTime();
    const lastMsgTime = messages[messages.length - 1].timestamp.getTime();
    const durationMinutes = (lastMsgTime - firstMsgTime) / (1000 * 60);

    if (durationMinutes > 60 * 24) {
      const days = Math.round(durationMinutes / (60 * 24));
      conversationDuration = `${days} day${days > 1 ? 's' : ''}`;
    } else if (durationMinutes > 60) {
      const hours = Math.round(durationMinutes / 60);
      conversationDuration = `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (durationMinutes > 0) {
      const minutes = Math.round(durationMinutes);
      conversationDuration = `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  }
  
  return { userMessages, matchMessages, totalMessages: messages.length, conversationDuration };
}

function analyzeCommunicationPatterns(context: ConversationContext): any {
  const { userMessages, matchMessages } = context;
  const reciprocity = {
    questionsAskedByUser: countQuestions(userMessages),
    questionsAskedByMatch: countQuestions(matchMessages),
    personalInfoSharedByUser: countPersonalInfo(userMessages),
    personalInfoSharedByMatch: countPersonalInfo(matchMessages),
    averageMessageLengthUser: calculateAverageLength(userMessages),
    averageMessageLengthMatch: calculateAverageLength(matchMessages),
    balanceScore: 50,
  };
  const questionBalance = (reciprocity.questionsAskedByMatch + 1) / (reciprocity.questionsAskedByUser + 1);
  const lengthBalance = (reciprocity.averageMessageLengthMatch + 1) / (reciprocity.averageMessageLengthUser + 1);
  reciprocity.balanceScore = Math.min(100, Math.round(50 * (Math.min(questionBalance, 2) / 2 + Math.min(lengthBalance, 2) / 2)));
  return { reciprocity };
}

function analyzeEmotionalProgression(messages: ChatMessage[]): any {
    const timeline: TimelineEvent[] = [];
    if (messages.length > 0) {
        timeline.push({
            timestamp: new Date(messages[0].timestamp),
            type: 'emotional_shift',
            from: 'neutral', to: 'neutral',
            description: 'Conversation started',
        });
    }

    messages.forEach((msg, index) => {
        if (detectEscalation(msg.content, index, messages)) {
            timeline.push({
                timestamp: new Date(msg.timestamp),
                type: 'escalation',
                from: 'casual' as any,
                to: 'intimate' as any,
                description: `${msg.sender === 'user' ? 'You' : 'Match'} escalated the conversation`,
            });
        }
    });

    return { timeline };
}

function performSafetyAssessment(behaviorAnalysis: any): any {
    let overallRisk: 'low' | 'medium' | 'high' = 'low';
    if (behaviorAnalysis.redFlags.some((f: Flag) => f.severity === 'high')) {
        overallRisk = 'high';
    } else if (behaviorAnalysis.redFlags.length > 2) {
        overallRisk = 'medium';
    }
    return { overallRisk };
}

function calculateContextualScores(behavior: any, safety: any, emotional: any): any {
  let riskScore = behavior.redFlags.filter((f: Flag) => f.severity === 'high').length * 30;
  riskScore += behavior.redFlags.filter((f: Flag) => f.severity === 'medium').length * 15;
  riskScore += behavior.redFlags.filter((f: Flag) => f.severity === 'low').length * 5;
  
  let trustScore = 50 + (behavior.greenFlags.length * 10) - (behavior.redFlags.length * 15);

  const escalationEvents = emotional.timeline.filter((e: TimelineEvent) => e.type === 'escalation').length;
  const escalationIndex = Math.min(100, escalationEvents * 25);

  return {
    risk: Math.min(100, Math.max(0, riskScore)),
    trust: Math.min(100, Math.max(0, trustScore)),
    escalation: escalationIndex,
  };
}

function generateContextualReplies(behavior: any): any[] {
  const replies = [];
  const financialFlag = behavior.redFlags.find((f: Flag) => f.category === 'financial_ask');
  if (financialFlag && financialFlag.aiSuggestedReply) {
    replies.push({
      id: 'reply-financial',
      tone: financialFlag.aiSuggestedReply.tone,
      content: financialFlag.aiSuggestedReply.content,
      context: 'AI-suggested response to financial requests',
    });
  }
  replies.push({
    id: 'reply-neutral',
    tone: 'friendly',
    content: "I'm enjoying our chat! Would you be up for a video call sometime?",
    context: 'Suggesting a safe next step',
  });
  return replies;
}

function extractDetailedEvidence(behavior: any): any[] {
  return [...behavior.redFlags, ...behavior.greenFlags].map((flag: Flag) => ({
    id: `evidence-${flag.id}`, messageId: flag.messageId,
    startIndex: 0, endIndex: flag.evidence?.length || 0,
    text: flag.evidence, flagId: flag.id, explanation: flag.message,
  }));
}

function generateAnalysisId(): string {
  return `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function detectEscalation(content: string, index: number, messages: ChatMessage[]): boolean {
    const escalationPhrases = ['meet up', 'date', 'get a drink', 'my place', 'your place', 'get together', 'video call', 'facetime', 'phone number'];
    if (index < (messages.length / 2) && index < 15) {
        return escalationPhrases.some(phrase => content.toLowerCase().includes(phrase));
    }
    return false;
}

function checkFinancialRedFlags(content: string): boolean {
  const keywords = ['money', 'send', 'wire', 'loan', 'invest', 'crypto', 'gift card', 'emergency', 'financial', 'venmo', 'cashapp', 'zelle', 'paypal'];
  return keywords.some(keyword => content.includes(keyword));
}

function checkLoveBombing(content: string): boolean {
  const phrases = ['love you', 'soulmate', 'destiny', 'meant to be', 'never felt this', 'perfect', 'dream come true', 'marry'];
  return phrases.some(phrase => content.includes(phrase));
}

function checkOffPlatformPush(content: string): boolean {
  const keywords = ['whatsapp', 'telegram', 'text me', 'call me', 'email', 'hangouts', 'kik', 'snapchat', 'instagram'];
  return keywords.some(keyword => content.includes(keyword));
}

function checkUrgencyPressure(content: string): boolean {
  const phrases = ['right now', 'urgent', 'immediately', 'quick', 'hurry', 'asap', 'time sensitive'];
  return phrases.some(phrase => content.includes(phrase));
}

function checkGenuineInterest(content: string): boolean {
  const phrases = ['how about you', 'what do you', 'tell me about', 'what\'s your', 'do you enjoy', 'favorite'];
  return phrases.some(phrase => content.includes(phrase)) && content.includes('?');
}

function checkRespectfulBehavior(content: string): boolean {
  const phrases = ['no problem', 'understand', 'take your time', 'whenever you\'re ready', 'no rush', 'respect'];
  return phrases.some(phrase => content.includes(phrase));
}

function createFlag(type: 'red' | 'green', category: FlagCategory, severity: 'low' | 'medium' | 'high', message: string, chatMessage: ChatMessage): Flag {
  return { id: `flag-${Date.now()}-${Math.random()}`, type, category, severity, message, evidence: chatMessage.content, messageId: chatMessage.id, confidence: 0.85 };
}

function countQuestions(messages: ChatMessage[]): number {
  return messages.filter(msg => msg.content.includes('?')).length;
}

function countPersonalInfo(messages: ChatMessage[]): number {
  const indicators = ['i work', 'i live', 'my job', 'my family', 'i like', 'my hobbies', 'i am a', 'i study'];
  return messages.filter(msg => indicators.some(ind => msg.content.toLowerCase().includes(ind))).length;
}

function calculateAverageLength(messages: ChatMessage[]): number {
  if (messages.length === 0) return 0;
  const total = messages.reduce((sum, msg) => sum + msg.content.length, 0);
  return Math.round(total / messages.length);
}