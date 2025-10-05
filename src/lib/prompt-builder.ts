// Comprehensive prompt builder for Dating Safety AI
// This centralizes all prompts and makes the AI more consistent and knowledgeable

export class DatingSafetyPromptBuilder {
  static DATING_SAFETY_KNOWLEDGE = {
    redFlags: {
      financial: [
        'Asking for money or financial help',
        'Sob stories about emergencies needing money',
        'Claims about frozen bank accounts',
        'Investment opportunities or get-rich-quick schemes',
        'Asking for gift cards or cryptocurrency',
      ],
      behavioral: [
        'Love bombing - excessive affection too quickly',
        'Pushing for quick commitment',
        'Anger when boundaries are set',
        'Jealousy or possessiveness early on',
        'Inconsistent stories or details',
        'Avoiding video calls or meetings',
        'Pushing to move communication off the platform',
        'Asking for intimate photos',
        'Negging or emotional manipulation',
        'Gaslighting behaviors',
      ],
      communication: [
        'Only available at odd hours',
        'Poor grammar inconsistent with claimed background',
        'Copy-paste style messages',
        'Avoiding personal questions',
        'Getting defensive when asked normal questions',
        'Dramatic mood swings in messages',
      ],
      identity: [
        'Profile photos that seem too good to be true',
        'Refusing to video chat',
        'Stories that don\'t add up',
        'Claims about traveling constantly for work',
        'Military deployment excuses',
        'Widowed with a young child sob story',
      ],
    },
    greenFlags: {
      communication: [
        'Consistent and regular communication',
        'Asks questions about your life and remembers details',
        'Respects response time boundaries',
        'Uses humor appropriately',
        'Shares personal stories appropriately',
        'Good spelling and grammar',
      ],
      respect: [
        'Respects your boundaries',
        'Doesn\'t pressure for personal information',
        'Patient with your comfort level',
        'Supports your goals and interests',
        'Accepts "no" gracefully',
        'Values your opinions',
      ],
      transparency: [
        'Willing to video chat',
        'Social media profiles match their story',
        'Introduces you to friends (even virtually)',
        'Stories remain consistent',
        'Open about their daily life',
        'Shares verifiable details',
      ],
      emotional: [
        'Shows emotional intelligence',
        'Handles disagreements maturely',
        'Expresses feelings appropriately',
        'Shows empathy and understanding',
        'Maintains stable mood',
        'Demonstrates self-awareness',
      ],
    },
    safetyTips: [
      'Keep communication on the dating platform initially',
      'Video chat before meeting in person',
      'Meet in public places for first several dates',
      'Tell a friend about your plans and check in',
      'Trust your instincts - if something feels off, it probably is',
      'Don\'t share financial information',
      'Be cautious about sharing personal details early',
      'Google their name and reverse image search photos',
      'Take things slow - genuine people will understand',
      'Never send money to someone you haven\'t met',
    ],
    scamPatterns: {
      romance: 'Builds emotional connection quickly, then has financial emergency',
      catfish: 'Fake identity, avoids video calls, stolen photos',
      investment: 'Promises financial opportunities or cryptocurrency schemes',
      sextortion: 'Requests intimate photos then threatens to share them',
      military: 'Claims to be deployed military needing help',
      travel: 'Stuck abroad and needs money to return',
    },
  };
  static getSystemPrompt(): string {
    return `You are a Dating Safety AI Assistant, an expert in online dating safety, relationship psychology, and recognizing manipulation patterns. You have extensive knowledge about:

${this.formatKnowledge()}

Your personality:
- Warm, supportive, and non-judgmental
- Direct about safety concerns without being alarmist  
- Encouraging but realistic
- Respects user autonomy while prioritizing safety
- Uses emoji thoughtfully to maintain friendly tone
- Balances seriousness with approachability

Your approach:
1. Listen carefully to understand the situation
2. Identify specific red or green flags present
3. Explain why these flags matter
4. Provide actionable advice
5. Empower users to make informed decisions
6. Always prioritize user safety

Remember: Many users may be emotionally invested in their matches, so be gentle but clear about concerns. Validate their feelings while providing objective analysis.`;
  }

  static getAnalysisPrompt(messages: any[]): string {
    return `Analyze this dating conversation for safety concerns and relationship health indicators.

Conversation:
${JSON.stringify(messages, null, 2)}

Provide a comprehensive analysis including:

1. RED FLAGS (with severity 1-10):
   - List specific concerning behaviors
   - Quote exact messages as evidence
   - Explain why each is concerning

2. GREEN FLAGS:
   - List positive behaviors observed
   - Quote supporting messages
   - Explain why these are encouraging

3. RISK ASSESSMENT:
   - Overall risk score (0-100)
   - Trust score (0-100)
   - Escalation index (0-100)

4. SPECIFIC CONCERNS:
   - Check for: ${Object.keys(this.DATING_SAFETY_KNOWLEDGE.scamPatterns).join(', ')} scam patterns
   - Identify manipulation tactics
   - Note inconsistencies

5. RECOMMENDATIONS:
   - Immediate actions to take
   - Questions to ask for clarification
   - Safety precautions
   - Suggested responses

6. PATTERN ANALYSIS:
   - Communication balance
   - Emotional progression speed
   - Consistency of information

Format the response as structured JSON for parsing.`;
  }

  static getChatResponsePrompt(context: string, userMessage: string): string {
    return `Given this context about online dating safety, respond to the user's message helpfully.

Context: User is asking about dating safety, red flags, or relationship advice.
User message: "${userMessage}"

Guidelines for your response:
1. Be conversational and supportive
2. Reference specific red/green flags if relevant: ${this.getRelevantFlags(userMessage)}
3. Provide practical, actionable advice
4. Use examples when helpful
5. Keep response focused and not too long
6. Include a follow-up question to understand better if needed
7. Use 1-2 relevant emoji maximum

If discussing red flags, explain:
- What the flag is
- Why it's concerning  
- What to do about it

If discussing green flags, explain:
- What the positive sign is
- Why it's encouraging
- How to nurture it

Always prioritize user safety while being supportive.`;
  }

  static getScenarioAnalysisPrompt(scenario: string): string {
    return `A user has shared this dating scenario and wants advice:

"${scenario}"

Analyze this situation considering:
1. Potential red flags: ${JSON.stringify(this.DATING_SAFETY_KNOWLEDGE.redFlags)}
2. Possible green flags: ${JSON.stringify(this.DATING_SAFETY_KNOWLEDGE.greenFlags)}
3. Relevant safety tips: ${JSON.stringify(this.DATING_SAFETY_KNOWLEDGE.safetyTips)}

Provide:
1. Initial assessment (safe/caution/concerning)
2. Specific flags identified with explanations
3. Recommended actions
4. Questions they should ask their match
5. Safety precautions to take
6. Validation of their concerns

Be supportive but honest about risks.`;
  }

  static getSuggestedReplyPrompt(context: string, situation: string): string {
    return `Generate 3 different response options for this dating app situation:

Context: ${context}
Situation: ${situation}

Create 3 responses with different tones:
1. FRIENDLY BUT CAUTIOUS: Warm but sets clear boundaries
2. DIRECT AND CLEAR: Straightforward about concerns or boundaries  
3. DEFLECTING WITH HUMOR: Light-hearted redirect

Each response should:
- Be appropriate for a dating app
- Protect the user's safety
- Maintain their dignity
- Not be aggressive or rude
- Be under 100 characters

Format as JSON with tone, message, and explanation for each.`;
  }

  private static formatKnowledge(): string {
    return `
RED FLAGS TO DETECT:
${Object.entries(this.DATING_SAFETY_KNOWLEDGE.redFlags)
  .map(([category, flags]) => `${category.toUpperCase()}:\n${flags.map(f => `- ${f}`).join('\n')}`)
  .join('\n\n')}

GREEN FLAGS TO RECOGNIZE:
${Object.entries(this.DATING_SAFETY_KNOWLEDGE.greenFlags)
  .map(([category, flags]) => `${category.toUpperCase()}:\n${flags.map(f => `- ${f}`).join('\n')}`)
  .join('\n\n')}

COMMON SCAM PATTERNS:
${Object.entries(this.DATING_SAFETY_KNOWLEDGE.scamPatterns)
  .map(([type, description]) => `- ${type.toUpperCase()}: ${description}`)
  .join('\n')}

SAFETY GUIDELINES:
${this.DATING_SAFETY_KNOWLEDGE.safetyTips.map(tip => `- ${tip}`).join('\n')}`;
  }

  private static getRelevantFlags(message: string): string {
    const lowercaseMessage = message.toLowerCase();
    const relevantFlags = [];

    // Check which topics the message might be about
    if (lowercaseMessage.includes('money') || lowercaseMessage.includes('pay')) {
      relevantFlags.push(...this.DATING_SAFETY_KNOWLEDGE.redFlags.financial);
    }
    if (lowercaseMessage.includes('meet') || lowercaseMessage.includes('date')) {
      relevantFlags.push('Meet in public places', 'Tell friends your plans');
    }
    if (lowercaseMessage.includes('photo') || lowercaseMessage.includes('pic')) {
      relevantFlags.push('Never send intimate photos', 'Be cautious about photo requests');
    }
    if (lowercaseMessage.includes('love') || lowercaseMessage.includes('feelings')) {
      relevantFlags.push('Love bombing', 'Emotional manipulation');
    }

    return relevantFlags.join(', ');
  }

  // Helper method for the AI analysis module
  static enhanceAnalysisWithContext(basicAnalysis: any): any {
    return {
      ...basicAnalysis,
      knowledgeBase: this.DATING_SAFETY_KNOWLEDGE,
      enhancedFlags: this.mapFlagsToKnowledge(basicAnalysis.flags || []),
      safetyScore: this.calculateSafetyScore(basicAnalysis),
      recommendedActions: this.getRecommendedActions(basicAnalysis),
    };
  }

  private static mapFlagsToKnowledge(flags: any[]): any[] {
    return flags.map(flag => {
      const knowledge = this.findRelatedKnowledge(flag.message);
      return {
        ...flag,
        category: knowledge.category,
        relatedPatterns: knowledge.patterns,
        suggestedResponse: knowledge.response,
      };
    });
  }

  private static findRelatedKnowledge(flagMessage: string): any {
    // Implementation to map flags to knowledge base
    // This would analyze the flag and return relevant category, patterns, etc.
    return {
      category: 'behavioral',
      patterns: ['manipulation', 'boundary_violation'],
      response: 'Set clear boundaries and observe their reaction',
    };
  }

  private static calculateSafetyScore(analysis: any): number {
    const flags = analysis.flags || [];
    const redFlagWeight = flags.filter((f: any) => f.type === 'red').length * 10;
    const greenFlagBonus = flags.filter((f: any) => f.type === 'green').length * 5;
    const riskFactor = (analysis.riskScore || 0) * 0.5;
    
    return Math.max(0, Math.min(100, 100 - redFlagWeight - riskFactor + greenFlagBonus));
  }

  private static getRecommendedActions(analysis: any): string[] {
    const actions = [];
    const riskScore = analysis.riskScore || 0;
    
    if (riskScore > 70) {
      actions.push('Consider ending communication for your safety');
      actions.push('Do not share any personal information');
      actions.push('Block and report if harassment occurs');
    } else if (riskScore > 40) {
      actions.push('Proceed with extreme caution');
      actions.push('Ask clarifying questions about inconsistencies');
      actions.push('Insist on video chat before any meeting');
      actions.push('Do not share financial or intimate information');
    } else {
      actions.push('Continue getting to know them');
      actions.push('Maintain healthy boundaries');
      actions.push('Plan a safe first meeting in public');
    }
    
    return actions;
  }
}

// Export a ready-to-use instance
export const promptBuilder = new DatingSafetyPromptBuilder();

// Export the formatted system prompt for easy use
export const SYSTEM_PROMPT = DatingSafetyPromptBuilder.getSystemPrompt();

// Export knowledge base for external use
export const DATING_SAFETY_KNOWLEDGE = DatingSafetyPromptBuilder.DATING_SAFETY_KNOWLEDGE;