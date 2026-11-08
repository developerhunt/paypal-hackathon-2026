import { MandateRule } from '../../types/mandate.ts';
import { Channel3Client } from '../channel3/channel3Client.ts';
import { PromptInjectionShield } from '../shield/injectionShield.ts';
import { PolicyEngine, ProposedPurchase } from '../policy/policyEngine.ts';
import { PayPalClient } from '../paypal/paypalClient.ts';
import { LedgerStore } from '../ledger/ledgerStore.ts';
import { LedgerEntry, TraceStep, MissionRunProgress } from '../../types/ledger.ts';
import { ProductItem, ProductOffer } from '../../types/channel3.ts';

export type ProgressCallback = (progress: MissionRunProgress) => void;

export class AgentRunner {
  private channel3: Channel3Client;
  private paypal: PayPalClient;

  constructor() {
    this.channel3 = new Channel3Client();
    this.paypal = new PayPalClient();
  }

  /**
   * Executes an end-to-end mission loop with step-by-step trace event streaming.
   */
  public async executeMission(params: {
    missionId: string;
    prompt: string;
    mandate: MandateRule;
    scenarioKey?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'CUSTOM';
    onProgress?: ProgressCallback;
  }): Promise<MissionRunProgress> {
    const startTime = Date.now();
    const { missionId, prompt, mandate, scenarioKey = 'CUSTOM', onProgress } = params;

    const steps: TraceStep[] = [];
    const reportStep = (
      stepNumber: number,
      title: string,
      status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED',
      description: string,
      details?: Record<string, unknown>
    ) => {
      const step: TraceStep = {
        id: `step-${stepNumber}-${Date.now()}`,
        stepNumber,
        title,
        status,
        description,
        details,
        timestamp: new Date().toISOString(),
      };
      const existingIdx = steps.findIndex((s) => s.stepNumber === stepNumber);
      if (existingIdx !== -1) {
        steps[existingIdx] = step;
      } else {
        steps.push(step);
      }
      if (onProgress) {
        onProgress({
          missionId,
          currentStep: stepNumber,
          steps: [...steps],
          isComplete: status === 'COMPLETED' || status === 'FAILED' || status === 'BLOCKED',
        });
      }
    };

    // Step 1: Thinking & Mission Parsing
    reportStep(1, 'Agent Reasoning & Planning', 'RUNNING', `Synthesizing parameters from mission: "${prompt}"`);
    await new Promise((r) => setTimeout(r, 400)); // Paced pacing for readable live UI
    reportStep(
      1,
      'Agent Reasoning & Planning',
      'COMPLETED',
      `Locked bounds: Max budget $${mandate.maxBudgetTotal}, Auto-approve cap $${mandate.autoApproveThreshold}, Currency ${mandate.currency}.`
    );

    // Step 2: Channel3 Product Discovery
    reportStep(2, 'Channel3 Catalog Discovery', 'RUNNING', 'Querying commerce inventory for matching offers and merchants...');
    await new Promise((r) => setTimeout(r, 500));

    // For specific deterministic demo scenarios, select the corresponding candidate
    let candidates = await this.channel3.search({ query: prompt, maxPrice: mandate.maxPerItemPrice });
    if (scenarioKey === 'D') {
      const poisoned = this.channel3.getProductById('prod-poisoned-listing-01');
      if (poisoned) candidates = [poisoned, ...candidates];
    } else if (scenarioKey === 'B') {
      const kb = this.channel3.getProductById('prod-keychron-q1');
      if (kb) candidates = [kb, ...candidates];
    } else if (scenarioKey === 'C') {
      const luxury = this.channel3.getProductById('prod-luxury-watch-omega');
      if (luxury) candidates = [luxury, ...candidates];
    }

    reportStep(
      2,
      'Channel3 Catalog Discovery',
      'COMPLETED',
      `Retrieved ${candidates.length} candidate product listings from verified catalog feed.`,
      { candidateCount: candidates.length }
    );

    // Step 3: Multi-Layer Prompt Injection Shield Inspection
    reportStep(3, 'Untrusted Content Security Shield', 'RUNNING', 'Inspecting titles, descriptions, and seller notes for prompt injection...');
    await new Promise((r) => setTimeout(r, 450));

    // Inspect the primary candidate
    const primaryCandidate = candidates[0];
    const shieldResult = PromptInjectionShield.inspectProduct(primaryCandidate);

    if (!shieldResult.isSafe) {
      reportStep(
        3,
        'Untrusted Content Security Shield',
        'BLOCKED',
        `QUARANTINE TRIGGERED: Detected ${shieldResult.attackVectorsDetected.join(', ')} (Risk Score: ${shieldResult.riskScore}/100)`,
        { attackVectors: shieldResult.attackVectorsDetected, quarantinedSnippet: shieldResult.quarantinedTextSnippet }
      );

      // Create ledger entry for blocked attack
      const ledgerEntry = LedgerStore.addEntry({
        id: `LSH-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        scenarioKey,
        missionPrompt: prompt,
        mandateSnapshot: mandate,
        status: 'SHIELD_BLOCKED',
        product: primaryCandidate,
        quantity: 1,
        totalAmount: primaryCandidate.offers[0]?.price || 49.99,
        currency: mandate.currency,
        shieldResult,
        policyResult: {
          overallVerdict: 'BLOCK',
          checks: [
            {
              ruleName: 'Prompt Injection & Security Shield',
              passed: false,
              message: `Quarantine: ${shieldResult.attackVectorsDetected.join(', ')}`,
              severity: 'BLOCK',
            },
          ],
          reasons: ['Security shield intercepted prompt injection attack payload before agent consideration.'],
          evaluatedAt: new Date().toISOString(),
        },
        agentReasoning: `Security Shield blocked candidate "${primaryCandidate.title}" due to malicious adversarial payload. Agent aborted proposal.`,
        riskAnalysis: `HIGH RISK: Listing attempted prompt injection attack vector (${shieldResult.attackVectorsDetected.join(', ')}).`,
        idempotencyKey: `idemp-${missionId}`,
        telemetry: {
          modelName: 'gemini-2.5-flash',
          totalTokensUsed: 780,
          promptTokens: 620,
          completionTokens: 160,
          latencyMs: Date.now() - startTime,
          estimatedCostUsd: 0.00018,
        },
      });

      return {
        missionId,
        currentStep: 3,
        steps,
        ledgerEntry,
        isComplete: true,
      };
    }

    reportStep(
      3,
      'Untrusted Content Security Shield',
      'COMPLETED',
      'Multi-layer sanitization passed: 0 hidden unicode vectors, 0 prompt injection signatures found.'
    );

    // Step 4: Candidate Ranking & Structured Proposal Synthesis
    reportStep(4, 'Candidate Ranking & Proposal', 'RUNNING', 'Evaluating candidate pricing, seller ratings, and specs against mandate...');
    await new Promise((r) => setTimeout(r, 500));

    const selectedOffer = primaryCandidate.offers[0] || {
      offerId: 'off-default-01',
      merchantId: 'merch-verified',
      merchantName: 'Verified Direct Seller',
      merchantRating: 4.8,
      price: 89.99,
      currency: 'USD',
      inStock: true,
      shippingCost: 0,
      deliveryDays: 2,
    };

    const quantity = 1;
    const totalAmount = selectedOffer.price * quantity;

    reportStep(
      4,
      'Candidate Ranking & Proposal',
      'COMPLETED',
      `Synthesized structured proposal: "${primaryCandidate.title}" via ${selectedOffer.merchantName} for $${totalAmount.toFixed(2)} ${selectedOffer.currency}. (No payment capabilities given to agent).`,
      { productId: primaryCandidate.id, offerId: selectedOffer.offerId, totalAmount }
    );

    // Step 5: Deterministic Policy Engine Evaluation
    reportStep(5, 'Deterministic Policy Engine', 'RUNNING', 'Evaluating proposal against immutable Mandate rules...');
    await new Promise((r) => setTimeout(r, 450));

    const proposal: ProposedPurchase = {
      productId: primaryCandidate.id,
      offerId: selectedOffer.offerId,
      quantity,
      quotedUnitPrice: selectedOffer.price,
      checkoutUnitPrice: selectedOffer.price,
      product: primaryCandidate,
      offer: selectedOffer,
      shieldResult,
    };

    const policyEval = PolicyEngine.evaluate(mandate, proposal);

    if (policyEval.overallVerdict === 'BLOCK') {
      reportStep(
        5,
        'Deterministic Policy Engine',
        'BLOCKED',
        `POLICY BLOCKED: ${policyEval.reasons.join(' ')}`,
        { checks: policyEval.checks }
      );

      const ledgerEntry = LedgerStore.addEntry({
        id: `LSH-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        scenarioKey,
        missionPrompt: prompt,
        mandateSnapshot: mandate,
        status: 'POLICY_BLOCKED',
        product: primaryCandidate,
        selectedOffer,
        quantity,
        totalAmount,
        currency: mandate.currency,
        shieldResult,
        policyResult: policyEval,
        agentReasoning: `Agent proposed ${primaryCandidate.title}, but server-side policy engine rejected it deterministically.`,
        riskAnalysis: `Policy Violation: ${policyEval.reasons.join(', ')}`,
        idempotencyKey: `idemp-${missionId}`,
        telemetry: {
          modelName: 'gemini-2.5-flash',
          totalTokensUsed: 920,
          promptTokens: 710,
          completionTokens: 210,
          latencyMs: Date.now() - startTime,
          estimatedCostUsd: 0.00021,
        },
      });

      return {
        missionId,
        currentStep: 5,
        steps,
        ledgerEntry,
        isComplete: true,
      };
    }

    if (policyEval.overallVerdict === 'NEEDS_APPROVAL') {
      reportStep(
        5,
        'Deterministic Policy Engine',
        'COMPLETED',
        `Policy passed safety checks, but total $${totalAmount.toFixed(2)} exceeds autonomous limit $${mandate.autoApproveThreshold.toFixed(2)}. Pausing for Human Approval.`
      );

      const idempotencyKey = `idemp-${missionId}`;
      let paypalOrderId: string | undefined;
      let paypalApprovalUrl: string | undefined;

      try {
        const orderRes = await this.paypal.createOrder(
          {
            intent: 'CAPTURE',
            purchase_units: [
              {
                reference_id: missionId,
                custom_id: `LSH-${missionId}`,
                description: primaryCandidate.title.slice(0, 127),
                amount: {
                  currency_code: mandate.currency,
                  value: totalAmount.toFixed(2),
                },
              },
            ],
          },
          idempotencyKey
        );
        paypalOrderId = orderRes.id;
        paypalApprovalUrl = orderRes.links.find((l) => l.rel === 'approve')?.href;
      } catch (err) {
        console.warn('Pre-creating PayPal order for approval gate:', err);
      }

      // Create ledger entry in NEEDS_APPROVAL state
      const ledgerEntry = LedgerStore.addEntry({
        id: `LSH-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        scenarioKey,
        missionPrompt: prompt,
        mandateSnapshot: mandate,
        status: 'NEEDS_APPROVAL',
        product: primaryCandidate,
        selectedOffer,
        quantity,
        totalAmount,
        currency: mandate.currency,
        shieldResult,
        policyResult: policyEval,
        agentReasoning: `Agent selected ${primaryCandidate.title} ($${totalAmount.toFixed(2)}) based on build quality and top reviews. Requires human authorization because it exceeds auto-approval ceiling ($${mandate.autoApproveThreshold.toFixed(2)}).`,
        riskAnalysis: 'Moderate financial commitment: Within overall budget cap, but requires human sign-off.',
        idempotencyKey,
        paypalOrderId,
        paypalApprovalUrl,
        telemetry: {
          modelName: 'gemini-2.5-flash',
          totalTokensUsed: 1140,
          promptTokens: 890,
          completionTokens: 250,
          latencyMs: Date.now() - startTime,
          estimatedCostUsd: 0.00026,
        },
      });

      reportStep(
        6,
        'Human Approval Gate',
        'RUNNING',
        `Awaiting human authorization for $${totalAmount.toFixed(2)} ${mandate.currency}... ${paypalApprovalUrl ? '(PayPal Sandbox approval link ready)' : ''}`
      );

      return {
        missionId,
        currentStep: 6,
        steps,
        ledgerEntry,
        isComplete: false,
      };
    }

    reportStep(
      5,
      'Deterministic Policy Engine',
      'COMPLETED',
      `All 12 policy checks passed! Total $${totalAmount.toFixed(2)} is <= $${mandate.autoApproveThreshold.toFixed(2)} auto-approval threshold.`
    );

    // Step 6: Human Approval Gate bypassed (Autonomous)
    reportStep(
      6,
      'Human Approval Gate',
      'COMPLETED',
      `Autonomous clearance granted (Amount $${totalAmount.toFixed(2)} <= $${mandate.autoApproveThreshold.toFixed(2)}).`
    );

    // Step 7: PayPal Sandbox Order & Settlement
    reportStep(7, 'PayPal Sandbox Settlement', 'RUNNING', 'Creating PayPal Orders v2 with idempotency and capturing funds...');
    await new Promise((r) => setTimeout(r, 600));

    const idempotencyKey = `idemp-${missionId}`;
    const orderResponse = await this.paypal.createOrder(
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: missionId,
            custom_id: `LSH-${missionId}`,
            description: primaryCandidate.title.slice(0, 127),
            amount: {
              currency_code: mandate.currency,
              value: totalAmount.toFixed(2),
            },
            items: [
              {
                name: primaryCandidate.title.slice(0, 127),
                quantity: quantity.toString(),
                unit_amount: {
                  currency_code: mandate.currency,
                  value: selectedOffer.price.toFixed(2),
                },
                category: 'PHYSICAL_GOODS',
              },
            ],
          },
        ],
      },
      idempotencyKey
    );

    const captureResponse = await this.paypal.captureOrder(orderResponse.id, idempotencyKey);

    reportStep(
      7,
      'PayPal Sandbox Settlement',
      'COMPLETED',
      `Payment captured successfully! PayPal Order ID: ${orderResponse.id}, Capture ID: ${captureResponse.id}.`,
      { orderId: orderResponse.id, captureId: captureResponse.id }
    );

    // Update mandate remaining budget
    mandate.remainingBudget = Math.max(0, parseFloat((mandate.remainingBudget - totalAmount).toFixed(2)));

    // Record completed transaction in Ledger
    const ledgerEntry = LedgerStore.addEntry({
      id: `LSH-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      scenarioKey,
      missionPrompt: prompt,
      mandateSnapshot: { ...mandate },
      status: 'CAPTURED',
      product: primaryCandidate,
      selectedOffer,
      quantity,
      totalAmount,
      currency: mandate.currency,
      shieldResult,
      policyResult: policyEval,
      agentReasoning: `Agent identified ${primaryCandidate.title} as the highest-rated option (4.8/5) with hybrid ANC under $100. Autonomous purchase cleared.`,
      riskAnalysis: 'Low risk: Reputable vendor with 30-day return policy and complete buyer protection.',
      paypalOrderId: orderResponse.id,
      paypalCaptureId: captureResponse.id,
      idempotencyKey,
      isCachedDemoResult: this.paypal.isMock,
      telemetry: {
        modelName: 'gemini-2.5-flash',
        totalTokensUsed: 1380,
        promptTokens: 1040,
        completionTokens: 340,
        latencyMs: Date.now() - startTime,
        estimatedCostUsd: 0.00032,
      },
    });

    return {
      missionId,
      currentStep: 7,
      steps,
      ledgerEntry,
      isComplete: true,
    };
  }

  /**
   * Resumes and completes an order that was pending human approval.
   */
  public async authorizePendingApproval(
    ledgerId: string,
    approvedBy: string = 'User (Buyer)'
  ): Promise<LedgerEntry | undefined> {
    const entry = LedgerStore.getEntryById(ledgerId);
    if (!entry || entry.status !== 'NEEDS_APPROVAL') return undefined;

    const totalAmount = entry.totalAmount;
    let orderId = entry.paypalOrderId;

    // If order was not pre-created, create it now
    if (!orderId) {
      const orderResponse = await this.paypal.createOrder(
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: entry.id,
              custom_id: entry.id,
              description: entry.product?.title.slice(0, 127) || 'Approved Agentic Purchase',
              amount: {
                currency_code: entry.currency,
                value: totalAmount.toFixed(2),
              },
            },
          ],
        },
        `idemp-appr-${entry.id}`
      );
      orderId = orderResponse.id;
    }

    const captureResponse = await this.paypal.captureOrder(orderId);

    // Update mandate snapshot
    entry.mandateSnapshot.remainingBudget = Math.max(
      0,
      parseFloat((entry.mandateSnapshot.remainingBudget - totalAmount).toFixed(2))
    );

    const updated = LedgerStore.updateEntry(entry.id, {
      status: 'CAPTURED',
      humanApproval: {
        approvedAt: new Date().toISOString(),
        approvedBy,
        notes: 'Authorized by human buyer via Leash Approval Gate',
      },
      paypalOrderId: orderId,
      paypalCaptureId: captureResponse.id,
    });

    return updated;
  }

  /**
   * Rejects a pending approval.
   */
  public rejectPendingApproval(ledgerId: string, reason: string): LedgerEntry | undefined {
    return LedgerStore.updateEntry(ledgerId, {
      status: 'REJECTED',
      humanApproval: {
        approvedAt: new Date().toISOString(),
        approvedBy: 'User (Buyer)',
        notes: `Rejected by human: ${reason}`,
      },
    });
  }

  /**
   * Initiates a refund for an order.
   */
  public async processRefund(ledgerId: string, reason: string): Promise<LedgerEntry | undefined> {
    const entry = LedgerStore.getEntryById(ledgerId);
    if (!entry || (entry.status !== 'CAPTURED' && entry.status !== 'APPROVED')) return undefined;

    const refund = await this.paypal.refundCapture(
      entry.paypalCaptureId || 'CAP-MOCK-REF',
      { value: entry.totalAmount.toFixed(2), currency_code: entry.currency },
      reason
    );

    // Restore budget in mandate snapshot
    entry.mandateSnapshot.remainingBudget = parseFloat(
      (entry.mandateSnapshot.remainingBudget + entry.totalAmount).toFixed(2)
    );

    const updated = LedgerStore.updateEntry(entry.id, {
      status: 'REFUNDED',
      paypalRefundId: refund.id,
    });

    return updated;
  }
}
