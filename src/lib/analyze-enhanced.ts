import { ChatMessage, AnalysisResult, Flag, FlagCategory, TimelineEvent } from '@/types';
import OpenAI from 'openai';

// Initialize the OpenAI client.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ... (Interface definitions remain the same) ...
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
    flagsResult,
    consistencyAnalysis,
    comprehensiveAnalysis
  ] = await Promise.all([
    detectFlagsWithAI(messages), // This function now has the improved prompt
    analyzeConsistencyWithAI(messages),
    performComprehensiveAIAnalysis(messages, context),
  ]);

  const { rawRedFlags, greenFlags } = flagsResult;

  const redFlags = await enrichFlagsWithAIContext(rawRedFlags, messages, context, comprehensiveAnalysis.communicationPatterns);
  
  return {
    id: generateAnalysisId(),
    createdAt: new Date(),
    chatContent: messages,
    riskScore: comprehensiveAnalysis.scores.risk,
    trustScore: comprehensiveAnalysis.scores.trust,
    escalationIndex: comprehensiveAnalysis.scores.escalation,
    flags: [...redFlags, ...greenFlags],
    timeline: comprehensiveAnalysis.timeline,
    reciprocityScore: comprehensiveAnalysis.communicationPatterns.reciprocity,
    consistencyAnalysis: consistencyAnalysis,
    suggestedReplies: comprehensiveAnalysis.suggestedReplies,
    evidence: extractDetailedEvidence({ redFlags, greenFlags }),
  };
}

// --- CORE AI ANALYSIS FUNCTIONS ---

async function detectFlagsWithAI(messages: ChatMessage[]): Promise<{ rawRedFlags: Flag[], greenFlags: Flag[] }> {
  const conversationTranscript = messages.map(msg => `${msg.sender.toUpperCase()}: ${msg.content}`).join('\n');
  
  // --- THIS PROMPT HAS BEEN UPDATED FOR BETTER FOCUS ---
  const prompt = `
    You are a meticulous dating safety expert. Your task is to analyze the following conversation transcript to identify behavioral patterns.

    CRITICAL INSTRUCTION: Your analysis must focus exclusively on the person designated as 'MATCH'. Use the 'USER's messages for context only, but DO NOT generate flags based on the 'USER's behavior. The goal is to evaluate the other person.

    CONVERSATION:
    ---
    ${conversationTranscript}
    ---
    
    INSTRUCTIONS:
    Based on the 'MATCH' user's behavior, respond with a JSON object containing "red_flags" and "green_flags" arrays.
    
    For each red flag exhibited by the 'MATCH', create an object with:
    - "category": (e.g., 'pity_play', 'love_bombing', 'financial_ask', 'urgency_pressure')
    - "severity": ('low', 'medium', 'high')
    - "message": (a brief description of the flag)
    - "triggering_content": (the exact quote from the 'MATCH' that triggered the flag)

    For each green flag exhibited by the 'MATCH', create an object with:
    - "category": (e.g., 'genuine_interest', 'respects_pace')
    - "severity": "low"
    - "message": (a brief description of the flag)
    - "triggering_content": (the exact quote from the 'MATCH' that triggered the flag)

    If the 'MATCH' exhibits no notable behaviors, return empty arrays. Your response must be ONLY the valid JSON object.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });
    const parsed = JSON.parse(response.choices[0].message.content || '{"red_flags": [], "green_flags": []}');
    const rawRedFlags: Flag[] = [];
    const greenFlags: Flag[] = [];

    if (parsed.red_flags) {
      parsed.red_flags.forEach((flag: any) => {
        // Ensure the flagged content actually belongs to the match
        const originalMessage = messages.find(m => m.sender === 'match' && m.content === flag.triggering_content);
        if (originalMessage) rawRedFlags.push(createFlag('red', flag.category, flag.severity, flag.message, originalMessage));
      });
    }
    if (parsed.green_flags) {
      parsed.green_flags.forEach((flag: any) => {
        // Ensure the flagged content actually belongs to the match
        const originalMessage = messages.find(m => m.sender === 'match' && m.content === flag.triggering_content);
        if (originalMessage) greenFlags.push(createFlag('green', flag.category, 'low', flag.message, originalMessage));
      });
    }
    return { rawRedFlags, greenFlags };
  } catch (error) {
    console.error("AI flag detection failed:", error);
    return { rawRedFlags: [], greenFlags: [] };
  }
}

// ... (The rest of the file remains the same as the fully AI-enabled version) ...

async function analyzeConsistencyWithAI(messages: ChatMessage[]): Promise<any> {
  const conversationTranscript = messages.map(msg => `${msg.sender.toUpperCase()}: ${msg.content}`).join('\n');
  const prompt = `
    Analyze the conversation for factual consistency in claims made by the 'MATCH'.
    Return a JSON object with "claims", "inconsistencies", "stabilityIndex" (0-100), and a "summary".
    Your response must be ONLY the valid JSON object.
  `;
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });
    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('AI consistency analysis failed:', error);
    return { claims: [], inconsistencies: [], stabilityIndex: 100, summary: "Could not perform consistency analysis." };
  }
}

async function performComprehensiveAIAnalysis(messages: ChatMessage[], context: ConversationContext): Promise<any> {
    const conversationTranscript = messages.map(msg => `${msg.sender.toUpperCase()}: ${msg.content}`).join('\n');
    const prompt = `
      You are a senior behavioral analyst specializing in online dating. Analyze the following conversation transcript and metadata comprehensively, focusing on the 'MATCH' user's behavior.
      
      METADATA:
      - Total Duration: ${context.conversationDuration}
      - Total Messages: ${context.totalMessages}
      - User Messages: ${context.userMessages.length}
      - Match Messages: ${context.matchMessages.length}

      CONVERSATION:
      ---
      ${conversationTranscript}
      ---
      
      INSTRUCTIONS:
      Based on your holistic analysis of the 'MATCH', generate a JSON object with the following structure:
      1. "scores": An object with "risk", "trust", and "escalation" keys, each with a numerical value from 0 to 100.
      2. "communicationPatterns": An object containing a numerical "reciprocity" score (0-100) and a brief "summary" (string) of the communication style.
      3. "timeline": An array of key emotional turning points. Each object should have a "timestamp", "type", and a brief "description".
      4. "suggestedReplies": An array of 2-3 contextual reply suggestions for the user. Each object should have "tone" and "content".
      
      Your entire response must be ONLY the valid JSON object.
    `;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        });
        return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
        console.error('Comprehensive AI analysis failed:', error);
        return {
            scores: { risk: 50, trust: 50, escalation: 50 },
            communicationPatterns: { reciprocity: 50, summary: "Analysis could not be performed." },
            timeline: [],
            suggestedReplies: [{ tone: 'Neutral', content: "Sorry, I'm having trouble thinking of a reply right now." }]
        };
    }
}

async function enrichFlagsWithAIContext(rawFlags: Flag[], messages: ChatMessage[], context: ConversationContext, communicationPatterns: any): Promise<Flag[]> {
  if (rawFlags.length === 0) return [];
  const conversationTranscript = messages.map(msg => `${msg.sender.toUpperCase()}: ${msg.content}`).join('\n');
  const flagsToAnalyze = rawFlags.map(flag => ({ id: flag.id, category: flag.category, message: flag.message }));

  const prompt = `
    You are a dating safety expert. For each detected pattern exhibited by the 'MATCH', provide detailed context.
    CONVERSATION METADATA:
    - Duration: ${context.conversationDuration}
    - Balance Score: ${communicationPatterns.reciprocity}/100
    TRANSCRIPT:
    ---
    ${conversationTranscript}
    ---
    PATTERNS TO ANALYZE:
    ---
    ${JSON.stringify(flagsToAnalyze, null, 2)}
    ---
    INSTRUCTIONS:
    Return a JSON object where each key is a flag 'id'. The value should be an object with:
    1. "meaning": A tailored explanation of the risk or positive sign.
    2. "whatToDo": Actionable safety advice or encouragement.
    3. "aiSuggestedReply": An object with "content" and "tone".
    Your response must be ONLY the valid JSON object.
  `;
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });
    const enrichedData = JSON.parse(response.choices[0].message.content || '{}');
    return rawFlags.map(flag => enrichedData[flag.id] ? { ...flag, ...enrichedData[flag.id] } : flag);
  } catch (error) {
    console.error('Full-context AI enrichment failed:', error);
    return rawFlags;
  }
}

// --- UTILITY AND DATA PREPARATION FUNCTIONS ---

function createConversationContext(messages: ChatMessage[]): ConversationContext {
  const userMessages = messages.filter(m => m.sender === 'user');
  const matchMessages = messages.filter(m => m.sender === 'match');
  let conversationDuration = "Less than an hour";
  if (messages.length > 1 && messages[0].timestamp && messages[messages.length - 1].timestamp) {
    const firstMsgTime = new Date(messages[0].timestamp).getTime();
    const lastMsgTime = new Date(messages[messages.length - 1].timestamp).getTime();
    const durationMinutes = (lastMsgTime - firstMsgTime) / (1000 * 60);

    if (durationMinutes > 60 * 24) {
      const days = Math.round(durationMinutes / (60 * 24));
      conversationDuration = `${days} day${days > 1 ? 's' : ''}`;
    } else if (durationMinutes > 60) {
      const hours = Math.round(durationMinutes / 60);
      conversationDuration = `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (durationMinutes > 1) {
      const minutes = Math.round(durationMinutes);
      conversationDuration = `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  }
  return { userMessages, matchMessages, totalMessages: messages.length, conversationDuration };
}

function extractDetailedEvidence(behavior: { redFlags: Flag[], greenFlags: Flag[] }): any[] {
  return [...behavior.redFlags, ...behavior.greenFlags].map((flag: Flag) => ({
    id: `evidence-${flag.id}`,
    messageId: flag.messageId,
    text: flag.evidence,
    flagId: flag.id,
    explanation: flag.message,
  }));
}

function generateAnalysisId(): string {
  return `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function createFlag(type: 'red' | 'green', category: FlagCategory, severity: 'low' | 'medium' | 'high', message: string, chatMessage: ChatMessage): Flag {
  return {
    id: `flag-${Date.now()}-${Math.random()}`,
    type,
    category,
    severity,
    message,
    evidence: chatMessage.content,
    messageId: chatMessage.id,
    confidence: 0.95,
  };
}