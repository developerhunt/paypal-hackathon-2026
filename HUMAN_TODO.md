# HUMAN TODO Checklist — Submission & Live Setup

This document outlines the exact steps required from the repository owner/submitter for the PayPal AI Hackathon. Everything in the codebase has been structured so judges can run and verify the complete application out-of-the-box in seeded sandbox mode or connect directly to live PayPal Sandbox credentials.

---

## 1. PayPal Developer Credentials (Sandbox)
- [ ] Log in to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).
- [ ] Under **Apps & Credentials**, create a new App under **Sandbox**:
  - Name: `Leash-Agentic-Commerce`
  - Sandbox Business Account: Select default or create a new test merchant account.
- [ ] Copy `Client ID` and `Secret` into `.env` (or Render Environment Variables):
  - `PAYPAL_CLIENT_ID="<your_client_id>"`
  - `PAYPAL_CLIENT_SECRET="<your_client_secret>"`
  - `PAYPAL_ENVIRONMENT="sandbox"`
- [ ] Under **Sandbox > Accounts**, note down a Personal Buyer test account:
  - Email: e.g. `sb-buyerXXXXX@personal.example.com`
  - Password: test password for completing simulated buyer approvals.
- [ ] (Optional) In the PayPal Dashboard, register a Webhook pointing to:
  - `https://<your-deployed-domain>/api/paypal/webhook`
  - Select events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.REFUNDED`, `PAYMENT.CAPTURE.DENIED`, `CHECKOUT.ORDER.APPROVED`.
  - Copy the generated `Webhook ID` to `PAYPAL_WEBHOOK_ID`.

---

## 2. Gemini AI & Channel3 API Keys
- [ ] **Google AI Studio (Gemini)**:
  - Generate an API key from [Google AI Studio](https://aistudio.google.com/).
  - Set `GEMINI_API_KEY="<your-gemini-key>"`.
  - Preferred model: `gemini-2.5-flash` (or `gemini-1.5-flash`).
- [ ] **Channel3 Product Catalog API**:
  - Sign up at [Channel3.ai](https://channel3.ai) for commerce product discovery.
  - Set `CHANNEL3_API_KEY="<your-channel3-key>"`.
  - *Note: If left empty, Leash's deterministic commerce catalog engine provides realistic multi-category product fixtures automatically.*

---

## 3. GitHub Repository Setup
- [ ] Connect or push to GitHub repository: `https://github.com/developerhunt/paypal-hackathon-2026`
- [ ] Ensure the **MIT License** displays in the GitHub repository "About" panel on the right sidebar.
- [ ] Verify that `.env` is NOT committed (only `.env.example`).

---

## 4. Cloud Deployment (Render)
- [ ] Sign up or log into [Render](https://render.com).
- [ ] Click **New > Blueprint** and link your GitHub repository.
- [ ] Render will read `render.yaml` and configure:
  - Node.js Web Service on port 3000
  - Health check endpoint: `/healthz`
  - Environment variables: configure `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `GEMINI_API_KEY`, etc.
- [ ] Deploy and verify the live URL.
- [ ] **Warm-up Reminder**: If using Render free-tier, visit the URL 10 minutes prior to submission and judging review to prevent cold starts.

---

## 5. Demo Video Recording & YouTube Upload
- [ ] Follow the timed script in `docs/VIDEO_SCRIPT.md` (Total target length: ~2 minutes 30 seconds; max 3:00).
- [ ] Record high-resolution screen capture without copyrighted music or non-free assets.
- [ ] Walk through Scenarios A through E using the `/demo` scenario triggers and `/judge` tour:
  1. Plain-English mission compilation to visual Mandate card.
  2. Noise-cancelling headphones auto-buy under $100 with PayPal capture and live ledger update.
  3. High-ticket item triggering the Human Approval Gate with reasoning and risk breakdown.
  4. Out-of-policy violation triggering deterministic policy BLOCK.
  5. Poisoned product listing prompt injection blocked by the security shield.
  6. Instant PayPal refund and "Ask Leash" spend intelligence query.
- [ ] Upload to YouTube with visibility set to **Public** or **Unlisted**.
- [ ] Copy the title and description from `docs/YOUTUBE.md`.

---

## 6. Devpost Submission
- [ ] Open the [PayPal AI Hackathon Devpost submission form](https://paypal.devpost.com).
- [ ] Copy and paste the structured fields directly from `docs/DEVPOST.md`.
- [ ] Include:
  - Live deployed Demo URL
  - Public GitHub repository URL
  - YouTube video link
  - List of PayPal developer tools used (`Orders v2`, `Payments Capture/Refund`, `Webhooks`, `Agent Toolkit`)
  - List of AI models used (`Google Gemini 2.5 Flash`)
- [ ] Submit before the cutoff date (target: submit at least 10 hours prior to deadline).
- [ ] Open the submitted Devpost in a private/incognito browser window to verify all links and embeds function correctly.
