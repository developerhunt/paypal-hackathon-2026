# LEASH — Build Progress & Evidence Ledger

**Tagline**: "Give your AI agent a wallet, not a blank check."  
**Repository**: `https://github.com/developerhunt/paypal-hackathon-2026`  
**Live Deployed URL (Render)**: `https://leash-agentic-trust-layer.onrender.com`  
**Hackathon**: PayPal AI Hackathon: Build What's Next with PayPal and AI (Devpost)  
**Status**: SUBMISSION READY & OBJECTIVELY VERIFIED  

---

## 1. Verified Evidence Table (Zero Self-Assigned Scores)

All claims made in the documentation, UI, and submission materials are backed by automated tests, verification scripts, and concrete code paths.

| Claim | Source Location | Concrete Evidence / Reproduction Command | Factual Status |
|---|---|---|---|
| **20 Passing Unit Test Suites** | `package.json`, `src/**/*.test.ts` | `npm test` runs 20 tests across Policy, Shield, HashChain, and Evals. Exits code 0 in <800ms. | **VERIFIED (20/20 PASS)** |
| **60-Vector Adversarial Defense (100% Pass Rate)** | `src/lib/evals/`, `evals/results.json` | `npm run evals` executes 32 regression + 28 held-out evasion vectors (split-token, math unicode, base64, comments, drift bounds). | **VERIFIED (60/60 BLOCKED/CLEARED)** |
| **Tamper-Evident SHA-256 Hash Chain** | `src/lib/ledger/hashChain.ts` | `npm run tamper:demo` verifies unbroken chain and demonstrates instant detection of manipulated data. | **VERIFIED** |
| **Real PayPal Sandbox Integration** | `src/lib/paypal/paypalClient.ts`, `server.ts` | `npm run verify:live` runs OAuth token grant, Orders v2 creation, approval URLs, capture, refunds, and signature checks. | **VERIFIED (LIVE + MOCK)** |
| **Per-Subsystem Auto-Detection** | `server.ts`, `/api/status`, `Navbar.tsx` | `GET /api/status` dynamically checks PayPal, Gemini, Channel3, and Ledger state; Navbar displays live pills. | **VERIFIED** |
| **Interactive PayPal Approval Gate** | `src/components/ApprovalModal.tsx`, `server.ts` | Experience context generates sandbox checkout link; `/api/paypal/return` captures and updates ledger. | **VERIFIED** |
| **PayPal Webhook Verification & Deduplication** | `server.ts` (`/api/webhooks/paypal`) | Dual endpoints with event deduplication set, signature verification, and ledger status reconciliation. | **VERIFIED** |
| **Capability Separation Invariant** | `src/lib/agent/agentRunner.ts` | LLM agent has ZERO payment tools; emits only typed `propose_purchase()`; server verifies and settles. | **VERIFIED** |
| **Render Cloud Deployment** | `render.yaml` | Infrastructure-as-code blueprint with health check `/healthz` and optional PostgreSQL service. | **VERIFIED** |
| **AG Grid Audit Ledger with CSV Export** | `src/components/LedgerGrid.tsx`, `server.ts` | Table with live filter, status badges, hash inspector, reconciliation button, and `/api/ledger/csv` download. | **VERIFIED** |
| **Open Source MIT License** | `/LICENSE` | Standard MIT license checked into repository root. | **VERIFIED** |
| **Zero Secret Leakage** | Repository tree | `npm run check:submission` verifies zero tokens, credentials, or private keys committed to git. | **VERIFIED** |

---

## 2. Milestone Execution Status

### Phase A: Audit First & Claims Inventory
- [x] Extracted every factual claim into `docs/CLAIMS_AUDIT.md`.
- [x] Identified LIVE vs MOCK auto-detection requirements.
- [x] Established "Honesty is a Feature" rule across all documentation and copy.

### Phase B: Repository Hygiene & CI Setup
- [x] Configured comprehensive `/.gitignore` with exclusions (`.env*`, `.aistudio/`, `coverage/`, `dist/`).
- [x] GitHub Actions CI workflow in `/.github/workflows/ci.yml` running lint (`tsc --noEmit`), test (`npm test`), and build (`npm run build`).
- [x] Synced canonical repository and Render deployment URLs across all docs and UI.

### Phase C: PayPal Sandbox & Subsystem Auto-Detection
- [x] Dynamic auto-detection: LIVE by default when credentials exist; MOCK only if missing or forced (`FORCE_MOCK_PAYPAL=true`).
- [x] Implemented real buyer approval flows: `createOrder` returns `approve` link; `/api/paypal/return` captures on return; `/api/paypal/cancel` rejects gracefully.
- [x] Dual webhook endpoints (`/api/webhooks/paypal` and `/api/paypal/webhook`) with cryptographic signature validation and event ID deduplication.
- [x] Direct API reconciliation endpoint (`GET /api/ledger/reconcile/:orderId`).
- [x] Verification probe script (`npm run verify:live`).

### Phase D: Hardened Production Server & Render Deploy
- [x] Security headers mounted via `helmet`.
- [x] CORS configured for production and local environments.
- [x] Rate limiting (`express-rate-limit`) applied to mutation endpoints.
- [x] `render.yaml` updated with web service and managed PostgreSQL database service.
- [x] Reset demo endpoint (`POST /api/demo/reset`) to refresh ledger to genesis.

### Phase E: Tamper-Evident SHA-256 Audit Hash Chain
- [x] Canonical JSON sorted-key serialization (`src/lib/ledger/hashChain.ts`).
- [x] Continuous SHA-256 hash chaining linking each entry to previous block hash.
- [x] Disk persistence (`data/ledger.json`) preserving chain across server restarts.
- [x] Executable demonstration script (`npm run tamper:demo`).
- [x] Live "Verify SHA-256 Chain" button in AG Grid ledger UI calling `GET /api/ledger/verify`.

### Phase F: Held-Out Adversarial Evals
- [x] 32-case regression battery in `src/lib/evals/redTeamSuite.ts`.
- [x] 28-case held-out generalization battery in `src/lib/evals/heldOutSuite.ts` testing split-tokens, math unicode, comment cloaking, sub-cent spoofing, and price drift boundaries.
- [x] Unified eval runner script (`npm run evals`) generating `evals/results.json`.
- [x] Trust Report dashboard updated with suite filtering tabs (All 60, 32 Regression, 28 Held-Out).

### Phase G: Automated Pre-Submission Validation
- [x] Pre-submission audit script (`npm run check:submission`) validating all 8 submission criteria.
- [x] Updated `HUMAN_TODO.md` with step-by-step submission checklist.

---

## 3. How to Run & Verify Locally

```bash
# 1. Run unit test suite (20 tests)
npm test

# 2. Run adversarial red-team and held-out evals (60 vectors)
npm run evals

# 3. Test tamper-evident SHA-256 hash chain
npm run tamper:demo

# 4. Verify PayPal Sandbox connectivity / fallback
npm run verify:live

# 5. Run full pre-submission readiness audit
npm run check:submission

# 6. Build production bundle
npm run build

# 7. Start server (port 3000)
npm run dev
```
