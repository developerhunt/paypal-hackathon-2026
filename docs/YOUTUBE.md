# YouTube Video Metadata

## Title
Leash: Give Your AI Agent a Wallet, Not a Blank Check | PayPal AI Hackathon 2026

## Description
Submission for the PayPal AI Hackathon: Build What's Next with PayPal and AI (Devpost).

Live Demo: https://leash-agentic-trust-layer.onrender.com
GitHub Repository: https://github.com/developerhunt/paypal-hackathon-2026

Core Principle: "AI proposes. Deterministic policy disposes. Human approves. PayPal settles. The ledger remembers."

Autonomous AI shopping agents can search and purchase goods, but giving an LLM direct access to credit cards or payment APIs exposes users to prompt injection, runaway spending, and financial loss.

Leash creates a zero-trust capability separation layer between the AI agent and PayPal:
- The AI agent has ZERO payment tools; it can only emit a typed purchase intention.
- Multi-layer Prompt Injection Shield normalizes zero-width unicode and quarantines adversarial listings.
- Pure deterministic policy engine evaluates 12 financial and security invariants (budget, per-item cap, price drift, velocity, seller reputation).
- Human-in-the-loop authorization gate for orders exceeding autonomous thresholds.
- PayPal Orders v2 integration with idempotency, instant capture, and refund capabilities.
- AG Grid audit ledger with CSV export and "Ask Leash" natural language spend intelligence.

Timestamps:
0:00 - The Problem: Why Agents Can't Be Trusted With Blank Checks
0:18 - Core Architecture: AI Proposes, Deterministic Policy Disposes
0:48 - Scenario A: Autonomous Under-$100 Purchase & PayPal Sandbox Capture
1:18 - Scenario B: Human Authorization Gate for High-Value Purchases
1:45 - Scenario D: Neutralizing a Poisoned Listing Prompt Injection Attack
2:05 - Scenario C: Deterministic Policy BLOCK for Budget Overrun
2:25 - AG Grid Audit Ledger & "Ask Leash" Spend Intelligence
2:35 - Summary & Impact

Built with:
- PayPal Developer Platform (Orders v2, Payments Capture/Refund, Webhooks)
- Google Gemini 2.5 Flash (@google/genai)
- React 19, TypeScript, Express, Vite, Tailwind CSS, AG Grid

#PayPal #AI #AgenticCommerce #Fintech #Gemini #Hackathon #Devpost #CyberSecurity
