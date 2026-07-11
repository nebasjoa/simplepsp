interface SettleItem {
  paymentId: string;
  amount: number;
  currency: string;
}

interface SettleRequest {
  items: SettleItem[];
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SettleRequest>(event);

  // Settlement operates on amounts already authorized/captured - no card data
  // involved, and no randomness: every item clears deterministically.
  const results = body.items.map((item) => ({
    paymentId: item.paymentId,
    outcome: "settled" as const,
    reason: null,
  }));

  return { results };
});
