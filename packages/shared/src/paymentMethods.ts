export type PaymentMethod = "card" | "paypal" | "google_pay";

export interface PaymentMethodCatalogEntry {
  id: PaymentMethod;
  label: string;
  dummy: boolean;
}

/** Fixed catalog for now - card is real (routed through the mock acquirer's test-card table),
 * PayPal and Google Pay are simulated one-click wallets with no real integration. */
export const PAYMENT_METHOD_CATALOG: PaymentMethodCatalogEntry[] = [
  { id: "card", label: "Credit card", dummy: false },
  { id: "paypal", label: "PayPal", dummy: true },
  { id: "google_pay", label: "Google Pay", dummy: true },
];
