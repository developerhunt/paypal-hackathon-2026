export interface PayPalAmount {
  currency_code: string;
  value: string; // e.g. "94.50"
}

export interface PayPalItem {
  name: string;
  quantity: string;
  unit_amount: PayPalAmount;
  description?: string;
  sku?: string;
  category?: 'DIGITAL_GOODS' | 'PHYSICAL_GOODS' | 'DONATION';
}

export interface PayPalPurchaseUnit {
  reference_id?: string;
  custom_id?: string; // Maps to our Leash Ledger Entry ID
  description?: string;
  amount: {
    currency_code: string;
    value: string;
    breakdown?: {
      item_total?: PayPalAmount;
      shipping?: PayPalAmount;
      tax_total?: PayPalAmount;
    };
  };
  items?: PayPalItem[];
  payee?: {
    email_address?: string;
    merchant_id?: string;
  };
}

export interface PayPalCreateOrderRequest {
  intent: 'CAPTURE' | 'AUTHORIZE';
  purchase_units: PayPalPurchaseUnit[];
  application_context?: {
    brand_name?: string;
    locale?: string;
    landing_page?: 'LOGIN' | 'BILLING' | 'NO_PREFERENCE';
    user_action?: 'CONTINUE' | 'PAY_NOW';
    return_url?: string;
    cancel_url?: string;
  };
}

export interface PayPalOrderResponse {
  id: string; // PayPal Order ID (e.g. 5O190127TN364715T)
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
  intent: string;
  create_time: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PayPalCaptureResponse {
  id: string; // PayPal Capture ID
  status: 'COMPLETED' | 'DECLINED' | 'PARTIALLY_REFUNDED' | 'PENDING' | 'REFUNDED';
  amount: PayPalAmount;
  final_capture?: boolean;
  create_time: string;
  update_time: string;
}

export interface PayPalRefundResponse {
  id: string; // Refund ID
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  amount: PayPalAmount;
  create_time: string;
  note_to_payer?: string;
}

export interface PayPalWebhookEvent {
  id: string;
  event_version: string;
  create_time: string;
  resource_type: string;
  event_type: string;
  summary: string;
  resource: Record<string, unknown>;
}
