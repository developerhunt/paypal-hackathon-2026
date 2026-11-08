import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalJson,
  computeEntryHash,
  verifyChain,
  GENESIS_HASH,
} from './hashChain.ts';

test('HashChain: Canonical JSON serializes deterministic sorted keys', () => {
  const objA = { b: 2, a: 1, c: { z: 9, y: 8 } };
  const objB = { a: 1, c: { y: 8, z: 9 }, b: 2 };

  assert.equal(canonicalJson(objA), canonicalJson(objB));
});

test('HashChain: Verifies unbroken chain from genesis', () => {
  const entry1Data = { id: 'LSH-001', amount: 89.99, status: 'CAPTURED', timestamp: '2026-11-08T00:00:00Z' };
  const entry1Hash = computeEntryHash(GENESIS_HASH, entry1Data);
  const entry1 = { ...entry1Data, prevHash: GENESIS_HASH, entryHash: entry1Hash };

  const entry2Data = { id: 'LSH-002', amount: 139.0, status: 'NEEDS_APPROVAL', timestamp: '2026-11-08T00:01:00Z' };
  const entry2Hash = computeEntryHash(entry1.entryHash, entry2Data);
  const entry2 = { ...entry2Data, prevHash: entry1.entryHash, entryHash: entry2Hash };

  const chain = [entry1, entry2];
  const result = verifyChain(chain);

  assert.equal(result.valid, true);
  assert.equal(result.entriesCount, 2);
});

test('HashChain: Tamper detection flags modified data at exact entry', () => {
  const entry1Data = { id: 'LSH-001', amount: 89.99, status: 'CAPTURED' };
  const entry1Hash = computeEntryHash(GENESIS_HASH, entry1Data);
  const entry1 = { ...entry1Data, prevHash: GENESIS_HASH, entryHash: entry1Hash };

  const entry2Data = { id: 'LSH-002', amount: 139.0, status: 'NEEDS_APPROVAL' };
  const entry2Hash = computeEntryHash(entry1.entryHash, entry2Data);
  const entry2 = { ...entry2Data, prevHash: entry1.entryHash, entryHash: entry2Hash };

  // Attacker tampers with entry 1 amount from 89.99 to 9.99
  const tamperedChain = [
    { ...entry1, amount: 9.99 },
    entry2,
  ];

  const result = verifyChain(tamperedChain);
  assert.equal(result.valid, false);
  assert.equal(result.brokenAt, 'LSH-001');
  assert.ok(result.message.includes('Tamper detected'));
});
