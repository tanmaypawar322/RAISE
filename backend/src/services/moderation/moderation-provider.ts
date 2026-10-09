import keywordsData from '../../data/moderation-keywords.json';

export type ModerationDecision = 'allow' | 'review' | 'block';

export interface ModerationResult {
  decision: ModerationDecision;
  labels: string[];
  score: number;
  reason?: string;
}

export interface ModerationProvider {
  checkText(text: string, lang?: string): Promise<ModerationResult>;
  checkImage?(buffer: Buffer, mimeType: string): Promise<ModerationResult>;
}

export class RuleBasedModerationProvider implements ModerationProvider {
  private keywords: typeof keywordsData;

  constructor(customKeywords?: typeof keywordsData) {
    this.keywords = customKeywords || keywordsData;
  }

  async checkText(text: string, lang: string = 'en'): Promise<ModerationResult> {
    if (!text || typeof text !== 'string') {
      return { decision: 'allow', labels: [], score: 0.0 };
    }

    const lower = text.toLowerCase();
    const matchedLabels: string[] = [];
    let isBlock = false;
    let isReview = false;
    let primaryReason: string | undefined;

    const languages: (keyof typeof keywordsData)[] = ['en', 'mr', 'hi'];

    for (const l of languages) {
      const dict = this.keywords[l];
      if (!dict) continue;

      // Check severe categories -> Block
      for (const word of dict.violence || []) {
        if (lower.includes(word.toLowerCase())) {
          matchedLabels.push('violence');
          isBlock = true;
          primaryReason = `Content flagged for violent references (${word})`;
          break;
        }
      }
      for (const word of dict.sexual || []) {
        if (lower.includes(word.toLowerCase())) {
          matchedLabels.push('sexual');
          isBlock = true;
          primaryReason = `Content flagged for explicit content (${word})`;
          break;
        }
      }

      // Check review categories -> Review
      for (const word of dict.hate || []) {
        if (lower.includes(word.toLowerCase())) {
          matchedLabels.push('hate_speech');
          isReview = true;
          if (!primaryReason) primaryReason = `Content flagged for hateful language (${word})`;
        }
      }
      for (const word of dict.profanity || []) {
        if (lower.includes(word.toLowerCase())) {
          matchedLabels.push('profanity');
          isReview = true;
          if (!primaryReason) primaryReason = `Content flagged for abusive terms (${word})`;
        }
      }
    }

    const uniqueLabels = Array.from(new Set(matchedLabels));

    if (isBlock) {
      return {
        decision: 'block',
        labels: uniqueLabels,
        score: 0.95,
        reason: primaryReason || 'Content violates civic safety guidelines',
      };
    }

    if (isReview) {
      return {
        decision: 'review',
        labels: uniqueLabels,
        score: 0.65,
        reason: primaryReason || 'Held for moderator pre-screening',
      };
    }

    return {
      decision: 'allow',
      labels: [],
      score: 0.0,
    };
  }

  async checkImage(buffer: Buffer, mimeType: string): Promise<ModerationResult> {
    // Adapter slot for external vision moderation API (e.g. AWS Rekognition, Google Cloud Vision SafeSearch)
    return { decision: 'allow', labels: [], score: 0.0 };
  }
}

export class MockModerationProvider implements ModerationProvider {
  private defaultDecision: ModerationDecision;

  constructor(defaultDecision: ModerationDecision = 'allow') {
    this.defaultDecision = defaultDecision;
  }

  async checkText(text: string): Promise<ModerationResult> {
    return {
      decision: this.defaultDecision,
      labels: this.defaultDecision === 'allow' ? [] : ['mock_flag'],
      score: this.defaultDecision === 'allow' ? 0.0 : 0.8,
      reason: this.defaultDecision === 'allow' ? undefined : 'Mock moderation flag',
    };
  }

  async checkImage(): Promise<ModerationResult> {
    return { decision: 'allow', labels: [], score: 0.0 };
  }
}

let activeProvider: ModerationProvider | null = null;

export function getModerationProvider(): ModerationProvider {
  if (activeProvider) return activeProvider;

  const providerType = process.env.MODERATION_PROVIDER || 'rules';
  if (providerType === 'mock') {
    activeProvider = new MockModerationProvider('allow');
  } else {
    activeProvider = new RuleBasedModerationProvider();
  }
  return activeProvider;
}

export function setModerationProviderForTesting(provider: ModerationProvider | null): void {
  activeProvider = provider;
}
