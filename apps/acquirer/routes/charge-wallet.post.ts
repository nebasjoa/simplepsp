interface ChargeWalletRequest {
  method: "paypal" | "google_pay";
  amount: number;
  currency: string;
  instrumentLabel?: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ChargeWalletRequest>(event);

  // Dummy wallets never carry card data - deterministic, always approved, no randomness.
  const instrument = body.instrumentLabel ? ` via ${body.instrumentLabel}` : "";
  return {
    outcome: "approved" as const,
    reason: `Dummy ${body.method} payment approved${instrument}`,
  };
});
