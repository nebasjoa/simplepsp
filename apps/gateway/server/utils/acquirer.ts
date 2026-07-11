import type { PaymentEvent } from "@simplepsp/shared";
import { formatBody, logLine } from "./logger";

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
  paymentId: string,
): Promise<ChargeResult> {
  const body = { cardNumber: card.number, amount: card.amount, currency: card.currency };
  const startedAt = Date.now();
  await logLine(`ACQUIRER OUT      paymentId=${paymentId} -> POST ${acquirerUrl}/charge body=${formatBody(body)}`);

  try {
    const result = await $fetch<ChargeResult>(`${acquirerUrl}/charge`, { method: "POST", body });
    await logLine(
      `ACQUIRER IN       paymentId=${paymentId} <- ${Date.now() - startedAt}ms body=${formatBody(result)}`,
    );
    return result;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await logLine(
      `ACQUIRER FAILED   paymentId=${paymentId} <- ${Date.now() - startedAt}ms error=${reason}`,
    );
    throw err;
  }
}

export interface WalletChargeResult {
  outcome: "approved";
  reason: string;
}

export async function chargeWallet(
  acquirerUrl: string,
  method: "paypal" | "google_pay",
  amount: number,
  currency: string,
  paymentId: string,
): Promise<WalletChargeResult> {
  const body = { method, amount, currency };
  const startedAt = Date.now();
  await logLine(
    `ACQUIRER OUT      paymentId=${paymentId} -> POST ${acquirerUrl}/charge-wallet body=${formatBody(body)}`,
  );

  try {
    const result = await $fetch<WalletChargeResult>(`${acquirerUrl}/charge-wallet`, { method: "POST", body });
    await logLine(
      `ACQUIRER IN       paymentId=${paymentId} <- ${Date.now() - startedAt}ms body=${formatBody(result)}`,
    );
    return result;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await logLine(
      `ACQUIRER FAILED   paymentId=${paymentId} <- ${Date.now() - startedAt}ms error=${reason}`,
    );
    throw err;
  }
}

export interface SettleItem {
  paymentId: string;
  amount: number;
  currency: string;
}

export interface SettleResult {
  paymentId: string;
  outcome: "settled" | "failed";
  reason: string | null;
}

export async function settleBatch(acquirerUrl: string, items: SettleItem[]): Promise<SettleResult[]> {
  const body = { items };
  const startedAt = Date.now();
  await logLine(`SETTLE   OUT       count=${items.length} -> POST ${acquirerUrl}/settle body=${formatBody(body)}`);

  try {
    const result = await $fetch<{ results: SettleResult[] }>(`${acquirerUrl}/settle`, { method: "POST", body });
    await logLine(
      `SETTLE   IN        count=${items.length} <- ${Date.now() - startedAt}ms body=${formatBody(result)}`,
    );
    return result.results;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await logLine(
      `SETTLE   FAILED    count=${items.length} <- ${Date.now() - startedAt}ms error=${reason}`,
    );
    throw err;
  }
}
