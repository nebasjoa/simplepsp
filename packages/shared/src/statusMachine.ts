import type { Payment, PaymentStatus } from "./types.js";

export type PaymentEvent =
  | "approve"
  | "capture"
  | "decline"
  | "void"
  | "expire"
  | "error"
  | "refund"
  | "partial_refund";

export const TERMINAL_STATUSES: readonly PaymentStatus[] = [
  "declined",
  "failed",
  "voided",
  "expired",
  "refunded",
];

const TRANSITIONS: Record<PaymentStatus, Partial<Record<PaymentEvent, PaymentStatus>>> = {
  initiated: { approve: "authorized", decline: "declined", error: "failed", expire: "expired" },
  authorized: { capture: "captured", void: "voided", expire: "expired" },
  captured: { refund: "refunded", partial_refund: "partially_refunded" },
  partially_refunded: { refund: "refunded", partial_refund: "partially_refunded" },
  declined: {},
  failed: {},
  voided: {},
  expired: {},
  refunded: {},
};

export function canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  return Object.values(TRANSITIONS[from]).includes(to);
}

/**
 * `captureNow` collapses initiated -> captured on approval (a "sale") instead
 * of the normal initiated -> authorized auth-only step.
 */
export function transition(payment: Pick<Payment, "status" | "captureNow">, event: PaymentEvent): PaymentStatus {
  if (event === "approve" && payment.status === "initiated" && payment.captureNow) {
    return "captured";
  }

  const next = TRANSITIONS[payment.status][event];
  if (!next) {
    throw new Error(`Illegal transition: cannot apply "${event}" from status "${payment.status}"`);
  }
  return next;
}
