import { MandateRule } from './mandate.ts';
import { ProductItem, ProductOffer } from './channel3.ts';

export type LedgerStatus =
  | 'PROPOSED'
  | 'POLICY_BLOCKED'
  | 'SHIELD_BLOCKED'
  | 'NEEDS_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CAPTURED'
  | 'REFUNDED'
  | 'DISPUTED';

export interface PolicyCheckItemResult {
  ruleName: string;
  passed: boolean;
  message: string;
  severity: 'BLOCK' | 'NEEDS_APPROVAL' | 'PASS';
}

export interface PolicyEvaluation {
  overallVerdict: 'ALLOW' | 'NEEDS_APPROVAL' | 'BLOCK';
  checks: PolicyCheckItemResult[];
  reasons: string[];
  evaluatedAt: string;
}

export interface ShieldEvaluation {
  isSafe: boolean;
  riskScore: number; // 0 to 100
  attackVectorsDetected: string[];
  quarantinedTextSnippet?: string;
  evaluatedAt: string;
}

export interface AgentTelemetry {
  modelName: string;
  totalTokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  estimatedCostUsd: number;
}

export interface LedgerEntry {
  id: string; // e.g. LSH-2026-0012
  timestamp: string;
  scenarioKey?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'CUSTOM';
  missionPrompt: string;
  mandateSnapshot: MandateRule;
  status: LedgerStatus;
  
  // Proposed purchase data (from structured proposal, never raw LLM text)
  product?: ProductItem;
  selectedOffer?: ProductOffer;
  quantity: number;
  totalAmount: number;
  currency: string;
  
  // Safety & policy evaluations
  shieldResult?: ShieldEvaluation;
  policyResult?: PolicyEvaluation;
  agentReasoning: string;
  riskAnalysis: string;
  
  // Human approval (if applicable)
  humanApproval?: {
    approvedAt: string;
    approvedBy: string;
    notes?: string;
  };
  
  // PayPal settlement & transaction tracking
  paypalOrderId?: string;
  paypalCaptureId?: string;
  paypalRefundId?: string;
  idempotencyKey: string;
  isCachedDemoResult?: boolean;
  
  // Telemetry
  telemetry: AgentTelemetry;
}

export interface TraceStep {
  id: string;
  stepNumber: number;
  title: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
  description: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface MissionRunProgress {
  missionId: string;
  currentStep: number;
  steps: TraceStep[];
  ledgerEntry?: LedgerEntry;
  isComplete: boolean;
  error?: string;
}
