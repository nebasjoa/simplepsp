import type { PaymentEvent } from "@simplepsp/shared";

export interface ChargeResult {
  outcome: "approved" | "declined" | "error" | "requires_3ds";
  reason: string;
  brand: string;
  last4: string;
}

const EVENT_BY_OUTCOME: Record<ChargeResult["outcome"], PaymentEvent> = {
  approved: "approve",
  declined: "decline",
  error: "error",
  requires_3ds: "error",
};

export function eventForOutcome(outcome: ChargeResult["outcome"]): PaymentEvent {
  return EVENT_BY_OUTCOME[outcome];
}

export async function chargeCard(
  acquirerUrl: string,
  card: { number: string; amount: number; currency: string },
): Promise<ChargeResult> {
  return await $fetch<ChargeResult>(`${acquirerUrl}/charge`, {
    method: "POST",
    body: { cardNumber: card.number, amount: card.amount, currency: card.currency },
  });
}
