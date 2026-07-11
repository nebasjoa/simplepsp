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

export interface DummyWalletInstrument {
  id: string;
  label: string;
}

/** The fake "choose how to pay" list shown inside the dummy PayPal/Google Pay popup -
 * picking one never changes the outcome, it's purely to sell the illusion of a real wallet UI. */
export const DUMMY_WALLET_INSTRUMENTS: Record<"paypal" | "google_pay", DummyWalletInstrument[]> = {
  paypal: [
    { id: "paypal_balance", label: "PayPal balance" },
    { id: "visa_4242", label: "Visa •••• 4242" },
    { id: "mastercard_5555", label: "Mastercard •••• 5555" },
  ],
  google_pay: [
    { id: "visa_4242", label: "Visa •••• 4242" },
    { id: "mastercard_5555", label: "Mastercard •••• 5555" },
  ],
};
