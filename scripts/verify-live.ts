import dotenv from 'dotenv';
import { PayPalClient } from '../src/lib/paypal/paypalClient.ts';

dotenv.config();

async function runLiveVerification() {
  console.log('====================================================');
  console.log(' LEASH: PayPal Sandbox Live Verification Script');
  console.log('====================================================\n');

  const client = new PayPalClient();

  console.log(`[Configuration] Mode: ${client.modeDescription}`);
  console.log(`[Configuration] Base URL: ${client.baseUrl}`);

  if (client.isMock) {
    console.log('\n[NOTICE] Currently running in MOCK mode because PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET are unset or placeholder.');
    console.log('[ACTION FOR LIVE SANDBOX] Set your PayPal Developer Sandbox credentials in your environment or .env:');
    console.log('  PAYPAL_CLIENT_ID=your_sandbox_client_id');
    console.log('  PAYPAL_CLIENT_SECRET=your_sandbox_client_secret');
    console.log('  PAYPAL_WEBHOOK_ID=your_sandbox_webhook_id (optional)\n');
    console.log('Testing Mock Fallback Lifecycle:');

    const token = await client.getAccessToken();
    console.log(`  ✓ Access Token: ${token}`);

    const order = await client.createOrder(
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: 'USD', value: '49.99' },
            description: 'Verification Test Order',
          },
        ],
      },
      `verify-${Date.now()}`
    );
    console.log(`  ✓ Created Order ID: ${order.id}`);
    const approvalLink = order.links.find((l) => l.rel === 'approve')?.href;
    console.log(`  ✓ Approval URL: ${approvalLink}`);

    const capture = await client.captureOrder(order.id);
    console.log(`  ✓ Captured ID: ${capture.id} (Status: ${capture.status})`);

    console.log('\n✓ Mock fallback sandbox workflow verified successfully.');
    return;
  }

  // Live Sandbox Verification
  try {
    console.log('\n1. Requesting Sandbox OAuth 2.0 Access Token via client_credentials...');
    const token = await client.getAccessToken();
    console.log(`   ✓ Token Acquired: ${token.slice(0, 15)}...${token.slice(-6)}`);

    console.log('\n2. Creating Orders v2 intent CAPTURE in PayPal Sandbox...');
    const idempotencyKey = `live-verify-${Date.now()}`;
    const order = await client.createOrder(
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: `ref-${Date.now()}`,
            custom_id: `custom-verify-${Date.now()}`,
            description: 'Leash Sandbox Live Verification Probe',
            amount: {
              currency_code: 'USD',
              value: '10.00',
            },
          },
        ],
      },
      idempotencyKey
    );
    console.log(`   ✓ Sandbox Order ID: ${order.id}`);
    console.log(`   ✓ Status: ${order.status}`);
    const approvalLink = order.links.find((l) => l.rel === 'approve')?.href;
    console.log(`   ✓ Live Sandbox Buyer Approval Link:\n     ${approvalLink}`);

    console.log('\n3. Retrieving Order Details from PayPal Orders v2 API...');
    const details = await client.getOrderDetails(order.id);
    console.log(`   ✓ Verified Order Status: ${details.status}`);

    console.log('\n====================================================');
    console.log(' ✓ LIVE PAYPAL SANDBOX CONNECTIVITY VERIFIED INTACT!');
    console.log('====================================================');
  } catch (err) {
    console.error('\n✗ Live verification encountered error:', err);
    process.exit(1);
  }
}

runLiveVerification();
