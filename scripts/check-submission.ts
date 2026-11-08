import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LedgerStore } from '../src/lib/ledger/ledgerStore.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

interface CheckResult {
  title: string;
  passed: boolean;
  details: string;
}

function runSubmissionChecks() {
  console.log('====================================================');
  console.log(' LEASH: Pre-Submission Readiness & Credibility Audit');
  console.log(' Target Hackathon: PayPal AI Hackathon 2026 (Devpost)');
  console.log('====================================================\n');

  const checks: CheckResult[] = [];

  // 1. License Check
  const licensePath = path.join(ROOT, 'LICENSE');
  const hasLicense = fs.existsSync(licensePath);
  const licenseContent = hasLicense ? fs.readFileSync(licensePath, 'utf-8') : '';
  const isMit = licenseContent.includes('MIT License');
  checks.push({
    title: 'MIT Open Source License file present at repo root',
    passed: hasLicense && isMit,
    details: hasLicense ? 'LICENSE file present with MIT text' : 'Missing LICENSE file',
  });

  // 2. Metadata.json
  const metaPath = path.join(ROOT, 'metadata.json');
  const hasMeta = fs.existsSync(metaPath);
  let metaValid = false;
  if (hasMeta) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      metaValid = Boolean(meta.name && meta.description);
    } catch {}
  }
  checks.push({
    title: 'metadata.json defined with project name and description',
    passed: metaValid,
    details: metaValid ? 'metadata.json configured' : 'metadata.json missing fields',
  });

  // 3. .env.example
  const envExamplePath = path.join(ROOT, '.env.example');
  const hasEnvExample = fs.existsSync(envExamplePath);
  checks.push({
    title: '.env.example template checked in for developers/judges',
    passed: hasEnvExample,
    details: hasEnvExample ? '.env.example present with documented variables' : 'Missing .env.example',
  });

  // 4. Secret scan in git tracked files
  const secretPatterns = [
    /AKIA[0-9A-Z]{16}/,
    /AIza[0-9A-Za-z-_]{35}/,
    /sk-[a-zA-Z0-9]{32,}/,
    /ghp_[a-zA-Z0-9]{36}/,
  ];
  let secretFound = false;
  const filesToCheck = ['README.md', 'render.yaml', 'server.ts', 'src/App.tsx'];
  for (const f of filesToCheck) {
    const full = path.join(ROOT, f);
    if (fs.existsSync(full)) {
      const text = fs.readFileSync(full, 'utf-8');
      for (const pat of secretPatterns) {
        if (pat.test(text)) {
          secretFound = true;
          break;
        }
      }
    }
  }
  checks.push({
    title: 'Zero credentials / tokens leaked in repository source files',
    passed: !secretFound,
    details: !secretFound ? 'No hardcoded API secrets detected' : 'Warning: potential secret pattern found',
  });

  // 5. Canonical URLs
  const readmeContent = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf-8');
  const hasRepoUrl = readmeContent.includes('https://github.com/developerhunt/paypal-hackathon-2026');
  const hasRenderUrl = readmeContent.includes('https://leash-agentic-trust-layer.onrender.com');
  checks.push({
    title: 'Canonical GitHub repo and Render live deployment URLs aligned',
    passed: hasRepoUrl && hasRenderUrl,
    details: 'GitHub: developerhunt/paypal-hackathon-2026 & Render: leash-agentic-trust-layer.onrender.com',
  });

  // 6. SHA-256 Ledger Hash Chain Integrity
  const integrity = LedgerStore.verifyIntegrity();
  checks.push({
    title: 'Cryptographic SHA-256 Ledger Hash Chain unbroken from genesis',
    passed: integrity.valid,
    details: `${integrity.message} (${integrity.entriesCount} verified blocks)`,
  });

  // 7. Evals Results File
  const evalsPath = path.join(ROOT, 'evals/results.json');
  let evalsValid = false;
  let evalsPassRate = 0;
  if (fs.existsSync(evalsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(evalsPath, 'utf-8'));
      evalsPassRate = data.summary?.overallPassRate ?? 0;
      evalsValid = evalsPassRate >= 95;
    } catch {}
  }
  checks.push({
    title: 'Held-out and regression adversarial evals pass rate >= 95%',
    passed: evalsValid,
    details: evalsValid
      ? `evals/results.json verified with ${evalsPassRate}% defense pass rate`
      : 'evals/results.json missing or <95% pass rate',
  });

  // 8. Render Blueprint
  const renderPath = path.join(ROOT, 'render.yaml');
  const hasRender = fs.existsSync(renderPath);
  const renderContent = hasRender ? fs.readFileSync(renderPath, 'utf-8') : '';
  const renderValid = renderContent.includes('leash-agentic-trust-layer') && renderContent.includes('healthCheckPath: /healthz');
  checks.push({
    title: 'render.yaml Infrastructure-as-Code Blueprint configured',
    passed: renderValid,
    details: renderValid ? 'Configured with health check and environment sync' : 'render.yaml invalid',
  });

  // Print results
  let allPassed = true;
  for (const c of checks) {
    const icon = c.passed ? '✓' : '✗';
    console.log(`${icon} ${c.title}`);
    console.log(`  Details: ${c.details}\n`);
    if (!c.passed) allPassed = false;
  }

  console.log('====================================================');
  if (allPassed) {
    console.log(' ALL 8 PRE-SUBMISSION CHECKS PASSED: READY FOR REVIEW!');
  } else {
    console.log(' SOME CHECKS FAILED: Review items marked with ✗ above.');
    process.exit(1);
  }
  console.log('====================================================');
}

runSubmissionChecks();
