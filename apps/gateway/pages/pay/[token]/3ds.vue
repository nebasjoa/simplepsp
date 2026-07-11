<script setup lang="ts">
const route = useRoute();
const token = route.params.token as string;

const { data: payment } = await useFetch(`/api/pay/${token}`);

const formattedAmount = computed(() => {
  if (!payment.value) return "";
  return (payment.value.amount / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});
</script>

<template>
  <div class="pay-page">
    <div v-if="payment" class="pay-card">
      <p class="acs-eyebrow">Simulated card issuer &middot; 3D Secure</p>

      <div class="pay-owner-row">
        <OwnerNote role="Merchant" :name="payment.merchantName" />
        <InfoTip
          text="In a real integration your bank (the card issuer) hosts this challenge page, not the gateway - it's simulated here so the 3DS step is visible end to end."
        />
      </div>

      <h1 class="acs-title">Verify this payment</h1>
      <p class="acs-body">
        Confirm the {{ formattedAmount }} {{ payment.currency }} payment
        <span v-if="payment.cardBrand">on your {{ payment.cardBrand }} card ending in {{ payment.cardLast4 }}</span>
        to continue.
      </p>

      <form method="post" :action="`/pay/${token}/3ds`" class="acs-actions">
        <button type="submit" name="decision" value="approve" class="acs-button acs-button--approve">Approve</button>
        <button type="submit" name="decision" value="decline" class="acs-button acs-button--decline">Decline</button>
      </form>

      <p class="acs-footnote">
        This is a simulated ACS (Access Control Server) page. In a real integration your bank would host this
        step, not the gateway.
      </p>
    </div>
    <div v-else class="pay-card">
      <p class="pay-not-found">Payment not found.</p>
    </div>
  </div>
</template>

<style scoped>
.pay-page {
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

.pay-card {
  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
  background: var(--surface);
  border: 1px solid rgba(18, 20, 28, 0.1);
  border-radius: 14px;
  padding: 2.25rem 2rem 2rem;
}

.acs-eyebrow {
  margin: 0 0 1rem;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(18, 20, 28, 0.4);
}

.pay-owner-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 1.25rem;
}

.acs-title {
  margin: 0 0 0.75rem;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.acs-body {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgba(18, 20, 28, 0.7);
}

.acs-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.75rem;
}

.acs-button {
  flex: 1;
  padding: 0.8rem 1rem;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  border-radius: 8px;
  cursor: pointer;
  transition:
    filter 0.15s ease,
    background-color 0.15s ease,
    border-color 0.15s ease;
}

.acs-button--approve {
  background: var(--accent);
  color: var(--surface);
  border: 1px solid var(--accent);
}

.acs-button--approve:hover {
  filter: brightness(0.92);
}

.acs-button--decline {
  background: transparent;
  color: rgba(18, 20, 28, 0.6);
  border: 1px solid rgba(18, 20, 28, 0.16);
}

.acs-button--decline:hover {
  background: rgba(18, 20, 28, 0.04);
}

.acs-button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.acs-footnote {
  margin: 1.5rem 0 0;
  font-size: 0.78rem;
  line-height: 1.5;
  color: rgba(18, 20, 28, 0.45);
}

.pay-not-found {
  margin: 0;
  color: rgba(18, 20, 28, 0.55);
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .acs-button {
    transition: none;
  }
}
</style>
