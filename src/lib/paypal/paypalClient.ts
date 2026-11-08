import {
  PayPalCreateOrderRequest,
  PayPalOrderResponse,
  PayPalCaptureResponse,
  PayPalRefundResponse,
  PayPalWebhookEvent,
} from '../../types/paypal.ts';

export interface PayPalConfig {
  clientId?: string;
  clientSecret?: string;
  environment?: 'sandbox' | 'production';
  webhookId?: string;
  isMockMode?: boolean;
}

export class PayPalClient {
  private clientId: string;
  private clientSecret: string;
  private environment: 'sandbox' | 'production';
  private webhookId: string;
  private isMockMode: boolean;
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor(config: PayPalConfig = {}) {
    this.clientId = config.clientId || process.env.PAYPAL_CLIENT_ID || '';
    this.clientSecret = config.clientSecret || process.env.PAYPAL_CLIENT_SECRET || '';
    this.environment = config.environment || (process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';
    this.webhookId = config.webhookId || process.env.PAYPAL_WEBHOOK_ID || '';
    
    // Automatically use mock fallback if credentials are empty or MOCK_MODE is enabled
    this.isMockMode =
      config.isMockMode ??
      (process.env.MOCK_MODE === 'true' || !this.clientId || !this.clientSecret);
  }

  private get baseUrl(): string {
    return this.environment === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  public get isMock(): boolean {
    return this.isMockMode;
  }

  /**
   * Fetches OAuth 2.0 access token using client_credentials grant.
   */
  private async getAccessToken(): Promise<string> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }

    if (this.isMockMode) {
      return 'MOCK_SANDBOX_ACCESS_TOKEN_LSH';
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`PayPal OAuth token failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    this.tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return data.access_token;
  }

  /**
   * Creates an order with intent CAPTURE, custom_id, and PayPal-Request-Id idempotency header.
   */
  public async createOrder(
    request: PayPalCreateOrderRequest,
    idempotencyKey: string
  ): Promise<PayPalOrderResponse> {
    if (this.isMockMode) {
      const mockId = `5O${Math.floor(10000000000000 + Math.random() * 90000000000000)}`;
      return {
        id: mockId,
        status: 'CREATED',
        intent: request.intent,
        create_time: new Date().toISOString(),
        links: [
          {
            href: `https://www.sandbox.paypal.com/checkoutnow?token=${mockId}`,
            rel: 'approve',
            method: 'GET',
          },
          {
            href: `${this.baseUrl}/v2/checkout/orders/${mockId}/capture`,
            rel: 'capture',
            method: 'POST',
          },
        ],
      };
    }

    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': idempotencyKey,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`PayPal Create Order error (${response.status}): ${err}`);
    }

    return (await response.json()) as PayPalOrderResponse;
  }

  /**
   * Retrieves order status from PayPal Orders v2.
   */
  public async getOrderDetails(orderId: string): Promise<PayPalOrderResponse> {
    if (this.isMockMode) {
      return {
        id: orderId,
        status: 'APPROVED',
        intent: 'CAPTURE',
        create_time: new Date().toISOString(),
        links: [],
      };
    }

    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`PayPal Get Order error (${response.status}): ${err}`);
    }

    return (await response.json()) as PayPalOrderResponse;
  }

  /**
   * Captures an approved PayPal order.
   */
  public async captureOrder(
    orderId: string,
    idempotencyKey?: string
  ): Promise<PayPalCaptureResponse> {
    if (this.isMockMode) {
      return {
        id: `CAP-${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: 'COMPLETED',
        amount: {
          currency_code: 'USD',
          value: '89.99',
        },
        final_capture: true,
        create_time: new Date().toISOString(),
        update_time: new Date().toISOString(),
      };
    }

    const token = await this.getAccessToken();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    if (idempotencyKey) {
      headers['PayPal-Request-Id'] = idempotencyKey;
    }

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`PayPal Capture Order error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const captureUnit = data.purchase_units?.[0]?.payments?.captures?.[0];
    return {
      id: captureUnit?.id || data.id,
      status: captureUnit?.status || 'COMPLETED',
      amount: captureUnit?.amount || { currency_code: 'USD', value: '0.00' },
      final_capture: true,
      create_time: captureUnit?.create_time || new Date().toISOString(),
      update_time: captureUnit?.update_time || new Date().toISOString(),
    };
  }

  /**
   * Initiates a refund for a captured payment.
   */
  public async refundCapture(
    captureId: string,
    amount?: { value: string; currency_code: string },
    noteToPayer?: string,
    idempotencyKey?: string
  ): Promise<PayPalRefundResponse> {
    if (this.isMockMode) {
      return {
        id: `REF-${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: 'COMPLETED',
        amount: amount || { currency_code: 'USD', value: '89.99' },
        create_time: new Date().toISOString(),
        note_to_payer: noteToPayer || 'Refund processed by Leash Agentic Trust Layer',
      };
    }

    const token = await this.getAccessToken();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    if (idempotencyKey) {
      headers['PayPal-Request-Id'] = idempotencyKey;
    }

    const body: Record<string, unknown> = {};
    if (amount) body.amount = amount;
    if (noteToPayer) body.note_to_payer = noteToPayer;

    const response = await fetch(`${this.baseUrl}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`PayPal Refund error (${response.status}): ${err}`);
    }

    return (await response.json()) as PayPalRefundResponse;
  }

  /**
   * Verifies incoming webhook signature against PayPal's verification endpoint.
   */
  public async verifyWebhookSignature(params: {
    authAlgo: string;
    certUrl: string;
    transmissionId: string;
    transmissionSig: string;
    transmissionTime: string;
    webhookEvent: PayPalWebhookEvent;
  }): Promise<boolean> {
    if (this.isMockMode) {
      return true;
    }

    const token = await this.getAccessToken();
    const payload = {
      auth_algo: params.authAlgo,
      cert_url: params.certUrl,
      transmission_id: params.transmissionId,
      transmission_sig: params.transmissionSig,
      transmission_time: params.transmissionTime,
      webhook_id: this.webhookId,
      webhook_event: params.webhookEvent,
    };

    const response = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return false;
    const data = await response.json();
    return data.verification_status === 'SUCCESS';
  }
}
