// AI Configuration for Dating Safety Assistant
// This file allows easy customization of the AI's behavior, knowledge, and responses

export const AI_CONFIG = {
  // Model settings
  model: {
    name: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    temperature: {
      chat: 0.7,        // More creative for conversations
      analysis: 0.3,    // More focused for analysis
      suggestions: 0.5, // Balanced for reply suggestions
    },
    maxTokens: {
      chat: 500,
      analysis: 1500,
      suggestions: 300,
    },
  },

  // Personality settings
  personality: {
    tone: 'warm and supportive',
    formality: 'casual but professional',
    empathy: 'high',
    assertiveness: 'medium - direct about safety',
    humor: 'light and appropriate',
    emojis: true,
    maxEmojisPerResponse: 2,
  },

  // Safety thresholds
  thresholds: {
    // Scores above these trigger warnings
    highRisk: 70,
    mediumRisk: 40,
    
    // Flag severity multipliers
    severityWeights: {
      high: 3,
      medium: 2,
      low: 1,
    },
    
    // Minimum flags to trigger analysis
    minFlagsForConcern: 2,
    
    // Trust building thresholds
    trustBuilding: {
      minGreenFlags: 3,
      minConsistency: 80,
    },
  },

  // Response templates
  templates: {
    greetings: [
      "Hi! I'm your Dating Safety AI assistant. I'm here to help you navigate online dating safely and confidently. 🛡️❤️",
      "Hello! Ready to help you stay safe while finding meaningful connections. What's on your mind?",
      "Hey there! I'm here to be your dating safety companion. Feel free to ask me anything!",
    ],
    
    highRiskWarnings: [
      "⚠️ I'm seeing several concerning red flags here. Your safety is my priority, so I need to be direct with you.",
      "🚨 This situation shows multiple warning signs. Let me explain what I'm seeing and how to protect yourself.",
      "I'm worried about what I'm seeing in this conversation. There are serious red flags we need to discuss.",
    ],
    
    encouragement: [
      "You're doing great by being cautious and seeking advice! 💪",
      "Trust your instincts - they brought you here for a reason.",
      "It's smart that you're checking on this. Better safe than sorry!",
    ],
    
    boundaries: [
      "Remember: You have every right to set boundaries and expect them to be respected.",
      "A genuine person will understand and respect your need to take things slow.",
      "Your comfort and safety should always come first.",
    ],
  },

  // Knowledge updates (extends prompt-builder knowledge)
  additionalKnowledge: {
    // Regional scam patterns
    regionalScams: {
      global: ['romance scams', 'crypto investment', 'gift card requests'],
      seasonal: ['holiday loneliness exploitation', 'tax season scams'],
    },
    
    // Platform-specific advice
    platformTips: {
      general: "Stay on the dating app's messaging system until you've video chatted",
      tinder: "Be cautious of super quick right-swipes and immediate intense interest",
      bumble: "Use the video chat feature before meeting",
      hinge: "Look for detailed prompts - scammers often have generic profiles",
    },
    
    // Cultural considerations
    culturalSensitivity: {
      enabled: true,
      considerations: [
        "Respect cultural differences in communication styles",
        "Be aware that dating norms vary by culture",
        "Don't assume negative intent from cultural differences",
      ],
    },
  },

  // Auto-responses for specific scenarios
  scenarioResponses: {
    moneyRequest: {
      trigger: ['money', 'loan', 'help me', 'emergency', 'western union', 'gift card'],
      response: "🚩 MAJOR RED FLAG! This is a classic scam pattern. Never send money to someone you've only met online. Block and report immediately.",
      severity: 'critical',
    },
    
    tooFastProgress: {
      trigger: ['love you', 'soulmate', 'destiny', 'move in'],
      timeframe: 14, // days
      response: "⚠️ This is moving very fast. Genuine relationships take time to develop. Be cautious of love bombing.",
      severity: 'high',
    },
    
    avoidingVideo: {
      trigger: ['can\'t video', 'camera broken', 'shy on camera'],
      response: "🤔 Refusing video calls is a red flag. Legitimate people are usually willing to video chat.",
      severity: 'medium',
    },
  },

  // Feature flags
  features: {
    sentimentAnalysis: true,
    photoAnalysis: true,
    multilingual: false,
    voiceNotes: false,
    realTimeChat: true,
    exportReports: true,
  },

  // Moderation settings
  moderation: {
    blockExplicitContent: true,
    flagHarassment: true,
    reportThreats: true,
    minAge: 18,
  },

  // Analytics and improvement
  analytics: {
    trackFlagAccuracy: true,
    collectFeedback: true,
    anonymizeData: true,
    improvementCycle: 'weekly',
  },
};

// Helper functions for using config
export const getAIResponse = (scenario: string): string | null => {
  for (const [key, config] of Object.entries(AI_CONFIG.scenarioResponses)) {
    if (config.trigger.some(trigger => scenario.toLowerCase().includes(trigger))) {
      return config.response;
    }
  }
  return null;
};

export const shouldTriggerWarning = (riskScore: number): boolean => {
  return riskScore >= AI_CONFIG.thresholds.mediumRisk;
};

export const getRandomGreeting = (): string => {
  const greetings = AI_CONFIG.templates.greetings;
  return greetings[Math.floor(Math.random() * greetings.length)];
};

type SeverityLevel = 'high' | 'medium' | 'low';

export const calculateSeverity = (flags: Array<{ severity: SeverityLevel }>): number => {
  return flags.reduce((total, flag) => {
    const weight = AI_CONFIG.thresholds.severityWeights[flag.severity] || 1;
    return total + weight;
  }, 0);
};