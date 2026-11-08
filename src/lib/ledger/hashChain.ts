import crypto from 'crypto';

/**
 * Deterministically serializes any JavaScript object with sorted keys.
 * Omits volatile fields (such as `entryHash` itself) to compute stable hashes.
 */
export function canonicalJson(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return 'null';
  }
  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJson).join(',') + ']';
  }

  const record = obj as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter((k) => k !== 'entryHash') // Never hash the entryHash field itself
    .sort();

  const parts = keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(record[k])}`);
  return '{' + parts.join(',') + '}';
}

export const GENESIS_HASH = '0'.repeat(64);

/**
 * Computes SHA-256 hash for a ledger entry given the previous entry's hash.
 */
export function computeEntryHash(prevHash: string, entryData: Record<string, unknown>): string {
  // Always ensure prevHash is part of the canonical payload
  const payloadWithPrev = { ...entryData, prevHash };
  const canonicalPayload = canonicalJson(payloadWithPrev);
  return crypto.createHash('sha256').update(prevHash + canonicalPayload).digest('hex');
}

export interface ChainVerificationResult {
  valid: boolean;
  entriesCount: number;
  brokenAt?: string;
  expectedHash?: string;
  actualHash?: string;
  message: string;
}

/**
 * Verifies that the append-only ledger forms a continuous, unbroken SHA-256 hash chain.
 */
export function verifyChain(
  entries: Array<Record<string, unknown> & { id: string; prevHash: string; entryHash: string }>
): ChainVerificationResult {
  if (!entries || entries.length === 0) {
    return {
      valid: true,
      entriesCount: 0,
      message: 'Ledger is empty; genesis chain valid.',
    };
  }

  let expectedPrevHash = GENESIS_HASH;

  // Process in chronological order (from genesis to latest)
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Check 1: Does entry.prevHash match the previous entry's hash?
    if (entry.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        entriesCount: entries.length,
        brokenAt: entry.id,
        expectedHash: expectedPrevHash,
        actualHash: entry.prevHash,
        message: `Hash link mismatch at entry ${entry.id}. Expected prevHash=${expectedPrevHash.slice(0, 16)}..., got ${entry.prevHash.slice(0, 16)}...`,
      };
    }

    // Check 2: Does the entry's computed hash match its recorded entryHash?
    const computed = computeEntryHash(entry.prevHash, entry);
    if (computed !== entry.entryHash) {
      return {
        valid: false,
        entriesCount: entries.length,
        brokenAt: entry.id,
        expectedHash: computed,
        actualHash: entry.entryHash,
        message: `Tamper detected at entry ${entry.id}. Data was modified after hash creation! Expected hash=${computed.slice(0, 16)}..., recorded=${entry.entryHash.slice(0, 16)}...`,
      };
    }

    expectedPrevHash = entry.entryHash;
  }

  return {
    valid: true,
    entriesCount: entries.length,
    message: `All ${entries.length} records verified: unbroken SHA-256 tamper-evident hash chain.`,
  };
}
