export type TestCardOutcome = "approved" | "declined" | "error" | "requires_3ds";

export interface TestCardResult {
  outcome: TestCardOutcome;
  reason: string;
}

function normalize(cardNumber: string): string {
  return cardNumber.replace(/\s+/g, "");
}

const TEST_CARDS: Record<string, TestCardResult> = {
  "4242424242424242": { outcome: "approved", reason: "Approved" },
  "4000000000000002": { outcome: "declined", reason: "Your card was declined." },
  "4000000000009995": { outcome: "declined", reason: "Your card has insufficient funds." },
  "4000000000000069": { outcome: "declined", reason: "Your card has expired." },
  "4000000000000119": { outcome: "error", reason: "An error occurred while processing your card." },
  "4000000000003220": { outcome: "requires_3ds", reason: "This card requires 3D Secure authentication." },
};

/** Deterministic, like Stripe's test card suite -- no randomness, demos must be reproducible. */
export function lookupTestCard(cardNumber: string): TestCardResult {
  const n = normalize(cardNumber);
  return TEST_CARDS[n] ?? { outcome: "declined", reason: "Unrecognized test card number." };
}

export function detectBrand(cardNumber: string): string {
  const n = normalize(cardNumber);
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^6(?:011|5)/.test(n)) return "discover";
  return "unknown";
}

export function last4(cardNumber: string): string {
  return normalize(cardNumber).slice(-4);
}

const CATALOG_LABELS: Record<string, string> = {
  "4242424242424242": "Visa — approved",
  "4000000000000002": "Visa — declined (generic)",
  "4000000000009995": "Visa — declined (insufficient funds)",
  "4000000000000069": "Visa — declined (expired card)",
  "4000000000000119": "Visa — processing error",
  "4000000000003220": "Visa — requires 3DS",
};

export interface TestCardCatalogEntry extends TestCardResult {
  number: string;
  label: string;
}

/** Same catalog as TEST_CARDS, with display labels — for demo UIs that let a user pick a test card. */
export const TEST_CARD_CATALOG: TestCardCatalogEntry[] = Object.entries(TEST_CARDS).map(([number, result]) => ({
  number,
  label: CATALOG_LABELS[number] ?? number,
  ...result,
}));
