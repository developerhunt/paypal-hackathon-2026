import test from 'node:test';
import assert from 'node:assert/strict';
import { PolicyEngine, ProposedPurchase } from './policyEngine.ts';
import { MandateRule } from '../../types/mandate.ts';
import { ProductItem, ProductOffer } from '../../types/channel3.ts';

const baseMandate: MandateRule = {
  id: 'mandate-test-01',
  name: 'Headphones Budget Mandate',
  maxBudgetTotal: 150,
  remainingBudget: 150,
  maxPerItemPrice: 150,
  autoApproveThreshold: 100, // <= 100 is auto-approved, > 100 needs human approval
  allowedCategories: ['Electronics', 'Audio', 'Headphones'],
  deniedCategories: ['Luxury', 'Weapons'],
  allowedMerchants: [],
  deniedMerchants: ['ShadyElectronicsDirect'],
  minMerchantRating: 4.0,
  currency: 'USD',
  maxQuantityPerItem: 2,
  maxPurchasesPerHour: 5,
  expiresAt: new Date(Date.now() + 3600 * 1000 * 24).toISOString(), // 24 hours in future
  allowPriceDriftPercent: 5,
};

const cleanProduct: ProductItem = {
  id: 'prod-headphones-01',
  title: 'SoundMaster Pro Active Noise Cancelling Headphones',
  description: 'High fidelity audio with 40h battery life and hybrid ANC.',
  brand: 'SoundMaster',
  category: 'Audio / Electronics',
  imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
  rating: 4.7,
  reviewCount: 1420,
  offers: [],
};

const cleanOffer: ProductOffer = {
  offerId: 'off-01',
  merchantId: 'merch-bestbuy',
  merchantName: 'BestBuy Official',
  merchantRating: 4.8,
  price: 89.99,
  currency: 'USD',
  inStock: true,
  shippingCost: 0,
  deliveryDays: 2,
};

test('PolicyEngine: Scenario A - Auto-approve under $100 threshold', () => {
  const proposal: ProposedPurchase = {
    productId: cleanProduct.id,
    offerId: cleanOffer.offerId,
    quantity: 1,
    quotedUnitPrice: 89.99,
    product: cleanProduct,
    offer: cleanOffer,
  };

  const evalResult = PolicyEngine.evaluate(baseMandate, proposal);
  assert.equal(evalResult.overallVerdict, 'ALLOW');
  assert.equal(evalResult.checks.every((c) => c.severity !== 'BLOCK'), true);
});

test('PolicyEngine: Scenario B - Needs Human Approval when total exceeds threshold', () => {
  const highOffer: ProductOffer = {
    ...cleanOffer,
    price: 139.0, // Above autoApproveThreshold (100) but below maxBudget (150)
  };

  const proposal: ProposedPurchase = {
    productId: cleanProduct.id,
    offerId: highOffer.offerId,
    quantity: 1,
    quotedUnitPrice: 139.0,
    product: cleanProduct,
    offer: highOffer,
  };

  const evalResult = PolicyEngine.evaluate(baseMandate, proposal);
  assert.equal(evalResult.overallVerdict, 'NEEDS_APPROVAL');
  assert.ok(evalResult.reasons.some((r) => r.includes('exceeds autonomous threshold')));
});

test('PolicyEngine: Scenario C1 - Over budget block', () => {
  const overBudgetOffer: ProductOffer = {
    ...cleanOffer,
    price: 180.0, // Exceeds budget 150
  };

  const proposal: ProposedPurchase = {
    productId: cleanProduct.id,
    offerId: overBudgetOffer.offerId,
    quantity: 1,
    quotedUnitPrice: 180.0,
    product: cleanProduct,
    offer: overBudgetOffer,
  };

  const evalResult = PolicyEngine.evaluate(baseMandate, proposal);
  assert.equal(evalResult.overallVerdict, 'BLOCK');
  assert.ok(evalResult.checks.some((c) => c.ruleName === 'Total Budget Ceiling' && !c.passed));
});

test('PolicyEngine: Scenario C2 - Denied Category block', () => {
  const luxuryProduct: ProductItem = {
    ...cleanProduct,
    category: 'Luxury Fashion Goods',
  };

  const proposal: ProposedPurchase = {
    productId: luxuryProduct.id,
    offerId: cleanOffer.offerId,
    quantity: 1,
    quotedUnitPrice: 89.99,
    product: luxuryProduct,
    offer: cleanOffer,
  };

  const evalResult = PolicyEngine.evaluate(baseMandate, proposal);
  assert.equal(evalResult.overallVerdict, 'BLOCK');
  assert.ok(evalResult.reasons.some((r) => r.includes('Denied category')));
});

test('PolicyEngine: Scenario C3 - Blacklisted Merchant block', () => {
  const badMerchantOffer: ProductOffer = {
    ...cleanOffer,
    merchantName: 'ShadyElectronicsDirect',
    merchantRating: 4.5,
  };

  const proposal: ProposedPurchase = {
    productId: cleanProduct.id,
    offerId: badMerchantOffer.offerId,
    quantity: 1,
    quotedUnitPrice: 89.99,
    product: cleanProduct,
    offer: badMerchantOffer,
  };

  const evalResult = PolicyEngine.evaluate(baseMandate, proposal);
  assert.equal(evalResult.overallVerdict, 'BLOCK');
  assert.ok(evalResult.reasons.some((r) => r.includes('denied vendor list')));
});

test('PolicyEngine: Price Drift Protection (> 5% blocks)', () => {
  const proposal: ProposedPurchase = {
    productId: cleanProduct.id,
    offerId: cleanOffer.offerId,
    quantity: 1,
    quotedUnitPrice: 80.0,
    checkoutUnitPrice: 95.0, // Surged from 80 to 95 (+18.75% drift > 5% allowed)
    product: cleanProduct,
    offer: { ...cleanOffer, price: 95.0 },
  };

  const evalResult = PolicyEngine.evaluate(baseMandate, proposal);
  assert.equal(evalResult.overallVerdict, 'BLOCK');
  assert.ok(evalResult.checks.some((c) => c.ruleName === 'Price Drift Protection' && !c.passed));
});

test('PolicyEngine: Currency Mismatch block', () => {
  const eurOffer: ProductOffer = {
    ...cleanOffer,
    currency: 'EUR',
  };

  const proposal: ProposedPurchase = {
    productId: cleanProduct.id,
    offerId: eurOffer.offerId,
    quantity: 1,
    quotedUnitPrice: 89.99,
    product: cleanProduct,
    offer: eurOffer,
  };

  const evalResult = PolicyEngine.evaluate(baseMandate, proposal);
  assert.equal(evalResult.overallVerdict, 'BLOCK');
  assert.ok(evalResult.checks.some((c) => c.ruleName === 'Currency Consistency' && !c.passed));
});

test('PolicyEngine: Expired Mandate block', () => {
  const expiredMandate: MandateRule = {
    ...baseMandate,
    expiresAt: new Date(Date.now() - 60000).toISOString(), // 1 min in past
  };

  const proposal: ProposedPurchase = {
    productId: cleanProduct.id,
    offerId: cleanOffer.offerId,
    quantity: 1,
    quotedUnitPrice: 89.99,
    product: cleanProduct,
    offer: cleanOffer,
  };

  const evalResult = PolicyEngine.evaluate(expiredMandate, proposal);
  assert.equal(evalResult.overallVerdict, 'BLOCK');
  assert.ok(evalResult.reasons.some((r) => r.includes('Mandate has expired')));
});

test('PolicyEngine: Duplicate Idempotency block', () => {
  const proposal: ProposedPurchase = {
    productId: cleanProduct.id,
    offerId: cleanOffer.offerId,
    quantity: 1,
    quotedUnitPrice: 89.99,
    product: cleanProduct,
    offer: cleanOffer,
    previousPurchasedProductIds: [cleanProduct.id], // already purchased
  };

  const evalResult = PolicyEngine.evaluate(baseMandate, proposal);
  assert.equal(evalResult.overallVerdict, 'BLOCK');
  assert.ok(evalResult.checks.some((c) => c.ruleName === 'Duplicate Purchase Idempotency' && !c.passed));
});
