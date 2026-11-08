# LEASH — Comprehensive Claims & Evidence Audit

**Audit Date:** 2026-11-08  
**Audit Scope:** `README.md`, `docs/*.md`, `PROGRESS.md`, `HUMAN_TODO.md`, `src/**/*`, `server.ts`  
**Standard:** Every claim must be supported by an verifiable test, a working endpoint, or a provable UI state. Unproven or simulated claims must be either fixed to work live or downgraded in copy.

---

## 1. Claims Audit Matrix

| # | Claim | Where Claimed | Claimed State vs Code Reality | Evidence (File / Test / Command) | Verdict | Action Required |
|---|---|---|---|---|---|---|
| 1 | "16 tests passing" | `README.md` badge | Currently matches `npm test` (16 test suites), but badge was static markdown text. | `npm test` | **UNVERIFIABLE (STATIC BADGE)** | Replace static badge with GitHub Actions CI badge + dynamic evals output. |
| 2 | "100% defense pass rate (32/32)" | `README.md`, `docs/EVALS.md`, `PROGRESS.md`, UI | The 32 tests pass against `redTeamSuite.ts`, but this was authored by the same builder without a held-out benchmark. | `src/lib/evals/redTeamSuite.ts` | **PARTIAL / WEAK EVIDENCE** | Keep 32 cases as "regression suite"; add 25+ held-out adversarial cases; generate `evals/results.json` via `npm run evals`. |
| 3 | "Cryptographic audit trail" / "Immutable ledger" | `README.md`, `docs/ARCHITECTURE.md`, UI | The ledger was an in-memory JavaScript array (`LedgerStore.entries`). It reset on server restart and had no cryptographic hash chain. | `src/lib/ledger/ledgerStore.ts` | **FALSE** | Implement SHA-256 hash-chaining (`prev_hash`, `entry_hash`), file/Postgres persistence, `GET /api/ledger/verify`, and soften copy to "tamper-evident, hash-chained audit log". |
| 4 | "PayPal Sandbox settlement" | `README.md`, UI | `paypalClient.ts` implemented Orders v2 REST endpoints, but the live UI flow in Scenario B used a client-side simulated sign-off rather than real PayPal sandbox buyer redirection/capture. | `src/lib/paypal/paypalClient.ts`, `src/App.tsx` | **PARTIAL (SIMULATED APPROVAL)** | Implement real PayPal buyer approval link flow via PayPal Experience Context, redirecting to `sandbox.paypal.com/checkoutnow` and capturing upon return. |
| 5 | "Webhook signature verification" | `README.md`, `docs/ARCHITECTURE.md` | `verifyWebhookSignature` was implemented, but lacked persistent event idempotency, signature validation error logging, and reconciliation fallback. | `server.ts`, `src/lib/paypal/paypalClient.ts` | **PARTIAL** | Wire `POST /api/webhooks/paypal`, persist webhook events, add reconciliation polling fallback and UI status badge. |
| 6 | "Live Gemini" | `README.md`, `PROGRESS.md` | `GoogleGenAI` was initialized if `GEMINI_API_KEY` existed, but the app relied on a global `MOCK_MODE=true` env var which hid whether Gemini was live or falling back. | `src/lib/mandate/compiler.ts`, `src/lib/agent/askLeash.ts` | **PARTIAL** | Implement per-subsystem auto-detection: Gemini runs live automatically when `GEMINI_API_KEY` is present. |
| 7 | "Live Channel3 discovery" | `README.md`, UI | `Channel3Client.search` had an HTTP fetch branch, but defaulted to mock fixtures due to global `MOCK_MODE`. | `src/lib/channel3/channel3Client.ts` | **PARTIAL** | Add per-subsystem detection. Label fixtures visibly as "cached fixture" when `CHANNEL3_API_KEY` is unset. |
| 8 | "12 deterministic policy rules" | `README.md`, `docs/ARCHITECTURE.md`, UI | 12 rules (budget, per-item cap, price floor, quantity, currency, categories, merchants, merchant rating, drift, velocity, duplicate idempotency, approval threshold) are verified in unit tests. | `src/lib/policy/policyEngine.test.ts` | **VERIFIED** | Keep as core invariant; maintain 100% test coverage. |
| 9 | "AI has ZERO payment tools (Capability Separation)" | `README.md`, `docs/SECURITY.md` | The agent runtime emits only `{ productId, offerId, quantity }`. PayPal API calls are exclusively initiated server-side by the policy engine/approval route. | `src/lib/agent/agentRunner.ts`, `server.ts` | **VERIFIED** | Keep as foundational architectural pillar. |
| 10 | "Self-assigned 10/10 scores" | `PROGRESS.md` | Subjective scores without external validation. | `PROGRESS.md` | **UNVERIFIABLE / OVERCLAIM** | Remove "10/10" self-scores; replace with factual claims vs evidence verification table. |
| 11 | "Deployed on Render" | `render.yaml` | `render.yaml` existed, but did not have database connection, helmet security headers, or rate-limiting for public access. | `render.yaml` | **PARTIAL** | Upgrade `render.yaml` with Postgres service wiring, `DATABASE_URL`, and production server hardening. |
| 12 | "AG Grid Enterprise features" | Prompts / Guidelines | Verified: only AG Grid community features are used; no watermark or enterprise license warnings. | `src/components/LedgerGrid.tsx` | **VERIFIED** | Keep Community only. |

---

## 2. Subsystem Live vs. Mock Status (Baseline)

| Subsystem | Baseline State | Target State | Transition Plan |
|---|---|---|---|
| **PayPal** | MOCK (`MOCK_MODE=true`) | Auto-detect: LIVE if `PAYPAL_CLIENT_ID` exists, MOCK only if forced or missing. | Update `paypalClient.ts`, add real buyer approval flow, add `scripts/verify-live.ts`. |
| **Gemini AI** | MOCK / Fallback | Auto-detect: LIVE if `GEMINI_API_KEY` exists, fallback clearly labeled in UI. | Update `compiler.ts` and `askLeash.ts`, add live/mock indicators. |
| **Channel3** | MOCK / Fixture | Auto-detect: LIVE if `CHANNEL3_API_KEY` exists, fixture labeled with "cached fixture". | Update `channel3Client.ts` with API schema validation. |
| **Ledger Persistence** | In-Memory Array | PERSISTENT (JSON file / SQLite / Postgres) with hash chain. | Implement `PersistentLedgerStore` with SHA-256 chaining and verification endpoint. |
| **Human Approval** | Client Modal Simulated | Real Two-Step Flow: (1) Leash Policy Sign-off -> (2) PayPal Sandbox Redirect/Popup -> Capture. | Implement PayPal approval link generation and capture callback. |

---

## 3. Action Roadmap
- **Phase B:** Clean `.aistudio` from git, configure `.gitignore`, add GitHub Actions CI (`.github/workflows/ci.yml`), check secrets.
- **Phase C & D:** Add `GET /api/status`, header status bar, real PayPal approval flow, webhook verification endpoint, Render Blueprint with database wiring and security middleware.
- **Phase E:** Implement hash-chained tamper-evident ledger persistence and `GET /api/ledger/verify`.
- **Phase F:** Add held-out 25+ adversarial evals, generate `evals/results.json`, update Trust Report.
- **Phase G & H:** Submission gate script (`scripts/check-submission.ts`), update `DEVPOST.md`, `VIDEO_SCRIPT.md`, `PROGRESS.md`.
