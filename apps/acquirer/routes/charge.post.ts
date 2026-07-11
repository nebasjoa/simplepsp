import { detectBrand, last4, lookupTestCard } from "@simplepsp/shared";

interface ChargeRequest {
  cardNumber: string;
  amount: number;
  currency: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ChargeRequest>(event);
  const result = lookupTestCard(body.cardNumber);

  return {
    outcome: result.outcome,
    reason: result.reason,
    brand: detectBrand(body.cardNumber),
    last4: last4(body.cardNumber),
  };
});
