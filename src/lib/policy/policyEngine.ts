import { MandateRule } from '../../types/mandate.ts';
import { ProductItem, ProductOffer } from '../../types/channel3.ts';
import { PolicyCheckItemResult, PolicyEvaluation, ShieldEvaluation } from '../../types/ledger.ts';

export interface ProposedPurchase {
  productId: string;
  offerId: string;
  quantity: number;
  quotedUnitPrice: number; // Price recorded at agent decision time
  checkoutUnitPrice?: number; // Price fetched at checkout time (to check drift)
  product: ProductItem;
  offer: ProductOffer;
  shieldResult?: ShieldEvaluation;
  recentPurchasesCount?: number; // For velocity limit checks
  recentPurchasesInPastHour?: number; // Alias for velocity limit checks
  previousPurchasedProductIds?: string[]; // For duplicate idempotency checks
  existingIdempotencyKeys?: Set<string>;
  proposedIdempotencyKey?: string;
}

export class PolicyEngine {
  /**
   * Deterministically evaluates a proposed purchase against an immutable MandateRule.
   * Completely decoupled from any LLM or external state.
   */
  public static evaluate(
    mandate: MandateRule,
    proposal: ProposedPurchase,
    now: Date = new Date()
  ): PolicyEvaluation {
    const checks: PolicyCheckItemResult[] = [];
    const reasons: string[] = [];

    const unitPrice = proposal.offer.price;
    const totalAmount = unitPrice * proposal.quantity;

    // 1. Mandate Expiry Check
    const expiryDate = new Date(mandate.expiresAt);
    if (now.getTime() > expiryDate.getTime()) {
      checks.push({
        ruleName: 'Mandate Active Window',
        passed: false,
        message: `Mandate expired at ${mandate.expiresAt} (Current: ${now.toISOString()})`,
        severity: 'BLOCK',
      });
      reasons.push('Mandate has expired; no new commitments permitted.');
    } else {
      checks.push({
        ruleName: 'Mandate Active Window',
        passed: true,
        message: `Mandate is active (Expires in ${Math.round((expiryDate.getTime() - now.getTime()) / 60000)} minutes)`,
        severity: 'PASS',
      });
    }

    // 2. Remaining Budget Check
    if (totalAmount > mandate.remainingBudget) {
      checks.push({
        ruleName: 'Total Budget Ceiling',
        passed: false,
        message: `Purchase total $${totalAmount.toFixed(2)} exceeds remaining budget $${mandate.remainingBudget.toFixed(2)}`,
        severity: 'BLOCK',
      });
      reasons.push(`Budget overrun: requires $${totalAmount.toFixed(2)}, but only $${mandate.remainingBudget.toFixed(2)} remaining.`);
    } else {
      checks.push({
        ruleName: 'Total Budget Ceiling',
        passed: true,
        message: `Total $${totalAmount.toFixed(2)} within remaining budget of $${mandate.remainingBudget.toFixed(2)}`,
        severity: 'PASS',
      });
    }

    // 3. Per-Item Price Cap & Floor
    if (unitPrice <= 0 || unitPrice < 0.01) {
      checks.push({
        ruleName: 'Per-Item Price Ceiling',
        passed: false,
        message: `Item price $${unitPrice.toFixed(4)} is sub-cent, non-positive or manipulated`,
        severity: 'BLOCK',
      });
      reasons.push(`Price anomaly: unit price $${unitPrice.toFixed(4)} violates minimum $0.01 floor.`);
    } else if (unitPrice > mandate.maxPerItemPrice) {
      checks.push({
        ruleName: 'Per-Item Price Ceiling',
        passed: false,
        message: `Item price $${unitPrice.toFixed(2)} exceeds maximum per-item cap $${mandate.maxPerItemPrice.toFixed(2)}`,
        severity: 'BLOCK',
      });
      reasons.push(`Per-item cap exceeded: unit cost $${unitPrice.toFixed(2)} > $${mandate.maxPerItemPrice.toFixed(2)}`);
    } else {
      checks.push({
        ruleName: 'Per-Item Price Ceiling',
        passed: true,
        message: `Item price $${unitPrice.toFixed(2)} is within maximum per-item cap $${mandate.maxPerItemPrice.toFixed(2)}`,
        severity: 'PASS',
      });
    }

    // 4. Quantity Sanity
    if (proposal.quantity <= 0 || proposal.quantity > mandate.maxQuantityPerItem) {
      checks.push({
        ruleName: 'Quantity Limit',
        passed: false,
        message: `Quantity ${proposal.quantity} violates limits (1-${mandate.maxQuantityPerItem})`,
        severity: 'BLOCK',
      });
      reasons.push(`Quantity ${proposal.quantity} exceeds allowable batch size (${mandate.maxQuantityPerItem}).`);
    } else {
      checks.push({
        ruleName: 'Quantity Limit',
        passed: true,
        message: `Quantity ${proposal.quantity} allowed`,
        severity: 'PASS',
      });
    }

    // 5. Currency Match Check (ISO 4217)
    if (proposal.offer.currency.toUpperCase() !== mandate.currency.toUpperCase()) {
      checks.push({
        ruleName: 'Currency Consistency',
        passed: false,
        message: `Offer currency ${proposal.offer.currency} does not match mandate currency ${mandate.currency}`,
        severity: 'BLOCK',
      });
      reasons.push(`Currency mismatch: expected ${mandate.currency}, received ${proposal.offer.currency}.`);
    } else {
      checks.push({
        ruleName: 'Currency Consistency',
        passed: true,
        message: `Currency matches ${mandate.currency}`,
        severity: 'PASS',
      });
    }

    // 6. Category Allow / Deny Lists
    const itemCategory = (proposal.product.category || '').toLowerCase();
    const isDeniedCategory = mandate.deniedCategories.some((denied) =>
      itemCategory.includes(denied.toLowerCase())
    );

    if (isDeniedCategory) {
      checks.push({
        ruleName: 'Category Whitelist & Blacklist',
        passed: false,
        message: `Category "${proposal.product.category}" is explicitly denied in mandate`,
        severity: 'BLOCK',
      });
      reasons.push(`Denied category match for "${proposal.product.category}".`);
    } else if (mandate.allowedCategories.length > 0) {
      const isAllowedCategory = mandate.allowedCategories.some((allowed) =>
        allowed.toLowerCase() === '*' || itemCategory.includes(allowed.toLowerCase())
      );
      if (!isAllowedCategory) {
        checks.push({
          ruleName: 'Category Whitelist & Blacklist',
          passed: false,
          message: `Category "${proposal.product.category}" is not in mandate allowed list [${mandate.allowedCategories.join(', ')}]`,
          severity: 'BLOCK',
        });
        reasons.push(`Category "${proposal.product.category}" is not permitted.`);
      } else {
        checks.push({
          ruleName: 'Category Whitelist & Blacklist',
          passed: true,
          message: `Category "${proposal.product.category}" is allowed`,
          severity: 'PASS',
        });
      }
    } else {
      checks.push({
        ruleName: 'Category Whitelist & Blacklist',
        passed: true,
        message: 'No category restriction active',
        severity: 'PASS',
      });
    }

    // 7. Merchant Rules & Reputation
    const merchantName = (proposal.offer.merchantName || '').toLowerCase();
    const isDeniedMerchant = mandate.deniedMerchants.some((m) =>
      merchantName.includes(m.toLowerCase())
    );

    if (isDeniedMerchant) {
      checks.push({
        ruleName: 'Merchant Allow/Deny List',
        passed: false,
        message: `Merchant "${proposal.offer.merchantName}" is blacklisted`,
        severity: 'BLOCK',
      });
      reasons.push(`Merchant "${proposal.offer.merchantName}" is on the denied vendor list.`);
    } else if (mandate.allowedMerchants.length > 0) {
      const isAllowedMerchant = mandate.allowedMerchants.some((m) =>
        merchantName.includes(m.toLowerCase())
      );
      if (!isAllowedMerchant) {
        checks.push({
          ruleName: 'Merchant Allow/Deny List',
          passed: false,
          message: `Merchant "${proposal.offer.merchantName}" is not on approved merchant list`,
          severity: 'BLOCK',
        });
        reasons.push(`Merchant "${proposal.offer.merchantName}" is not in approved list.`);
      } else {
        checks.push({
          ruleName: 'Merchant Allow/Deny List',
          passed: true,
          message: `Merchant "${proposal.offer.merchantName}" is approved`,
          severity: 'PASS',
        });
      }
    } else {
      checks.push({
        ruleName: 'Merchant Allow/Deny List',
        passed: true,
        message: `Merchant "${proposal.offer.merchantName}" permitted`,
        severity: 'PASS',
      });
    }

    // Minimum merchant rating check
    if (proposal.offer.merchantRating < mandate.minMerchantRating) {
      checks.push({
        ruleName: 'Merchant Reputation Score',
        passed: false,
        message: `Merchant rating ${proposal.offer.merchantRating} below minimum required ${mandate.minMerchantRating}`,
        severity: 'BLOCK',
      });
      reasons.push(`Merchant trust score (${proposal.offer.merchantRating}/5) fails minimum bar (${mandate.minMerchantRating}/5).`);
    } else {
      checks.push({
        ruleName: 'Merchant Reputation Score',
        passed: true,
        message: `Merchant rating ${proposal.offer.merchantRating} meets threshold >= ${mandate.minMerchantRating}`,
        severity: 'PASS',
      });
    }

    // 8. Price Drift Check (> allowPriceDriftPercent between decision time and checkout)
    if (proposal.checkoutUnitPrice !== undefined && proposal.quotedUnitPrice > 0) {
      const priceDiff = proposal.checkoutUnitPrice - proposal.quotedUnitPrice;
      const driftPercent = (priceDiff / proposal.quotedUnitPrice) * 100;
      if (driftPercent > mandate.allowPriceDriftPercent) {
        checks.push({
          ruleName: 'Price Drift Protection',
          passed: false,
          message: `Checkout price drift of +${driftPercent.toFixed(1)}% exceeds allowed threshold +${mandate.allowPriceDriftPercent}% ($${proposal.quotedUnitPrice.toFixed(2)} -> $${proposal.checkoutUnitPrice.toFixed(2)})`,
          severity: 'BLOCK',
        });
        reasons.push(`Bait-and-switch drift: price surged +${driftPercent.toFixed(1)}% at checkout.`);
      } else {
        checks.push({
          ruleName: 'Price Drift Protection',
          passed: true,
          message: `Price drift (${driftPercent.toFixed(1)}%) is within acceptable range <= ${mandate.allowPriceDriftPercent}%`,
          severity: 'PASS',
        });
      }
    }

    // 8b. Offer Stock Availability
    if (proposal.offer.inStock === false) {
      checks.push({
        ruleName: 'Offer Stock Availability',
        passed: false,
        message: 'Proposed offer is out of stock',
        severity: 'BLOCK',
      });
      reasons.push('Out-of-stock items cannot be ordered.');
    } else {
      checks.push({
        ruleName: 'Offer Stock Availability',
        passed: true,
        message: 'Offer is currently in stock',
        severity: 'PASS',
      });
    }

    // 9. Velocity Limit Check
    const velocityCount = proposal.recentPurchasesCount ?? proposal.recentPurchasesInPastHour;
    if (
      velocityCount !== undefined &&
      velocityCount >= mandate.maxPurchasesPerHour
    ) {
      checks.push({
        ruleName: 'Velocity Control Rate Limit',
        passed: false,
        message: `Purchases velocity (${velocityCount}/hr) reached mandate rate limit (${mandate.maxPurchasesPerHour}/hr)`,
        severity: 'BLOCK',
      });
      reasons.push(`Velocity rate limit exceeded (${velocityCount}/${mandate.maxPurchasesPerHour} purchases per hour).`);
    } else {
      checks.push({
        ruleName: 'Velocity Control Rate Limit',
        passed: true,
        message: 'Velocity within safe thresholds',
        severity: 'PASS',
      });
    }

    // 10. Duplicate Purchase Idempotency Check
    if (
      proposal.previousPurchasedProductIds &&
      proposal.previousPurchasedProductIds.includes(proposal.productId)
    ) {
      checks.push({
        ruleName: 'Duplicate Purchase Idempotency',
        passed: false,
        message: `Item ID ${proposal.productId} was already purchased under this mandate session`,
        severity: 'BLOCK',
      });
      reasons.push(`Duplicate purchase prevented for product ${proposal.productId}.`);
    } else {
      checks.push({
        ruleName: 'Duplicate Purchase Idempotency',
        passed: true,
        message: 'No duplicate purchase detected',
        severity: 'PASS',
      });
    }

    // 11. Security & Shield Quarantine Check
    if (proposal.product.isPoisoned || (proposal.shieldResult && !proposal.shieldResult.isSafe)) {
      checks.push({
        ruleName: 'Prompt Injection & Security Shield',
        passed: false,
        message: `Item flagged by Security Shield: ${proposal.shieldResult?.attackVectorsDetected.join(', ') || 'Poisoned listing payload'}`,
        severity: 'BLOCK',
      });
      reasons.push('Security quarantine: untrusted listing contains adversarial prompt injection attempt.');
    } else {
      checks.push({
        ruleName: 'Prompt Injection & Security Shield',
        passed: true,
        message: 'Item content verified clean by multi-layer shield',
        severity: 'PASS',
      });
    }

    // Determine Overall Verdict
    const hasBlock = checks.some((c) => c.severity === 'BLOCK');
    if (hasBlock) {
      return {
        overallVerdict: 'BLOCK',
        checks,
        reasons,
        evaluatedAt: now.toISOString(),
      };
    }

    // 12. Human Approval Gate
    // If not blocked, but totalAmount exceeds autoApproveThreshold, require Human Approval
    if (totalAmount > mandate.autoApproveThreshold) {
      checks.push({
        ruleName: 'Human Approval Threshold',
        passed: true,
        message: `Total $${totalAmount.toFixed(2)} exceeds auto-approval threshold of $${mandate.autoApproveThreshold.toFixed(2)}. Human review required.`,
        severity: 'NEEDS_APPROVAL',
      });
      reasons.push(
        `Purchase amount ($${totalAmount.toFixed(2)}) exceeds autonomous threshold ($${mandate.autoApproveThreshold.toFixed(2)}). Awaiting human authorization.`
      );
      return {
        overallVerdict: 'NEEDS_APPROVAL',
        checks,
        reasons,
        evaluatedAt: now.toISOString(),
      };
    }

    checks.push({
      ruleName: 'Human Approval Threshold',
      passed: true,
      message: `Total $${totalAmount.toFixed(2)} <= $${mandate.autoApproveThreshold.toFixed(2)} (Autonomous clearance)`,
      severity: 'PASS',
    });

    return {
      overallVerdict: 'ALLOW',
      checks,
      reasons: ['All deterministic policy checks passed autonomously.'],
      evaluatedAt: now.toISOString(),
    };
  }
}
