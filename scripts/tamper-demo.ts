import {
  computeEntryHash,
  verifyChain,
  GENESIS_HASH,
} from '../src/lib/ledger/hashChain.ts';

console.log('======================================================================');
console.log('LEASH — Tamper-Evident Hash-Chain Demonstration');
console.log('======================================================================\n');

// 1. Build an authentic 3-entry chain
console.log('[1] Constructing authentic 3-block transaction ledger...');

const block1 = {
  id: 'LSH-2026-0001',
  timestamp: '2026-11-08T10:00:00Z',
  totalAmount: 89.99,
  status: 'CAPTURED',
  productTitle: 'SoundMaster Pro ANC Headphones',
  prevHash: GENESIS_HASH,
  entryHash: '',
};
block1.entryHash = computeEntryHash(GENESIS_HASH, block1);

const block2 = {
  id: 'LSH-2026-0002',
  timestamp: '2026-11-08T10:05:00Z',
  totalAmount: 49.99,
  status: 'SHIELD_BLOCKED',
  productTitle: 'Poisoned Clearance Audio',
  prevHash: block1.entryHash,
  entryHash: '',
};
block2.entryHash = computeEntryHash(block1.entryHash, block2);

const block3 = {
  id: 'LSH-2026-0003',
  timestamp: '2026-11-08T10:10:00Z',
  totalAmount: 139.00,
  status: 'CAPTURED',
  productTitle: 'Keychron Q1 Pro Mechanical Keyboard',
  prevHash: block2.entryHash,
  entryHash: '',
};
block3.entryHash = computeEntryHash(block2.entryHash, block3);

const chain = [block1, block2, block3];

console.log(`Block 1 [${block1.id}]: Hash = ${block1.entryHash.slice(0, 16)}...`);
console.log(`Block 2 [${block2.id}]: Prev = ${block2.prevHash.slice(0, 16)}... -> Hash = ${block2.entryHash.slice(0, 16)}...`);
console.log(`Block 3 [${block3.id}]: Prev = ${block3.prevHash.slice(0, 16)}... -> Hash = ${block3.entryHash.slice(0, 16)}...`);

const initialCheck = verifyChain(chain);
console.log(`\nInitial Chain Verification Result: VALID = ${initialCheck.valid}`);
console.log(`Message: ${initialCheck.message}\n`);

// 2. Simulate Attacker Tampering with Block 1
console.log('[2] Simulating adversary altering historical database row...');
console.log('Adversary changes Block 1 totalAmount from $89.99 to $9.99 to hide spending:');

const tamperedChain = JSON.parse(JSON.stringify(chain));
tamperedChain[0].totalAmount = 9.99; // Malicious mutation!

console.log(`Mutated Block 1 amount: $${tamperedChain[0].totalAmount}`);

// 3. Re-verify chain
console.log('\n[3] Running verifyChain() over altered ledger...');
const tamperedCheck = verifyChain(tamperedChain);

console.log(`Chain Verification Result: VALID = ${tamperedCheck.valid}`);
console.log(`Broken At Entry: ${tamperedCheck.brokenAt}`);
console.log(`Details: ${tamperedCheck.message}`);

if (!tamperedCheck.valid && tamperedCheck.brokenAt === 'LSH-2026-0001') {
  console.log('\nSUCCESS: Tamper-evident hash chain detected the fraud immediately at the exact record!');
} else {
  console.error('\nFAILURE: Tampering went undetected!');
  process.exit(1);
}
