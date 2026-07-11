<script setup lang="ts">
import { TEST_CARD_CATALOG } from "@simplepsp/shared";

const config = useRuntimeConfig();
const loading = ref(false);
const paymentMode = ref<"hosted" | "direct">("hosted");
const selectedCard = ref(TEST_CARD_CATALOG[0]!.number);

const payLabel = computed(() => {
  if (loading.value) return paymentMode.value === "hosted" ? "Redirecting..." : "Processing...";
  return "Pay 10.99 EUR";
});

async function pay() {
  loading.value = true;
  try {
    if (paymentMode.value === "hosted") {
      const result = await $fetch<{ redirectUrl: string }>("/api/checkout", {
        method: "POST",
        body: { mode: "hosted" },
      });
      window.location.href = result.redirectUrl;
      return;
    }
    const result = await $fetch<{ id: string }>("/api/checkout", {
      method: "POST",
      body: { mode: "direct", cardNumber: selectedCard.value },
    });
    window.location.href = `/return?paymentId=${result.id}`;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="shop-page">
    <div class="checkout">
      <section class="summary">
        <div class="brand">
          <span class="brand-dot" aria-hidden="true" />
          <span>Demo Shop</span>
        </div>
        <OwnerNote role="Storefront merchant" :name="config.public.gatewayApiKey" />

        <div class="order-item">
          <span class="order-thumb" aria-hidden="true">W</span>
          <div class="order-item-copy">
            <p class="order-item-name">Widget</p>
            <p class="order-item-meta">Qty 1 &middot; digital demo item</p>
          </div>
          <p class="order-item-price">10.99 EUR</p>
        </div>

        <div class="order-total">
          <span>Total</span>
          <span>10.99 EUR</span>
        </div>
      </section>

      <section class="payment-panel">
        <h1 class="payment-heading">Pay with</h1>

        <label class="method-card" :class="{ 'method-card--active': paymentMode === 'hosted' }">
          <input v-model="paymentMode" type="radio" value="hosted" class="method-radio" />
          <span class="method-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 4h6v6" />
              <path d="M10 14 20 4" />
              <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
            </svg>
          </span>
          <span class="method-copy">
            <span class="method-title">
              Hosted checkout
              <InfoTip text="This is the pattern real gateways steer merchants toward - card data is entered on the gateway's own page and never reaches this shop's server." />
            </span>
            <span class="method-desc">You'll enter your card on the gateway's secure page.</span>
          </span>
        </label>

        <label class="method-card" :class="{ 'method-card--active': paymentMode === 'direct' }">
          <input v-model="paymentMode" type="radio" value="direct" class="method-radio" />
          <span class="method-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="7" rx="1.5" />
              <rect x="3" y="13" width="18" height="7" rx="1.5" />
              <circle cx="7" cy="7.5" r="0.6" fill="currentColor" stroke="none" />
              <circle cx="7" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span class="method-copy">
            <span class="method-title">
              Direct checkout
              <InfoTip text="The card number is sent from this shop's own server straight to the gateway API. That's the strictest PCI scope (SAQ D) for a merchant - fine here since no real cards exist, but real gateways steer merchants toward hosted instead." />
            </span>
            <span class="method-desc">This shop's server collects your card and sends it to the gateway.</span>

            <span v-if="paymentMode === 'direct'" class="test-card-picker" @click.stop>
              <span class="test-card-label">
                Test card
                <InfoTip text="Test card numbers deterministically map to an outcome (approved, declined, error, or a 3DS challenge) - see packages/shared/testCards for the full table." />
              </span>
              <select v-model="selectedCard" class="test-card-select">
                <option v-for="c in TEST_CARD_CATALOG" :key="c.number" :value="c.number">{{ c.label }}</option>
              </select>
            </span>
          </span>
        </label>

        <button :disabled="loading" class="pay-button" @click="pay">{{ payLabel }}</button>
      </section>
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
  padding: 3rem 1.25rem;
  background: var(--bg);
  font-family: var(--font);
  color: var(--ink);
}

.checkout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  width: 100%;
  max-width: 860px;
}

@media (max-width: 720px) {
  .checkout {
    grid-template-columns: 1fr;
    gap: 2rem;
    max-width: 400px;
  }
}

.summary {
  padding: 0.5rem 0.25rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: -0.01em;
  margin-bottom: 0.75rem;
}

.brand-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent);
}

.order-item {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-top: 2rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(18, 20, 28, 0.1);
}

.order-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 10px;
  background: rgba(51, 85, 255, 0.1);
  color: var(--accent);
  font-weight: 700;
  font-size: 1.1rem;
}

.order-item-copy {
  flex: 1;
  min-width: 0;
}

.order-item-name {
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
}

.order-item-meta {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: rgba(18, 20, 28, 0.5);
}

.order-item-price {
  margin: 0;
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
  color: rgba(18, 20, 28, 0.75);
}

.order-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 1.25rem;
  font-size: 1.15rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.payment-panel {
  box-sizing: border-box;
  background: var(--surface);
  border: 1px solid rgba(18, 20, 28, 0.1);
  border-radius: 14px;
  padding: 1.75rem;
}

.payment-heading {
  margin: 0 0 1.1rem;
  font-size: 1rem;
  font-weight: 700;
}

.method-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border: 1px solid rgba(18, 20, 28, 0.14);
  border-radius: 10px;
  padding: 0.85rem 0.9rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.method-card:last-of-type {
  margin-bottom: 1.4rem;
}

.method-card--active {
  border-color: var(--accent);
  background: rgba(51, 85, 255, 0.045);
}

.method-radio {
  margin-top: 0.15rem;
  width: 17px;
  height: 17px;
  flex-shrink: 0;
  accent-color: var(--accent);
}

.method-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-top: 0.1rem;
  flex-shrink: 0;
  color: rgba(18, 20, 28, 0.4);
}

.method-card--active .method-icon {
  color: var(--accent);
}

.method-icon svg {
  width: 100%;
  height: 100%;
}

.method-copy {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  min-width: 0;
}

.method-title {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 600;
}

.method-desc {
  font-size: 0.8rem;
  line-height: 1.4;
  color: rgba(18, 20, 28, 0.55);
}

.test-card-picker {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.75rem;
  cursor: default;
}

.test-card-label {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(18, 20, 28, 0.6);
}

.test-card-select {
  font: inherit;
  font-size: 0.85rem;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid rgba(18, 20, 28, 0.16);
  border-radius: 7px;
  padding: 0.5rem 0.6rem;
  outline: none;
}

.test-card-select:focus {
  border-color: var(--accent);
}

.pay-button {
  width: 100%;
  padding: 0.85rem 1rem;
  background: var(--accent);
  color: var(--surface);
  border: none;
  border-radius: 8px;
  font: inherit;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.pay-button:hover {
  filter: brightness(0.92);
}

.pay-button:disabled {
  cursor: default;
  filter: brightness(0.96);
  opacity: 0.75;
}

.pay-button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .method-card,
  .pay-button {
    transition: none;
  }
}
</style>
