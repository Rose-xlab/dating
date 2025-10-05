import OpenAI from 'openai';
import { 
  AnalysisResult, 
  ChatMessage, 
  Flag, 
  TimelineEvent,
  ReciprocityAnalysis,
  ConsistencyAnalysis,
  SuggestedReply,
  Evidence,
  FlagCategory,
  EmotionalTone,
  FactualClaim,
  Inconsistency
} from '@/types';
import { DatingSafetyPromptBuilder, DATING_SAFETY_KNOWLEDGE } from '@/lib/prompt-builder';

// Check if API key is available
const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

if (!apiKey || apiKey === 'your_api_key_here') {
  console.warn('⚠️ OpenAI API key is not configured');
  console.warn('To enable AI analysis, add OPENAI_API_KEY to your .env.local file');
  console.warn('Get your API key from: https://platform.openai.com/api-keys');
}

const openai = apiKey && apiKey !== 'your_api_key_here' ? new OpenAI({
  apiKey: apiKey,
}) : null;

export async function analyzeConversation(messages: ChatMessage[]): Promise<AnalysisResult> {
  try {
    // If no OpenAI client, use mock analysis
    if (!openai) {
      console.log('Using mock analysis (no API key configured)');
      return await generateMockAnalysis(messages);
    }

    // Prepare conversation for analysis
    const conversationText = messages
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');

    // Run multiple analysis passes in parallel
    const [
      riskAnalysis,
      trustAnalysis,
      timelineAnalysis,
      reciprocityAnalysis,
      consistencyAnalysis,
      suggestedReplies,
    ] = await Promise.all([
      analyzeRisks(conversationText, messages),
      analyzeTrustSignals(conversationText, messages),
      analyzeTimeline(messages),
      analyzeReciprocity(messages),
      analyzeConsistency(messages),
      generateSuggestedReplies(conversationText, messages),
    ]);

    // Calculate scores
    const riskScore = calculateRiskScore(riskAnalysis.redFlags);
    const trustScore = calculateTrustScore(riskAnalysis.greenFlags);
    const escalationIndex = calculateEscalationIndex(timelineAnalysis);

    // Combine all flags
    const allFlags = [...riskAnalysis.redFlags, ...riskAnalysis.greenFlags];

    // Extract evidence
    const evidence = extractEvidence(messages, allFlags);

    return {
      id: generateId(),
      createdAt: new Date(),
      chatContent: messages,
      riskScore,
      trustScore,
      escalationIndex,
      flags: allFlags,
      timeline: timelineAnalysis,
      reciprocityScore: reciprocityAnalysis,
      consistencyAnalysis,
      suggestedReplies,
      evidence,
    };
  } catch (error) {
    console.error('Analysis error:', error);
    // Fallback to mock analysis on error
    return await generateMockAnalysis(messages);
  }
}

async function analyzeRisks(text: string, messages: ChatMessage[]) {
  if (!openai) {
    return generateMockRiskAnalysis(messages);
  }

  // Use the comprehensive prompt builder
  const prompt = DatingSafetyPromptBuilder.getAnalysisPrompt(messages);

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    messages: [
      { 
        role: 'system', 
        content: DatingSafetyPromptBuilder.getSystemPrompt() 
      },
      { 
        role: 'user', 
        content: prompt 
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  
  // Convert to Flag objects
  const redFlags: Flag[] = result.redFlags.map((flag: any, index: number) => ({
    id: `red-${index}`,
    type: 'red' as const,
    category: flag.category as FlagCategory,
    severity: flag.severity,
    message: flag.message,
    evidence: flag.evidence,
    messageId: messages[flag.messageIndex]?.id || 'unknown',
    confidence: 0.85,
  }));

  const greenFlags: Flag[] = result.greenFlags.map((flag: any, index: number) => ({
    id: `green-${index}`,
    type: 'green' as const,
    category: flag.category as FlagCategory,
    severity: flag.severity,
    message: flag.message,
    evidence: flag.evidence,
    messageId: messages[flag.messageIndex]?.id || 'unknown',
    confidence: 0.85,
  }));

  return { redFlags, greenFlags };
}

async function analyzeTrustSignals(text: string, messages: ChatMessage[]) {
  // Additional trust signal analysis
  // This would be implemented similarly to analyzeRisks
  return { trustSignals: [] };
}

async function analyzeTimeline(messages: ChatMessage[]): Promise<TimelineEvent[]> {
  if (!openai) {
    return generateMockTimeline(messages);
  }

  const prompt = `Analyze the emotional progression and timeline of this conversation.

Messages:
${messages.map((msg, i) => `${i}: ${msg.sender}: ${msg.content}`).join('\n')}

Identify emotional shifts, escalations, and significant events. Return a JSON array of timeline events:
[
  {
    "messageIndex": 0,
    "type": "emotional_shift|request|escalation",
    "from": "neutral|playful|intimate|urgent|pressuring|supportive|defensive",
    "to": "neutral|playful|intimate|urgent|pressuring|supportive|defensive",
    "description": "Description of the shift"
  }
]`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const events = JSON.parse(response.choices[0].message.content || '[]');
  
  return events.map((event: any) => ({
    timestamp: messages[event.messageIndex]?.timestamp || new Date(),
    type: event.type,
    from: event.from as EmotionalTone,
    to: event.to as EmotionalTone,
    description: event.description,
  }));
}

async function analyzeReciprocity(messages: ChatMessage[]): Promise<ReciprocityAnalysis> {
  const userMessages = messages.filter(m => m.sender === 'user');
  const matchMessages = messages.filter(m => m.sender === 'match');

  // Count questions (simple heuristic - contains "?")
  const questionsAskedByUser = userMessages.filter(m => m.content.includes('?')).length;
  const questionsAskedByMatch = matchMessages.filter(m => m.content.includes('?')).length;

  // Count personal info shares (simple heuristic - contains "I" statements)
  const personalInfoSharedByUser = userMessages.filter(m => /\bI\s+\w+/i.test(m.content)).length;
  const personalInfoSharedByMatch = matchMessages.filter(m => /\bI\s+\w+/i.test(m.content)).length;

  // Calculate average message lengths
  const averageMessageLengthUser = userMessages.reduce((sum, m) => sum + m.content.length, 0) / (userMessages.length || 1);
  const averageMessageLengthMatch = matchMessages.reduce((sum, m) => sum + m.content.length, 0) / (matchMessages.length || 1);

  // Calculate balance score (0-100, 50 = perfect balance)
  const questionBalance = Math.abs(50 - (questionsAskedByUser / (questionsAskedByUser + questionsAskedByMatch || 1) * 100));
  const infoBalance = Math.abs(50 - (personalInfoSharedByUser / (personalInfoSharedByUser + personalInfoSharedByMatch || 1) * 100));
  const lengthBalance = Math.abs(50 - (averageMessageLengthUser / (averageMessageLengthUser + averageMessageLengthMatch || 1) * 100));
  
  const balanceScore = 100 - ((questionBalance + infoBalance + lengthBalance) / 3);

  return {
    questionsAskedByUser,
    questionsAskedByMatch,
    personalInfoSharedByUser,
    personalInfoSharedByMatch,
    averageMessageLengthUser,
    averageMessageLengthMatch,
    balanceScore: Math.round(balanceScore),
  };
}

async function analyzeConsistency(messages: ChatMessage[]): Promise<ConsistencyAnalysis> {
  if (!openai) {
    return generateMockConsistency(messages);
  }

  const prompt = `Extract factual claims from this conversation and identify any inconsistencies.

Messages:
${messages.map((msg, i) => `${i}: ${msg.sender}: ${msg.content}`).join('\n')}

Return a JSON object:
{
  "claims": [
    {
      "category": "location|job|personal|timeline|other",
      "claim": "The specific claim made",
      "messageIndex": 0
    }
  ],
  "inconsistencies": [
    {
      "claim1Index": 0,
      "claim2Index": 1,
      "description": "How these claims contradict"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  
  const claims: FactualClaim[] = result.claims?.map((claim: any, index: number) => ({
    id: `claim-${index}`,
    category: claim.category,
    claim: claim.claim,
    messageId: messages[claim.messageIndex]?.id || 'unknown',
    timestamp: messages[claim.messageIndex]?.timestamp || new Date(),
  })) || [];

  const inconsistencies: Inconsistency[] = result.inconsistencies?.map((inc: any, index: number) => ({
    id: `inconsistency-${index}`,
    claim1: claims[inc.claim1Index],
    claim2: claims[inc.claim2Index],
    description: inc.description,
  })) || [];

  // Calculate stability index (100 = no inconsistencies)
  const stabilityIndex = Math.round(100 - (inconsistencies.length / Math.max(claims.length, 1)) * 100);

  return {
    claims,
    inconsistencies,
    stabilityIndex,
  };
}

async function generateSuggestedReplies(text: string, messages: ChatMessage[]): Promise<SuggestedReply[]> {
  if (!openai) {
    return generateMockSuggestedReplies(messages);
  }

  const lastMessage = messages[messages.length - 1];
  
  if (!lastMessage || lastMessage.sender === 'user') {
    return [];
  }

  const prompt = `Generate safe replies to this message in three tones (friendly, neutral, assertive).
  
Context: This is a dating app conversation. The last message needs a response.
Last message: "${lastMessage.content}"

Consider any red flags or concerning behavior in the conversation.

Return JSON array:
[
  {
    "tone": "friendly|neutral|assertive",
    "content": "The suggested reply",
    "context": "Why this reply is appropriate"
  }
]`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  });

  const replies = JSON.parse(response.choices[0].message.content || '[]');
  
  return replies.map((reply: any, index: number) => ({
    id: `reply-${index}`,
    tone: reply.tone,
    content: reply.content,
    context: reply.context,
  }));
}

// Mock functions for when OpenAI is not available
async function generateMockAnalysis(messages: ChatMessage[]): Promise<AnalysisResult> {
  const mockRiskAnalysis = generateMockRiskAnalysis(messages);
  const mockTimeline = generateMockTimeline(messages);
  const mockReciprocity = await analyzeReciprocity(messages);
  const mockConsistency = generateMockConsistency(messages);
  const mockSuggestions = generateMockSuggestedReplies(messages);
  
  const riskScore = calculateRiskScore(mockRiskAnalysis.redFlags);
  const trustScore = calculateTrustScore(mockRiskAnalysis.greenFlags);
  const escalationIndex = calculateEscalationIndex(mockTimeline);
  
  const allFlags = [...mockRiskAnalysis.redFlags, ...mockRiskAnalysis.greenFlags];
  const evidence = extractEvidence(messages, allFlags);

  return {
    id: generateId(),
    createdAt: new Date(),
    chatContent: messages,
    riskScore,
    trustScore,
    escalationIndex,
    flags: allFlags,
    timeline: mockTimeline,
    reciprocityScore: mockReciprocity,
    consistencyAnalysis: mockConsistency,
    suggestedReplies: mockSuggestions,
    evidence,
  };
}

function generateMockRiskAnalysis(messages: ChatMessage[]) {
  const redFlags: Flag[] = [];
  const greenFlags: Flag[] = [];

  // Simple heuristic-based analysis
  messages.forEach((message, index) => {
    const content = message.content.toLowerCase();
    
    // Check for red flags
    if (content.includes('money') || content.includes('send') || content.includes('wire')) {
      redFlags.push({
        id: `red-${redFlags.length}`,
        type: 'red',
        category: 'financial_ask' as FlagCategory,
        severity: 'high',
        message: 'Potential financial request detected',
        evidence: message.content.substring(0, 100),
        messageId: message.id,
        confidence: 0.7,
      });
    }
    
    if (content.includes('whatsapp') || content.includes('telegram') || content.includes('off app')) {
      redFlags.push({
        id: `red-${redFlags.length}`,
        type: 'red',
        category: 'off_platform_push' as FlagCategory,
        severity: 'medium',
        message: 'Attempt to move conversation off platform',
        evidence: message.content.substring(0, 100),
        messageId: message.id,
        confidence: 0.8,
      });
    }

    // Check for green flags
    if (content.includes('?') && message.sender === 'match') {
      greenFlags.push({
        id: `green-${greenFlags.length}`,
        type: 'green',
        category: 'asks_reciprocal_questions' as FlagCategory,
        severity: 'low',
        message: 'Shows interest by asking questions',
        evidence: message.content.substring(0, 100),
        messageId: message.id,
        confidence: 0.6,
      });
    }
  });

  return { redFlags, greenFlags };
}

function generateMockTimeline(messages: ChatMessage[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  let currentTone: EmotionalTone = 'neutral';

  messages.forEach((message, index) => {
    const content = message.content.toLowerCase();
    let newTone: EmotionalTone = currentTone;

    if (content.includes('love') || content.includes('miss') || content.includes('baby')) {
      newTone = 'intimate';
    } else if (content.includes('urgent') || content.includes('now') || content.includes('quick')) {
      newTone = 'urgent';
    } else if (content.includes('?')) {
      newTone = 'playful';
    }

    if (newTone !== currentTone) {
      events.push({
        timestamp: message.timestamp,
        type: 'emotional_shift',
        from: currentTone,
        to: newTone,
        description: `Emotional tone shifted from ${currentTone} to ${newTone}`,
      });
      currentTone = newTone;
    }
  });

  return events;
}

function generateMockConsistency(messages: ChatMessage[]): ConsistencyAnalysis {
  const claims: FactualClaim[] = [];
  const inconsistencies: Inconsistency[] = [];

  // Simple extraction of claims
  messages.forEach((message, index) => {
    const content = message.content;
    
    if (content.includes('I live') || content.includes('I\'m from')) {
      claims.push({
        id: `claim-${claims.length}`,
        category: 'location',
        claim: content,
        messageId: message.id,
        timestamp: message.timestamp,
      });
    }
    
    if (content.includes('I work') || content.includes('my job')) {
      claims.push({
        id: `claim-${claims.length}`,
        category: 'job',
        claim: content,
        messageId: message.id,
        timestamp: message.timestamp,
      });
    }
  });

  const stabilityIndex = 100; // No inconsistencies detected in mock

  return { claims, inconsistencies, stabilityIndex };
}

function generateMockSuggestedReplies(messages: ChatMessage[]): SuggestedReply[] {
  const lastMessage = messages[messages.length - 1];
  
  if (!lastMessage || lastMessage.sender === 'user') {
    return [];
  }

  return [
    {
      id: 'reply-0',
      tone: 'friendly',
      content: 'That sounds interesting! I\'d love to hear more about that.',
      context: 'Shows interest while keeping the conversation going',
    },
    {
      id: 'reply-1',
      tone: 'neutral',
      content: 'Thanks for sharing. How long have you been interested in that?',
      context: 'Polite response that asks for more information',
    },
    {
      id: 'reply-2',
      tone: 'assertive',
      content: 'I appreciate you sharing, but I\'d prefer to keep chatting here for now.',
      context: 'Sets a boundary if needed',
    },
  ];
}

// Utility functions
function calculateRiskScore(redFlags: Flag[]): number {
  const weights = { low: 10, medium: 25, high: 40 };
  const totalWeight = redFlags.reduce((sum, flag) => sum + weights[flag.severity], 0);
  return Math.min(100, totalWeight);
}

function calculateTrustScore(greenFlags: Flag[]): number {
  const weights = { low: 10, medium: 20, high: 30 };
  const totalWeight = greenFlags.reduce((sum, flag) => sum + weights[flag.severity], 0);
  return Math.min(100, totalWeight);
}

function calculateEscalationIndex(timeline: TimelineEvent[]): number {
  const escalations = timeline.filter(event => event.type === 'escalation').length;
  const totalEvents = timeline.length || 1;
  return Math.round((escalations / totalEvents) * 100);
}

function extractEvidence(messages: ChatMessage[], flags: Flag[]): Evidence[] {
  const evidence: Evidence[] = [];
  
  flags.forEach(flag => {
    const message = messages.find(m => m.id === flag.messageId);
    if (message && flag.evidence) {
      const index = message.content.indexOf(flag.evidence);
      if (index !== -1) {
        evidence.push({
          id: `evidence-${evidence.length}`,
          messageId: message.id,
          startIndex: index,
          endIndex: index + flag.evidence.length,
          text: flag.evidence,
          flagId: flag.id,
          explanation: flag.message,
        });
      }
    }
  });
  
  return evidence;
}

function generateId(): string {
  return `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}