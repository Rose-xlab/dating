import { ChatMessage, AnalysisResult } from '@/types';
import { DatingSafetyPromptBuilder } from '@/lib/prompt-builder';
import { AI_CONFIG } from '@/lib/ai-config';

// Enhanced analysis that actually looks at the conversation content
export async function analyzeConversationEnhanced(
  messages: ChatMessage[],
  metadata?: { platform?: string; extractionQuality?: string }
): Promise<AnalysisResult> {
  console.log(`Analyzing ${messages.length} messages...`);

  // Basic validation
  if (!messages || messages.length === 0) {
    throw new Error('No messages to analyze');
  }

  // Prepare conversation text with context
  const conversationContext = prepareConversationContext(messages, metadata);
  
  // Perform detailed analysis
  const analysis = await performDetailedAnalysis(conversationContext, messages);
  
  // Add platform-specific insights
  if (metadata?.platform) {
    // Store platform insights in the evidence array as additional context
    const platformInsights = getPlatformInsights(metadata.platform, messages);
    analysis.evidence = [
      ...analysis.evidence,
      {
        id: 'platform-insights',
        messageId: '',
        startIndex: 0,
        endIndex: 0,
        text: `Platform: ${metadata.platform}`,
        flagId: '',
        explanation: platformInsights.join('; '),
      }
    ];
  }

  return analysis;
}

function prepareConversationContext(messages: ChatMessage[], metadata?: any): string {
  let context = `Dating App Conversation Analysis
Platform: ${metadata?.platform || 'Unknown'}
Message Count: ${messages.length}
Time Span: ${getTimeSpan(messages)}

Conversation:
`;

  // Group messages by time periods for better context
  const groupedMessages = groupMessagesByTime(messages);
  
  groupedMessages.forEach(group => {
    context += `\n--- ${group.label} ---\n`;
    group.messages.forEach(msg => {
      const time = msg.timestamp.toLocaleTimeString();
      context += `[${time}] ${msg.sender.toUpperCase()}: ${msg.content}\n`;
    });
  });

  return context;
}

function getTimeSpan(messages: ChatMessage[]): string {
  if (messages.length < 2) return 'Single message';
  
  const first = messages[0].timestamp;
  const last = messages[messages.length - 1].timestamp;
  const diff = last.getTime() - first.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return 'Less than 1 hour';
}

function groupMessagesByTime(messages: ChatMessage[]): Array<{label: string, messages: ChatMessage[]}> {
  const groups: Array<{label: string, messages: ChatMessage[]}> = [];
  let currentGroup: ChatMessage[] = [];
  let lastTime = messages[0]?.timestamp;

  messages.forEach(msg => {
    const timeDiff = msg.timestamp.getTime() - lastTime.getTime();
    
    // If more than 1 hour gap, start new group
    if (timeDiff > 3600000) {
      if (currentGroup.length > 0) {
        groups.push({
          label: formatGroupLabel(currentGroup[0].timestamp),
          messages: currentGroup
        });
      }
      currentGroup = [msg];
    } else {
      currentGroup.push(msg);
    }
    
    lastTime = msg.timestamp;
  });

  // Add final group
  if (currentGroup.length > 0) {
    groups.push({
      label: formatGroupLabel(currentGroup[0].timestamp),
      messages: currentGroup
    });
  }

  return groups;
}

function formatGroupLabel(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

async function performDetailedAnalysis(context: string, messages: ChatMessage[]): Promise<AnalysisResult> {
  // Analyze different aspects of the conversation
  const [
    behaviorAnalysis,
    communicationPatterns,
    emotionalProgression,
    safetyAssessment,
  ] = await Promise.all([
    analyzeBehavioralPatterns(messages),
    analyzeCommunicationStyle(messages),
    analyzeEmotionalProgression(messages),
    performSafetyAssessment(context, messages),
  ]);

  // Calculate comprehensive scores
  const scores = calculateComprehensiveScores(
    behaviorAnalysis,
    communicationPatterns,
    emotionalProgression,
    safetyAssessment
  );

  // Generate actionable recommendations
  const recommendations = generateActionableRecommendations(
    scores,
    behaviorAnalysis,
    safetyAssessment
  );

  // Store metadata as evidence entries
  const metadataEvidence = [
    {
      id: 'analysis-metadata',
      messageId: '',
      startIndex: 0,
      endIndex: 0,
      text: 'Analysis Metadata',
      flagId: '',
      explanation: `Depth: comprehensive | Confidence: ${calculateConfidence(messages)}% | ${recommendations.actions.length} recommendations`,
    }
  ];

  return {
    id: generateId(),
    createdAt: new Date(),
    chatContent: messages,
    riskScore: scores.risk,
    trustScore: scores.trust,
    escalationIndex: scores.escalation,
    flags: [...behaviorAnalysis.redFlags, ...behaviorAnalysis.greenFlags],
    timeline: emotionalProgression.timeline,
    reciprocityScore: communicationPatterns.reciprocity,
    consistencyAnalysis: behaviorAnalysis.consistency,
    suggestedReplies: recommendations.replies,
    evidence: [...extractDetailedEvidence(messages, behaviorAnalysis), ...metadataEvidence],
  };
}

function analyzeBehavioralPatterns(messages: ChatMessage[]): any {
  const patterns = {
    redFlags: [] as any[],
    greenFlags: [] as any[],
    consistency: {
      claims: [] as any[],
      inconsistencies: [] as any[],
      stabilityIndex: 100,
    }
  };

  // Analyze each message for behavioral patterns
  messages.forEach((msg, index) => {
    const content = msg.content.toLowerCase();
    
    // Check for red flags
    Object.entries(DatingSafetyPromptBuilder.DATING_SAFETY_KNOWLEDGE.redFlags).forEach(([category, flags]) => {
      flags.forEach(flag => {
        if (isPatternPresent(content, flag)) {
          patterns.redFlags.push({
            id: `red-${index}-${category}`,
            type: 'red',
            category: category as any,
            severity: determineSeverity(flag, content),
            message: flag,
            evidence: msg.content,
            messageId: msg.id,
            confidence: 0.8,
          });
        }
      });
    });

    // Check for green flags
    Object.entries(DatingSafetyPromptBuilder.DATING_SAFETY_KNOWLEDGE.greenFlags).forEach(([category, flags]) => {
      flags.forEach(flag => {
        if (isPositivePatternPresent(content, flag)) {
          patterns.greenFlags.push({
            id: `green-${index}-${category}`,
            type: 'green',
            category: category as any,
            severity: 'low',
            message: flag,
            evidence: msg.content,
            messageId: msg.id,
            confidence: 0.8,
          });
        }
      });
    });
  });

  return patterns;
}

function isPatternPresent(content: string, pattern: string): boolean {
  const keywords = extractKeywords(pattern);
  return keywords.some(keyword => content.includes(keyword.toLowerCase()));
}

function isPositivePatternPresent(content: string, pattern: string): boolean {
  // For green flags, we look for positive indicators
  const positiveIndicators: Record<string, string[]> = {
    'Asks questions about your life': ['how was', 'tell me about', 'what do you', '?'],
    'Respects boundaries': ['no problem', 'understand', 'take your time', 'whenever you'],
    'Patient with your comfort level': ['no rush', 'when you\'re ready', 'comfortable'],
    'Shows genuine interest': ['that\'s interesting', 'tell me more', 'sounds like'],
  };

  const indicators = positiveIndicators[pattern];
  if (indicators) {
    return indicators.some(indicator => content.includes(indicator));
  }

  return false;
}

function extractKeywords(pattern: string): string[] {
  // Extract key words from the pattern description
  const commonWords = ['for', 'and', 'or', 'the', 'a', 'an', 'to', 'from'];
  return pattern
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 3 && !commonWords.includes(word));
}

function determineSeverity(flag: string, content: string): 'high' | 'medium' | 'low' {
  // High severity patterns
  if (flag.includes('money') || flag.includes('financial')) return 'high';
  if (flag.includes('intimate photos') || flag.includes('threatening')) return 'high';
  
  // Medium severity
  if (flag.includes('pushing') || flag.includes('pressure')) return 'medium';
  if (flag.includes('avoiding') || flag.includes('inconsistent')) return 'medium';
  
  return 'low';
}

function analyzeCommunicationStyle(messages: ChatMessage[]): any {
  const userMessages = messages.filter(m => m.sender === 'user');
  const matchMessages = messages.filter(m => m.sender === 'match');

  // Calculate metrics
  const reciprocity = {
    questionsAskedByUser: countQuestions(userMessages),
    questionsAskedByMatch: countQuestions(matchMessages),
    personalInfoSharedByUser: countPersonalInfo(userMessages),
    personalInfoSharedByMatch: countPersonalInfo(matchMessages),
    averageMessageLengthUser: calculateAverageLength(userMessages),
    averageMessageLengthMatch: calculateAverageLength(matchMessages),
    balanceScore: 50, // Will calculate below
  };

  // Calculate balance score
  const questionBalance = reciprocity.questionsAskedByMatch / (reciprocity.questionsAskedByUser + 1);
  const lengthBalance = reciprocity.averageMessageLengthMatch / (reciprocity.averageMessageLengthUser + 1);
  reciprocity.balanceScore = Math.round(50 * (questionBalance + lengthBalance));

  return { reciprocity };
}

function countQuestions(messages: ChatMessage[]): number {
  return messages.filter(msg => msg.content.includes('?')).length;
}

function countPersonalInfo(messages: ChatMessage[]): number {
  const personalIndicators = ['i work', 'i live', 'my job', 'my family', 'i like', 'i enjoy'];
  return messages.filter(msg => 
    personalIndicators.some(indicator => 
      msg.content.toLowerCase().includes(indicator)
    )
  ).length;
}

function calculateAverageLength(messages: ChatMessage[]): number {
  if (messages.length === 0) return 0;
  const total = messages.reduce((sum, msg) => sum + msg.content.length, 0);
  return Math.round(total / messages.length);
}

function analyzeEmotionalProgression(messages: ChatMessage[]): any {
  const timeline: any[] = [];
  let previousTone = 'neutral';

  // Ensure we always have at least a starting event
  if (messages.length > 0) {
    timeline.push({
      timestamp: messages[0].timestamp,
      type: 'emotional_shift' as const,
      from: 'neutral' as const,
      to: 'neutral' as const,
      description: 'Conversation started',
    });
  }

  messages.forEach((msg, index) => {
    const tone = detectEmotionalTone(msg.content);
    
    if (tone !== previousTone && index > 0) {
      timeline.push({
        timestamp: msg.timestamp,
        type: 'emotional_shift' as const,
        from: previousTone as any,
        to: tone as any,
        description: `Emotional shift from ${previousTone} to ${tone}`,
      });
    }

    // Check for escalation events
    if (isEscalationEvent(msg.content)) {
      timeline.push({
        timestamp: msg.timestamp,
        type: 'escalation' as const,
        from: previousTone as any,
        to: 'intimate' as const,
        description: 'Relationship escalation detected',
      });
    }

    previousTone = tone;
  });

  return { timeline };
}

function detectEmotionalTone(content: string): string {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.match(/love|adore|amazing|perfect|soulmate/)) return 'intimate';
  if (lowerContent.match(/angry|upset|frustrated|disappointed/)) return 'negative';
  if (lowerContent.match(/haha|lol|😂|😄|funny/)) return 'playful';
  if (lowerContent.match(/urgent|now|immediately|need/)) return 'urgent';
  if (lowerContent.match(/please|help|sorry/)) return 'pressuring';
  
  return 'neutral';
}

function isEscalationEvent(content: string): boolean {
  const escalationIndicators = [
    'love you',
    'meet in person',
    'come over',
    'send photos',
    'video call',
    'phone number',
    'move to',
  ];
  
  return escalationIndicators.some(indicator => 
    content.toLowerCase().includes(indicator)
  );
}

async function performSafetyAssessment(context: string, messages: ChatMessage[]): Promise<any> {
  const assessment = {
    overallRisk: 'low' as 'low' | 'medium' | 'high',
    specificConcerns: [] as string[],
    immediateActions: [] as string[],
  };

  // Check for immediate red flags
  const urgentPatterns = [
    { pattern: /send.{0,20}money|financial.{0,20}help/i, concern: 'Financial scam attempt' },
    { pattern: /emergency|urgent.{0,20}help/i, concern: 'Urgency manipulation' },
    { pattern: /send.{0,20}(photos?|pics?|nudes?)/i, concern: 'Request for intimate photos' },
    { pattern: /threatening|blackmail|expose/i, concern: 'Potential threat or coercion' },
  ];

  messages.forEach(msg => {
    urgentPatterns.forEach(({ pattern, concern }) => {
      if (pattern.test(msg.content)) {
        assessment.specificConcerns.push(concern);
        assessment.overallRisk = 'high';
      }
    });
  });

  // Add immediate actions based on risk
  if (assessment.overallRisk === 'high') {
    assessment.immediateActions = [
      'Do not send any money or financial information',
      'Do not share intimate photos',
      'Consider blocking and reporting this person',
      'Save evidence of concerning messages',
    ];
  }

  return assessment;
}

function calculateComprehensiveScores(behavior: any, communication: any, emotional: any, safety: any): any {
  const redFlagCount = behavior.redFlags.length;
  const greenFlagCount = behavior.greenFlags.length;
  
  // Risk score calculation
  let riskScore = redFlagCount * 15;
  if (safety.overallRisk === 'high') riskScore += 40;
  if (safety.overallRisk === 'medium') riskScore += 20;
  riskScore = Math.min(100, riskScore);

  // Trust score calculation
  let trustScore = 50 + (greenFlagCount * 10) - (redFlagCount * 10);
  trustScore = Math.max(0, Math.min(100, trustScore));

  // Escalation index
  const escalationEvents = emotional.timeline.filter((e: any) => e.type === 'escalation').length;
  const escalationIndex = Math.min(100, escalationEvents * 20);

  return {
    risk: riskScore,
    trust: trustScore,
    escalation: escalationIndex,
  };
}

function generateActionableRecommendations(scores: any, behavior: any, safety: any): any {
  const recommendations = {
    actions: [] as string[],
    replies: [] as any[],
  };

  // Generate actions based on risk level
  if (scores.risk > 70) {
    recommendations.actions = [
      'This conversation shows serious red flags',
      'Do not share any personal or financial information',
      'Consider ending communication for your safety',
      'If you feel threatened, block and report immediately',
    ];
  } else if (scores.risk > 40) {
    recommendations.actions = [
      'Proceed with caution - some concerning patterns detected',
      'Suggest a video call before meeting in person',
      'Keep conversations on the dating platform',
      'Trust your instincts if something feels off',
    ];
  } else {
    recommendations.actions = [
      'Conversation appears healthy so far',
      'Continue getting to know them at your pace',
      'Suggest a video call when you feel comfortable',
      'Meet in a public place for first dates',
    ];
  }

  // Generate suggested replies based on context
  if (behavior.redFlags.some((f: any) => f.category === 'financial')) {
    recommendations.replies.push({
      id: 'reply-financial',
      tone: 'assertive',
      content: "I don't feel comfortable discussing financial matters with someone I haven't met in person.",
      context: 'Response to financial requests',
    });
  }

  if (safety.specificConcerns.includes('Request for intimate photos')) {
    recommendations.replies.push({
      id: 'reply-photos',
      tone: 'assertive',
      content: "I don't share personal photos. Let's focus on getting to know each other better first.",
      context: 'Response to photo requests',
    });
  }

  // Add general positive reply option
  recommendations.replies.push({
    id: 'reply-positive',
    tone: 'friendly',
    content: "I'm enjoying our conversation! Would you be open to a video call sometime this week?",
    context: 'Suggesting next step',
  });

  return recommendations;
}

function extractDetailedEvidence(messages: ChatMessage[], analysis: any): any[] {
  const evidence: any[] = [];
  
  analysis.redFlags.forEach((flag: any) => {
    const message = messages.find(m => m.id === flag.messageId);
    if (message) {
      evidence.push({
        id: `evidence-${flag.id}`,
        messageId: flag.messageId,
        startIndex: 0,
        endIndex: message.content.length,
        text: message.content,
        flagId: flag.id,
        explanation: `This message contains: ${flag.message}`,
      });
    }
  });

  return evidence;
}

function calculateConfidence(messages: ChatMessage[]): number {
  // Base confidence on message count and quality
  let confidence = 50;
  
  if (messages.length > 10) confidence += 20;
  if (messages.length > 20) confidence += 10;
  
  // Check for clear conversation flow
  const hasQuestions = messages.some(m => m.content.includes('?'));
  const hasResponses = messages.length > 5;
  
  if (hasQuestions && hasResponses) confidence += 20;
  
  return Math.min(100, confidence);
}

function getPlatformInsights(platform: string, messages: ChatMessage[]): string[] {
  const insights: string[] = [];
  
  switch (platform) {
    case 'tinder':
      insights.push('Tinder conversations often move quickly - be extra cautious of love bombing');
      insights.push('Verify profiles through Instagram or video calls');
      break;
    case 'bumble':
      insights.push('Bumble requires women to message first - watch for fake feminist allies');
      insights.push('Use Bumble\'s video chat feature before meeting');
      break;
    case 'hinge':
      insights.push('Hinge is designed for relationships - but scammers exploit this expectation');
      insights.push('Pay attention to prompt responses for authenticity');
      break;
  }
  
  return insights;
}

function generateId(): string {
  return `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}