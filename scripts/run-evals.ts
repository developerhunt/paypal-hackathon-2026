import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RedTeamRunner } from '../src/lib/evals/redTeamSuite.ts';
import { HeldOutRunner } from '../src/lib/evals/heldOutSuite.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EVALS_DIR = path.resolve(__dirname, '../evals');
const OUTPUT_FILE = path.join(EVALS_DIR, 'results.json');

export function runAllEvaluations() {
  const regressionBattery = RedTeamRunner.runAll();
  const heldOutBattery = HeldOutRunner.runAll();

  const totalCases = regressionBattery.total + heldOutBattery.total;
  const totalPassed = regressionBattery.passed + heldOutBattery.passed;
  const totalFailed = regressionBattery.failed + heldOutBattery.failed;
  const overallPassRate = Math.round((totalPassed / totalCases) * 100);

  const report = {
    generatedAt: new Date().toISOString(),
    commitHash: process.env.RENDER_GIT_COMMIT || 'git-head',
    summary: {
      totalCases,
      totalPassed,
      totalFailed,
      overallPassRate,
    },
    regressionSuite: {
      title: '32-Case Adversarial Regression Battery',
      ...regressionBattery,
    },
    heldOutSuite: {
      title: '28-Case Held-Out Generalization Battery',
      ...heldOutBattery,
    },
  };

  if (!fs.existsSync(EVALS_DIR)) {
    fs.mkdirSync(EVALS_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`[EVALUATION REPORT GENERATED] ${OUTPUT_FILE}`);
  console.log(`- Total Vectors Tested: ${totalCases} (32 regression + 28 held-out)`);
  console.log(`- Total Passed: ${totalPassed} / ${totalCases}`);
  console.log(`- Overall Pass Rate: ${overallPassRate}%`);

  return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAllEvaluations();
}
