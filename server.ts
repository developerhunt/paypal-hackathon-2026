import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { MandateCompiler } from './src/lib/mandate/compiler.ts';
import { AgentRunner } from './src/lib/agent/agentRunner.ts';
import { LedgerStore } from './src/lib/ledger/ledgerStore.ts';
import { AskLeashService } from './src/lib/agent/askLeash.ts';
import { RedTeamRunner } from './src/lib/evals/redTeamSuite.ts';
import { HeldOutRunner } from './src/lib/evals/heldOutSuite.ts';
import { Channel3Client } from './src/lib/channel3/channel3Client.ts';
import { PayPalClient } from './src/lib/paypal/paypalClient.ts';
import { MissionRunProgress } from './src/types/ledger.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Production Security Hardening
app.use(
  helmet({
    contentSecurityPolicy: false, // Let Vite handle SPA dev scripts, styles, and font loaders
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors());
app.use(express.json());

// Rate limiter for mutating API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Please retry in a few minutes.' },
});

const mandateCompiler = new MandateCompiler();
const agentRunner = new AgentRunner();
const askLeashService = new AskLeashService();
const channel3Client = new Channel3Client();
const paypalClient = new PayPalClient();

// In-memory set for deduplicating incoming PayPal webhook events
const processedWebhookEventIds = new Set<string>();

// Subsystem Status Endpoint (Auto-detection of Live vs Mock for every dependency)
app.get('/api/status', (req: Request, res: Response) => {
  const chainIntegrity = LedgerStore.verifyIntegrity();
  res.json({
    paypal: {
      mode: paypalClient.isMock ? 'MOCK' : 'LIVE_SANDBOX',
      environment: 'sandbox',
      description: paypalClient.modeDescription,
    },
    gemini: {
      mode: mandateCompiler.isLive ? 'LIVE' : 'MOCK',
      model: mandateCompiler.model,
    },
    channel3: {
      mode: channel3Client.isMock ? 'MOCK_FIXTURE' : 'LIVE',
      description: channel3Client.modeDescription,
    },
    ledger: {
      mode: 'PERSISTENT',
      storage: 'json_file',
      chainValid: chainIntegrity.valid,
      entriesCount: LedgerStore.getEntries().length,
    },
    build: {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      service: 'leash-agentic-trust-layer',
    },
  });
});

// Health Check Endpoint (Render & Uptime monitors)
app.get('/healthz', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'leash-agentic-trust-layer',
    mockMode: paypalClient.isMock,
  });
});

// Compile Mission into Structured Mandate
app.post('/api/mandate/compile', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { prompt, overrides } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Mission prompt is required' });
    }
    const result = await mandateCompiler.compile(prompt, overrides);
    res.json(result);
  } catch (err: unknown) {
    console.error('Error compiling mandate:', err);
    res.status(500).json({ error: 'Failed to compile mandate' });
  }
});

// Run Shopping Mission with Server-Sent Events (SSE) or JSON
app.post('/api/agent/run', apiLimiter, async (req: Request, res: Response) => {
  const { missionId = `m-${Date.now()}`, prompt, mandate, scenarioKey, stream = false } = req.body;

  if (!prompt || !mandate) {
    return res.status(400).json({ error: 'Prompt and mandate are required' });
  }

  if (stream) {
    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const onProgress = (progress: MissionRunProgress) => {
      res.write(`data: ${JSON.stringify(progress)}\n\n`);
    };

    try {
      const finalResult = await agentRunner.executeMission({
        missionId,
        prompt,
        mandate,
        scenarioKey,
        onProgress,
      });
      res.write(`data: ${JSON.stringify({ ...finalResult, done: true })}\n\n`);
      res.end();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  } else {
    try {
      const result = await agentRunner.executeMission({
        missionId,
        prompt,
        mandate,
        scenarioKey,
      });
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }
});

// Authorize pending human approval
app.post('/api/agent/approve', async (req: Request, res: Response) => {
  try {
    const { ledgerId, approvedBy = 'Human Reviewer' } = req.body;
    if (!ledgerId) {
      return res.status(400).json({ error: 'ledgerId is required' });
    }
    const updated = await agentRunner.authorizePendingApproval(ledgerId, approvedBy);
    if (!updated) {
      return res.status(404).json({ error: 'Pending entry not found or already settled' });
    }
    res.json({ success: true, entry: updated });
  } catch (err: unknown) {
    console.error('Approval authorization error:', err);
    res.status(500).json({ error: 'Failed to authorize order' });
  }
});

// Reject pending human approval
app.post('/api/agent/reject', (req: Request, res: Response) => {
  try {
    const { ledgerId, reason = 'Disapproved by human' } = req.body;
    if (!ledgerId) {
      return res.status(400).json({ error: 'ledgerId is required' });
    }
    const updated = agentRunner.rejectPendingApproval(ledgerId, reason);
    if (!updated) {
      return res.status(404).json({ error: 'Pending entry not found' });
    }
    res.json({ success: true, entry: updated });
  } catch (err: unknown) {
    console.error('Rejection error:', err);
    res.status(500).json({ error: 'Failed to reject order' });
  }
});

// Process a PayPal Refund
app.post('/api/ledger/refund', async (req: Request, res: Response) => {
  try {
    const { ledgerId, reason = 'Item defective or customer requested return' } = req.body;
    if (!ledgerId) {
      return res.status(400).json({ error: 'ledgerId is required' });
    }
    const updated = await agentRunner.processRefund(ledgerId, reason);
    if (!updated) {
      return res.status(404).json({ error: 'Captured entry not found or not eligible for refund' });
    }
    res.json({ success: true, entry: updated });
  } catch (err: unknown) {
    console.error('Refund processing error:', err);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Audit Ledger API
app.get('/api/ledger', (req: Request, res: Response) => {
  res.json({
    entries: LedgerStore.getEntries(),
    stats: LedgerStore.getStats(),
  });
});

app.get('/api/ledger/stats', (req: Request, res: Response) => {
  res.json(LedgerStore.getStats());
});

app.get('/api/ledger/csv', (req: Request, res: Response) => {
  const csv = LedgerStore.exportCsv();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="leash-audit-ledger.csv"');
  res.send(csv);
});

// Ask Leash Spend Intelligence API
app.post('/api/ask-leash', apiLimiter, async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    const response = await askLeashService.query(question);
    res.json(response);
  } catch (err: unknown) {
    console.error('AskLeash error:', err);
    res.status(500).json({ error: 'Failed to answer question' });
  }
});

// Red Team Adversarial & Held-Out Evals Runner (60 Total Vectors)
app.get('/api/evals/run', (req: Request, res: Response) => {
  try {
    const regressionReport = RedTeamRunner.runAll();
    const heldOutReport = HeldOutRunner.runAll();

    const combinedResults = [
      ...regressionReport.results.map((r) => ({ ...r, suite: 'REGRESSION' })),
      ...heldOutReport.results.map((r) => ({ ...r, suite: 'HELD_OUT' })),
    ];

    const total = combinedResults.length;
    const passed = combinedResults.filter((r) => r.passed).length;
    const failed = total - passed;
    const passRate = Math.round((passed / total) * 100);

    res.json({
      total,
      passed,
      failed,
      passRate,
      results: combinedResults,
      regressionSuite: regressionReport,
      heldOutSuite: heldOutReport,
    });
  } catch (err: unknown) {
    console.error('Eval run error:', err);
    res.status(500).json({ error: 'Failed to run evals' });
  }
});

// Catalog items endpoint
app.get('/api/catalog', (req: Request, res: Response) => {
  res.json({
    items: channel3Client.getCatalog(),
  });
});

// Cryptographic SHA-256 Ledger Verification
app.get('/api/ledger/verify', (req: Request, res: Response) => {
  const result = LedgerStore.verifyIntegrity();
  res.json(result);
});

// API-based Order Reconciliation (Fallback / Fast Reconcile)
app.get('/api/ledger/reconcile/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const details = await paypalClient.getOrderDetails(orderId);
    const updated = LedgerStore.markReconciledViaApi(orderId);
    res.json({ success: true, details, entry: updated });
  } catch (err: unknown) {
    console.error('Reconciliation error:', err);
    res.status(500).json({ error: 'Reconciliation failed' });
  }
});

// Demo Data Reset Endpoint (resets persistent file to clean genesis state)
app.post('/api/demo/reset', (req: Request, res: Response) => {
  try {
    const DATA_DIR = path.resolve(__dirname, 'data');
    const LEDGER_FILE = path.join(DATA_DIR, 'ledger.json');
    if (fs.existsSync(LEDGER_FILE)) {
      fs.unlinkSync(LEDGER_FILE);
    }
    // Re-trigger seed initialization
    (LedgerStore as unknown as { isInitialized: boolean }).isInitialized = false;
    const entries = LedgerStore.getEntries();
    res.json({ success: true, message: 'Ledger reset to clean genesis state.', count: entries.length });
  } catch (err: unknown) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Failed to reset demo ledger' });
  }
});

// PayPal Sandbox Return URL after Buyer Approval
app.get('/api/paypal/return', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string; // PayPal Order ID in checkout redirect
    if (!token) {
      return res.redirect('/?paypal_error=missing_token');
    }

    // Capture the approved order via Orders v2
    const captureResult = await paypalClient.captureOrder(token);

    // Find and update matching ledger entry
    const entries = LedgerStore.getEntries();
    const match = entries.find((e) => e.paypalOrderId === token);
    if (match) {
      LedgerStore.updateEntry(match.id, {
        status: 'CAPTURED',
        paypalCaptureId: captureResult.id,
        humanApproval: {
          approvedAt: new Date().toISOString(),
          approvedBy: 'Buyer (PayPal Sandbox Checkout)',
          notes: 'Authorized via interactive PayPal Sandbox checkout session',
        },
      });
      return res.redirect(`/?paypal_settled=true&orderId=${token}&ledgerId=${match.id}`);
    }

    res.redirect(`/?paypal_settled=true&orderId=${token}`);
  } catch (err: unknown) {
    console.error('PayPal return capture error:', err);
    res.redirect('/?paypal_error=capture_failed');
  }
});

// PayPal Sandbox Cancel URL if Buyer Cancels in Checkout
app.get('/api/paypal/cancel', (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (token) {
    const entries = LedgerStore.getEntries();
    const match = entries.find((e) => e.paypalOrderId === token);
    if (match) {
      LedgerStore.updateEntry(match.id, {
        status: 'REJECTED',
        humanApproval: {
          approvedAt: new Date().toISOString(),
          approvedBy: 'Buyer (PayPal Sandbox)',
          notes: 'Cancelled checkout session on PayPal',
        },
      });
    }
  }
  res.redirect('/?paypal_cancelled=true');
});

// Unified Webhook Handler with Signature Verification and Event Deduplication
const handleWebhookEvent = async (req: Request, res: Response) => {
  try {
    const authAlgo = (req.headers['paypal-auth-algo'] as string) || '';
    const certUrl = (req.headers['paypal-cert-url'] as string) || '';
    const transmissionId = (req.headers['paypal-transmission-id'] as string) || '';
    const transmissionSig = (req.headers['paypal-transmission-sig'] as string) || '';
    const transmissionTime = (req.headers['paypal-transmission-time'] as string) || '';
    const webhookEvent = req.body;

    const eventId = webhookEvent?.id || transmissionId;
    if (eventId && processedWebhookEventIds.has(eventId)) {
      return res.status(200).json({ received: true, deduplicated: true });
    }

    const isValid = await paypalClient.verifyWebhookSignature({
      authAlgo,
      certUrl,
      transmissionId,
      transmissionSig,
      transmissionTime,
      webhookEvent,
    });

    if (!isValid) {
      console.warn('Invalid PayPal webhook signature received');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    if (eventId) {
      processedWebhookEventIds.add(eventId);
    }

    const eventType = webhookEvent.event_type;
    console.log(`[PayPal Webhook] Validated event: ${eventType} (${eventId})`);

    // 1. PAYMENT.CAPTURE.COMPLETED: mark settled entry as confirmedByWebhook
    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const captureId = webhookEvent.resource?.id;
      if (captureId) {
        LedgerStore.confirmWebhook(captureId, eventId);
      }
    }
    // 2. PAYMENT.CAPTURE.REFUNDED: update entry status to REFUNDED
    else if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
      const captureId =
        webhookEvent.resource?.links?.find((l: { rel: string; href: string }) => l.rel === 'up')?.href?.split('/').pop() ||
        webhookEvent.resource?.id;
      const entries = LedgerStore.getEntries();
      const match = entries.find(
        (e) => e.paypalCaptureId === captureId || e.paypalRefundId === webhookEvent.resource?.id
      );
      if (match) {
        LedgerStore.updateEntry(match.id, {
          status: 'REFUNDED',
          confirmedByWebhook: true,
          webhookEventId: eventId,
        });
      }
    }
    // 3. CHECKOUT.ORDER.APPROVED: record approval confirmation
    else if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      const orderId = webhookEvent.resource?.id;
      const entries = LedgerStore.getEntries();
      const match = entries.find((e) => e.paypalOrderId === orderId);
      if (match) {
        LedgerStore.updateEntry(match.id, {
          confirmedByWebhook: true,
          webhookEventId: eventId,
        });
      }
    }

    res.status(200).json({ received: true, verified: true, eventId });
  } catch (err: unknown) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

app.post('/api/webhooks/paypal', handleWebhookEvent);
app.post('/api/paypal/webhook', handleWebhookEvent);

// Mount Vite or serve static dist
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production' || fs.existsSync(path.resolve(__dirname, 'dist'));

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Leash Agentic Trust Server running at http://localhost:${port}`);
  });
}

startServer();
