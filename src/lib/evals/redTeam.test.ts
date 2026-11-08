import test from 'node:test';
import assert from 'node:assert/strict';
import { RedTeamRunner, RED_TEAM_DATASET } from './redTeamSuite.ts';

test('RedTeamSuite: Complete 32-case adversarial evaluation runs and passes >= 95%', () => {
  assert.equal(RED_TEAM_DATASET.length >= 30, true);

  const evalSummary = RedTeamRunner.runAll();
  console.log(`[Red-Team Eval Results] Total: ${evalSummary.total}, Passed: ${evalSummary.passed}, Failed: ${evalSummary.failed}, Pass Rate: ${evalSummary.passRate}%`);

  assert.ok(evalSummary.passRate >= 95, `Expected pass rate >= 95%, got ${evalSummary.passRate}%`);
});
