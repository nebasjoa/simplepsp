export type PaymentStatus =
  | "initiated"
  | "authorized"
  | "captured"
  | "declined"
  | "failed"
  | "voided"
  | "expired"
  | "partially_refunded"
  | "refunded";

export interface Merchant {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  active: boolean;
  apiKey: string;
  secret: string;
  webhookUrl: string | null;
  createdAt: Date;
}

export interface Operator {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  merchantId: string;
  amount: number;
  currency: string;
  reference: string;
  status: PaymentStatus;
  captureNow: boolean;
  cardBrand: string | null;
  cardLast4: string | null;
  hostedToken: string | null;
  idempotencyKey: string | null;
  returnUrl: string;
  webhookUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  status: string;
  createdAt: Date;
}

export interface WebhookDelivery {
  id: string;
  paymentId: string;
  eventType: string;
  status: "pending" | "delivered" | "failed";
  attempts: number;
  createdAt: Date;
}

export interface CardInput {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
}

export interface CreatePaymentInput {
  amount: number;
  currency: string;
  reference: string;
  captureNow: boolean;
  returnUrl: string;
  webhookUrl: string;
  card?: CardInput;
}

export interface WebhookPayload {
  event: string;
  paymentId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  reference: string;
}
