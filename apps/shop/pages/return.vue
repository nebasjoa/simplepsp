<script setup lang="ts">
const route = useRoute();
const paymentId = route.query.paymentId as string;

const { data: payment } = await useFetch("/api/payment-status", {
  query: { paymentId },
});

const SUCCESS_STATUSES = new Set(["authorized", "captured", "refunded", "partially_refunded"]);
const isSuccess = computed(() => !!payment.value && SUCCESS_STATUSES.has(payment.value.status));

const formattedAmount = computed(() => {
  if (!payment.value) return "";
  return (payment.value.amount / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});
</script>

<template>
  <div class="shop-page">
    <div v-if="payment" class="receipt">
      <span class="status-chip" :class="{ 'status-chip--success': isSuccess }">{{ payment.status }}</span>
      <p class="receipt-amount">{{ formattedAmount }}<span class="receipt-currency">{{ payment.currency }}</span></p>
      <p class="receipt-reference">Ref {{ payment.reference }}</p>

      <p class="receipt-note">
        <InfoTip text="This reflects the shop's own record, reconciled from the signed webhook - not just the browser redirect, which can be lost if the tab closes or the network drops." />
        Confirmed by the gateway's signed webhook, not just this page load.
      </p>

      <NuxtLink to="/" class="back-link">&larr; Back to shop</NuxtLink>
    </div>
    <div v-else class="receipt">
      <p class="not-found">Payment not found.</p>
      <NuxtLink to="/" class="back-link">&larr; Back to shop</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.shop-page {
  --bg: #eef0f4;
  --surface: #ffffff;
  --ink: #12141c;
  --accent: #3355ff;
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

  min-height: 100vh;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1.25rem;
  background: var(--bg);
  font-family: var(--font);
  color: var(--ink);
}

.receipt {
  width: 100%;
  max-width: 380px;
  box-sizing: border-box;
  background: var(--surface);
  border: 1px solid rgba(18, 20, 28, 0.1);
  border-radius: 14px;
  padding: 2.25rem 2rem;
  text-align: center;
}

.status-chip {
  display: inline-block;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: rgba(18, 20, 28, 0.55);
  background: rgba(18, 20, 28, 0.07);
}

.status-chip--success {
  color: var(--accent);
  background: rgba(51, 85, 255, 0.1);
}

.receipt-amount {
  margin: 1.1rem 0 0;
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.receipt-currency {
  margin-left: 0.4rem;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(18, 20, 28, 0.45);
}

.receipt-reference {
  margin: 0.35rem 0 0;
  font-size: 0.85rem;
  color: rgba(18, 20, 28, 0.5);
}

.receipt-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 1.5rem 0 0;
  font-size: 0.78rem;
  line-height: 1.4;
  color: rgba(18, 20, 28, 0.45);
}

.not-found {
  margin: 0 0 1.25rem;
  color: rgba(18, 20, 28, 0.6);
}

.back-link {
  display: inline-block;
  margin-top: 1.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}
</style>
