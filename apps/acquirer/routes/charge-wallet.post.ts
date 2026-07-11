interface ChargeWalletRequest {
  method: "paypal" | "google_pay";
  amount: number;
  currency: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ChargeWalletRequest>(event);

  // Dummy wallets never carry card data - deterministic, always approved, no randomness.
  return {
    outcome: "approved" as const,
    reason: `Dummy ${body.method} payment approved`,
  };
});
