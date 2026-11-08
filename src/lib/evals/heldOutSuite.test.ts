import test from 'node:test';
import assert from 'node:assert';
import { HeldOutRunner } from './heldOutSuite.ts';

test('HeldOutSuite: Complete 28-case held-out adversarial evaluation runs and passes >= 95%', () => {
  const report = HeldOutRunner.runAll();
  console.log(`[Held-Out Eval Results] Total: ${report.total}, Passed: ${report.passed}, Failed: ${report.failed}, Pass Rate: ${report.passRate}%`);
  
  if (report.failed > 0) {
    const failures = report.results.filter((r) => !r.passed);
    console.error('Failed Held-Out Cases:', failures);
  }

  assert.strictEqual(report.total, 28, 'Should run all 28 held-out adversarial test cases');
  assert.ok(report.passRate >= 95, `Expected >= 95% defense pass rate, got ${report.passRate}%`);
});
