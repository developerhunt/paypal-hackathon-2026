import { GoogleGenAI } from '@google/genai';
import { MandateRule, MandateCompilationResult } from '../../types/mandate.ts';

export class MandateCompiler {
  private ai: GoogleGenAI | null = null;
  private modelName: string;
  private isLiveMode: boolean = false;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const forceMock = process.env.FORCE_MOCK_GEMINI === 'true';
    const hasValidKey = Boolean(
      apiKey &&
      apiKey !== 'MY_GEMINI_API_KEY' &&
      apiKey !== 'YOUR_GEMINI_API_KEY_HERE'
    );

    if (hasValidKey && !forceMock) {
      try {
        this.ai = new GoogleGenAI({ apiKey });
        this.isLiveMode = true;
      } catch (e) {
        console.warn('GoogleGenAI initialization skipped:', e);
      }
    }
  }

  public get isLive(): boolean {
    return this.isLiveMode;
  }

  public get model(): string {
    return this.modelName;
  }

  /**
   * Compiles natural-language user shopping missions into deterministic Mandate cards.
   */
  public async compile(prompt: string, overrides?: Partial<MandateRule>): Promise<MandateCompilationResult> {
    const startTime = Date.now();

    // 1. Try Gemini Structured Extraction if client is active
    if (this.ai) {
      try {
        const systemInstruction = `You are the Leash Mandate Compiler. Extract strict financial, merchant, and category bounds from user shopping missions.
Output ONLY valid JSON matching this schema:
{
  "name": string (short title e.g. "Headphones Under $150"),
  "maxBudgetTotal": number,
  "maxPerItemPrice": number,
  "autoApproveThreshold": number (the price below which autonomous purchase is approved; if user says "ask me if over $100", threshold is 100),
  "allowedCategories": string[] (e.g. ["Electronics", "Audio", "Headphones"]),
  "deniedCategories": string[],
  "allowedMerchants": string[],
  "deniedMerchants": string[],
  "minMerchantRating": number (default 4.0),
  "currency": "USD",
  "maxQuantityPerItem": number (default 1 or 2),
  "expiryHours": number (default 24),
  "allowPriceDriftPercent": number (default 5),
  "reasoning": string (brief summary of how bounds were derived)
}`;

        const response = await this.ai.models.generateContent({
          model: this.modelName,
          contents: [{ role: 'user', parts: [{ text: `User mission: "${prompt}"` }] }],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const rawJson = response.text || '';
        const parsed = JSON.parse(rawJson);

        const mandate: MandateRule = {
          id: `mnd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: parsed.name || 'Custom Shopping Mandate',
          maxBudgetTotal: Number(parsed.maxBudgetTotal) || 150,
          remainingBudget: Number(parsed.maxBudgetTotal) || 150,
          maxPerItemPrice: Number(parsed.maxPerItemPrice) || Number(parsed.maxBudgetTotal) || 150,
          autoApproveThreshold: Number(parsed.autoApproveThreshold) || 100,
          allowedCategories: Array.isArray(parsed.allowedCategories) && parsed.allowedCategories.length > 0 ? parsed.allowedCategories : ['Audio', 'Electronics'],
          deniedCategories: Array.isArray(parsed.deniedCategories) ? parsed.deniedCategories : ['Luxury', 'Weapons'],
          allowedMerchants: Array.isArray(parsed.allowedMerchants) ? parsed.allowedMerchants : [],
          deniedMerchants: Array.isArray(parsed.deniedMerchants) ? parsed.deniedMerchants : ['ShadyElectronicsDirect'],
          minMerchantRating: Number(parsed.minMerchantRating) || 4.0,
          currency: parsed.currency || 'USD',
          maxQuantityPerItem: Number(parsed.maxQuantityPerItem) || 1,
          maxPurchasesPerHour: 5,
          expiresAt: new Date(Date.now() + (Number(parsed.expiryHours) || 24) * 3600 * 1000).toISOString(),
          allowPriceDriftPercent: Number(parsed.allowPriceDriftPercent) || 5,
          ...overrides,
        };

        return {
          mandate,
          reasoning: parsed.reasoning || `Extracted from prompt via ${this.modelName} in ${Date.now() - startTime}ms`,
          sourcePrompt: prompt,
        };
      } catch (err) {
        console.warn('Gemini compile error, falling back to deterministic heuristic compiler:', err);
      }
    }

    // 2. Deterministic Heuristic Compiler Fallback (100% reliable)
    return this.heuristicCompile(prompt, overrides);
  }

  /**
   * Deterministic heuristic compiler parsing numbers, categories, and thresholds with regex.
   */
  public heuristicCompile(prompt: string, overrides?: Partial<MandateRule>): MandateCompilationResult {
    const p = prompt.toLowerCase();

    // Extract numbers like "$150", "150 dollars", "under $100"
    const dollarMatches = [...prompt.matchAll(/\$\s*(\d+(\.\d+)?)/g)].map((m) => parseFloat(m[1]));
    const underMatches = [...prompt.matchAll(/under\s+\$?(\d+(\.\d+)?)/gi)].map((m) => parseFloat(m[1]));

    let maxBudget = 150;
    let autoApprove = 100;

    if (underMatches.length >= 2) {
      maxBudget = Math.max(underMatches[0], underMatches[1]);
      autoApprove = Math.min(underMatches[0], underMatches[1]);
    } else if (underMatches.length === 1) {
      maxBudget = underMatches[0];
      autoApprove = Math.round(maxBudget * 0.7);
    } else if (dollarMatches.length > 0) {
      maxBudget = dollarMatches[0];
      autoApprove = dollarMatches.length > 1 ? dollarMatches[1] : Math.round(maxBudget * 0.7);
    }

    // Category detection
    const categories: string[] = [];
    if (p.includes('headphone') || p.includes('earbud') || p.includes('audio') || p.includes('noise-cancelling')) {
      categories.push('Electronics', 'Audio', 'Headphones');
    } else if (p.includes('keyboard') || p.includes('mouse') || p.includes('desk') || p.includes('office')) {
      categories.push('Electronics', 'Office', 'Keyboards');
    } else if (p.includes('watch') || p.includes('luxury') || p.includes('jewelry')) {
      categories.push('Watches', 'Accessories');
    } else {
      categories.push('General Commerce');
    }

    // Allowed/Denied Merchants
    const deniedMerchants = ['ShadyElectronicsDirect'];
    const allowedMerchants: string[] = [];
    if (p.includes('reputable') || p.includes('official') || p.includes('verified')) {
      // High minimum rating
    }

    const mandate: MandateRule = {
      id: `mnd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: categories[categories.length - 1] ? `${categories[categories.length - 1]} Mandate` : 'Commerce Mandate',
      maxBudgetTotal: maxBudget,
      remainingBudget: maxBudget,
      maxPerItemPrice: maxBudget,
      autoApproveThreshold: autoApprove,
      allowedCategories: categories,
      deniedCategories: ['Weapons', 'Adult', 'Gambling'],
      allowedMerchants,
      deniedMerchants,
      minMerchantRating: 4.0,
      currency: 'USD',
      maxQuantityPerItem: 1,
      maxPurchasesPerHour: 5,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      allowPriceDriftPercent: 5,
      ...overrides,
    };

    return {
      mandate,
      reasoning: `Deterministic compile: budget set to $${maxBudget}, auto-approval cap set to $${autoApprove}, category whitelist: [${categories.join(', ')}].`,
      sourcePrompt: prompt,
    };
  }
}
