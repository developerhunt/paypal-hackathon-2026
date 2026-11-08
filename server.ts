import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { MandateCompiler } from './src/lib/mandate/compiler.ts';
import { AgentRunner } from './src/lib/agent/agentRunner.ts';
import { LedgerStore } from './src/lib/ledger/ledgerStore.ts';
import { AskLeashService } from './src/lib/agent/askLeash.ts';
import { RedTeamRunner } from './src/lib/evals/redTeamSuite.ts';
import { Channel3Client } from './src/lib/channel3/channel3Client.ts';
import { PayPalClient } from './src/lib/paypal/paypalClient.ts';
import { MissionRunProgress } from './src/types/ledger.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

const mandateCompiler = new MandateCompiler();
const agentRunner = new AgentRunner();
const askLeashService = new AskLeashService();
const channel3Client = new Channel3Client();
const paypalClient = new PayPalClient();

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
app.post('/api/mandate/compile', async (req: Request, res: Response) => {
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
app.post('/api/agent/run', async (req: Request, res: Response) => {
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
app.post('/api/ask-leash', async (req: Request, res: Response) => {
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

// Red Team Adversarial Evals Runner
app.get('/api/evals/run', (req: Request, res: Response) => {
  try {
    const report = RedTeamRunner.runAll();
    res.json(report);
  } catch (err: unknown) {
    console.error('RedTeam run error:', err);
    res.status(500).json({ error: 'Failed to run evals' });
  }
});

// Catalog items endpoint
app.get('/api/catalog', (req: Request, res: Response) => {
  res.json({
    items: channel3Client.getCatalog(),
  });
});

// PayPal Webhook Handler with Signature Verification
app.post('/api/paypal/webhook', async (req: Request, res: Response) => {
  try {
    const authAlgo = req.headers['paypal-auth-algo'] as string;
    const certUrl = req.headers['paypal-cert-url'] as string;
    const transmissionId = req.headers['paypal-transmission-id'] as string;
    const transmissionSig = req.headers['paypal-transmission-sig'] as string;
    const transmissionTime = req.headers['paypal-transmission-time'] as string;
    const webhookEvent = req.body;

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

    console.log(`[PayPal Webhook] Event: ${webhookEvent.event_type}`, webhookEvent.summary);

    // Update ledger if event matches capture or refund
    if (webhookEvent.event_type === 'PAYMENT.CAPTURE.REFUNDED') {
      const captureId = webhookEvent.resource?.id;
      const entries = LedgerStore.getEntries();
      const match = entries.find((e) => e.paypalCaptureId === captureId);
      if (match) {
        LedgerStore.updateEntry(match.id, { status: 'REFUNDED' });
      }
    }

    res.status(200).json({ received: true });
  } catch (err: unknown) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

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
