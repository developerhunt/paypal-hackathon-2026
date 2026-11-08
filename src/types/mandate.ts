import { z } from 'zod';

export const MandateRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  maxBudgetTotal: z.number().positive(),
  remainingBudget: z.number().nonnegative(),
  maxPerItemPrice: z.number().positive(),
  autoApproveThreshold: z.number().nonnegative(), // If purchase total <= this, auto-approve; if above, needs human approval
  allowedCategories: z.array(z.string()),
  deniedCategories: z.array(z.string()).default([]),
  allowedMerchants: z.array(z.string()).default([]), // If empty, all reputable allowed
  deniedMerchants: z.array(z.string()).default([]),
  minMerchantRating: z.number().min(0).max(5).default(4.0),
  currency: z.string().default('USD'),
  maxQuantityPerItem: z.number().int().positive().default(2),
  maxPurchasesPerHour: z.number().int().positive().default(5),
  expiresAt: z.string(), // ISO date string
  allowPriceDriftPercent: z.number().min(0).max(20).default(5), // max allowed % drift at checkout
});

export type MandateRule = z.infer<typeof MandateRuleSchema>;

export interface MissionInput {
  prompt: string;
  userOverrides?: Partial<MandateRule>;
}

export interface MandateCompilationResult {
  mandate: MandateRule;
  reasoning: string;
  sourcePrompt: string;
}
