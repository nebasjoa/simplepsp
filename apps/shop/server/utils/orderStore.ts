import type { PaymentStatus } from "@simplepsp/shared";

export interface OrderRecord {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  reference: string;
  cardBrand?: string | null;
  cardLast4?: string | null;
  updatedAt: string;
}

/** In-memory only - the shop has no database in this demo, the point is the reconciliation flow itself. */
const orders = new Map<string, OrderRecord>();

export function recordOrderUpdate(record: OrderRecord) {
  orders.set(record.id, record);
}

export function getOrder(paymentId: string): OrderRecord | undefined {
  return orders.get(paymentId);
}
