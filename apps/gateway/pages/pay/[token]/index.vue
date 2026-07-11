<script setup lang="ts">
import { detectBrand, PAYMENT_METHOD_CATALOG, type PaymentMethod } from "@simplepsp/shared";

const route = useRoute();
const token = route.params.token as string;

const { data: payment } = await useFetch(`/api/pay/${token}`);

const cardNumber = ref("4242 4242 4242 4242");
const expMonth = ref("12");
const expYear = ref("30");
const cvc = ref("123");

const BRAND_LABELS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
};

const brand = computed(() => detectBrand(cardNumber.value));
const brandLabel = computed(() => BRAND_LABELS[brand.value] ?? "");

const enabledMethods = computed(() => {
  const flags = payment.value?.enabledMethods;
  if (!flags) return [];
  return PAYMENT_METHOD_CATALOG.filter((m) => flags[m.id]);
});

const activeMethod = ref<PaymentMethod>("card");
watch(
  enabledMethods,
  (methods) => {
    if (methods.length && !methods.some((m) => m.id === activeMethod.value)) {
      activeMethod.value = methods[0]!.id;
    }
  },
  { immediate: true },
);

const formattedAmount = computed(() => {
  if (!payment.value) return "";
  return (payment.value.amount / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
});

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 19);
  return digits.match(/.{1,4}/g)?.join(" ") ?? digits;
}

function onCardNumberInput(event: Event) {
  cardNumber.value = formatCardNumber((event.target as HTMLInputElement).value);
}

function digitsOnly(event: Event, max: number): string {
  return (event.target as HTMLInputElement).value.replace(/\D/g, "").slice(0, max);
}

function onExpMonthInput(event: Event) {
  expMonth.value = digitsOnly(event, 2);
}
function onExpYearInput(event: Event) {
  expYear.value = digitsOnly(event, 2);
}
function onCvcInput(event: Event) {
  cvc.value = digitsOnly(event, 4);
}
</script>

<template>
  <div class="pay-page">
    <div v-if="payment" class="pay-card">
      <div class="pay-owner-row">
        <OwnerNote role="Merchant" :name="payment.merchantName" />
        <InfoTip
          text="This page is hosted by the gateway, not the shop - the card data you enter here is never seen by the merchant's own server."
        />
      </div>

      <p class="pay-amount">{{ formattedAmount }}<span class="pay-currency">{{ payment.currency }}</span></p>
      <p class="pay-reference">Ref {{ payment.reference }}</p>

      <div v-if="enabledMethods.length > 1" class="method-tabs">
        <button
          v-for="m in enabledMethods"
          :key="m.id"
          type="button"
          class="method-tab"
          :class="{ 'method-tab--active': activeMethod === m.id }"
          @click="activeMethod = m.id"
        >
          {{ m.label }}
        </button>
      </div>

      <div v-if="activeMethod !== 'card'" class="wallet-block">
        <p class="wallet-copy">
          Simulated {{ PAYMENT_METHOD_CATALOG.find((m) => m.id === activeMethod)?.label }} checkout
          <InfoTip text="This is a dummy wallet button - no real PayPal/Google Pay integration exists. It submits straight to the gateway and always approves instantly, to demonstrate that a real gateway would route this payment method through a different rail than the card form." />
        </p>
        <form method="post" :action="`/pay/${token}/wallet`">
          <input type="hidden" name="method" :value="activeMethod" />
          <button type="submit" class="pay-button">
            Pay {{ formattedAmount }} {{ payment.currency }} with
            {{ PAYMENT_METHOD_CATALOG.find((m) => m.id === activeMethod)?.label }}
          </button>
        </form>
      </div>

      <form v-if="activeMethod === 'card'" method="post" :action="`/pay/${token}`" class="card-form">
        <label class="field">
          <span class="field-label">Card number</span>
          <div class="card-number-field">
            <input
              :value="cardNumber"
              name="cardNumber"
              type="text"
              inputmode="numeric"
              autocomplete="cc-number"
              placeholder="1234 5678 9012 3456"
              maxlength="23"
              class="input"
              @input="onCardNumberInput"
            />
            <span class="card-brand" :class="{ 'card-brand--known': brandLabel }">{{ brandLabel || "CARD" }}</span>
          </div>
        </label>

        <div class="field-row">
          <label class="field field-expiry">
            <span class="field-label">Expiry</span>
            <div class="expiry-field">
              <input
                :value="expMonth"
                name="expMonth"
                type="text"
                inputmode="numeric"
                autocomplete="cc-exp-month"
                placeholder="MM"
                maxlength="2"
                @input="onExpMonthInput"
              />
              <span class="expiry-slash">/</span>
              <input
                :value="expYear"
                name="expYear"
                type="text"
                inputmode="numeric"
                autocomplete="cc-exp-year"
                placeholder="YY"
                maxlength="2"
                @input="onExpYearInput"
              />
            </div>
          </label>
          <label class="field field-cvc">
            <span class="field-label">CVC</span>
            <input
              :value="cvc"
              name="cvc"
              type="text"
              inputmode="numeric"
              autocomplete="cc-csc"
              placeholder="123"
              maxlength="4"
              class="input"
              @input="onCvcInput"
            />
          </label>
        </div>

        <button type="submit" class="pay-button">Pay {{ formattedAmount }} {{ payment.currency }}</button>
      </form>

      <p v-if="activeMethod === 'card'" class="pay-security">Test data only. No real card network is contacted.</p>

      <details v-if="activeMethod === 'card'" class="test-cards">
        <summary>Demo test cards</summary>
        <ul>
          <li><code>4242 4242 4242 4242</code><span>Approved</span></li>
          <li><code>4000 0000 0000 0002</code><span>Declined</span></li>
          <li><code>4000 0000 0000 3220</code><span>Requires 3D Secure</span></li>
        </ul>
      </details>
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
  --font-mono: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;

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

.pay-owner-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 1.5rem;
}

.pay-amount {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.pay-currency {
  margin-left: 0.4rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(18, 20, 28, 0.45);
}

.pay-reference {
  margin: 0.35rem 0 2rem;
  font-size: 0.85rem;
  color: rgba(18, 20, 28, 0.5);
}

.method-tabs {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
  border: 1px solid rgba(18, 20, 28, 0.12);
  border-radius: 9px;
  padding: 0.25rem;
}

.method-tab {
  flex: 1;
  border: none;
  background: transparent;
  color: rgba(18, 20, 28, 0.55);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem 0.6rem;
  border-radius: 7px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.method-tab--active {
  background: var(--accent);
  color: var(--surface);
}

.wallet-block {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.wallet-copy {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
  font-size: 0.85rem;
  color: rgba(18, 20, 28, 0.6);
}

.card-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(18, 20, 28, 0.6);
  letter-spacing: 0.01em;
}

.input {
  width: 100%;
  box-sizing: border-box;
  font: inherit;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid rgba(18, 20, 28, 0.16);
  border-radius: 8px;
  padding: 0.7rem 0.85rem;
  outline: none;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.input::placeholder {
  color: rgba(18, 20, 28, 0.32);
}

.input:focus {
  border-color: var(--accent);
  background: rgba(51, 85, 255, 0.045);
}

.card-number-field {
  position: relative;
}

.card-number-field .input {
  padding-right: 4.5rem;
  letter-spacing: 0.03em;
}

.card-brand {
  position: absolute;
  right: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: rgba(18, 20, 28, 0.35);
  background: rgba(18, 20, 28, 0.06);
  border-radius: 5px;
  padding: 0.25rem 0.45rem;
  pointer-events: none;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.card-brand--known {
  color: var(--accent);
  background: rgba(51, 85, 255, 0.1);
}

.field-row {
  display: flex;
  gap: 1rem;
}

.field-expiry {
  flex: 1;
}

.field-cvc {
  width: 110px;
  flex-shrink: 0;
}

.expiry-field {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid rgba(18, 20, 28, 0.16);
  border-radius: 8px;
  padding: 0 0.6rem;
  background: var(--surface);
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.expiry-field:focus-within {
  border-color: var(--accent);
  background: rgba(51, 85, 255, 0.045);
}

.expiry-field input {
  width: 2.1ch;
  border: none;
  background: transparent;
  outline: none;
  padding: 0.7rem 0;
  text-align: center;
  font: inherit;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

.expiry-field input::placeholder {
  color: rgba(18, 20, 28, 0.32);
}

.expiry-slash {
  color: rgba(18, 20, 28, 0.3);
  font-weight: 600;
}

.pay-button {
  margin-top: 0.35rem;
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

.pay-button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.pay-security {
  margin: 1.25rem 0 0;
  font-size: 0.78rem;
  color: rgba(18, 20, 28, 0.45);
  text-align: center;
}

.test-cards {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(18, 20, 28, 0.1);
}

.test-cards summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(18, 20, 28, 0.55);
  list-style: none;
}

.test-cards summary::-webkit-details-marker {
  display: none;
}

.test-cards summary::after {
  content: "+";
  font-weight: 400;
  color: rgba(18, 20, 28, 0.35);
}

.test-cards[open] summary::after {
  content: "\2013";
}

.test-cards ul {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
}

.test-cards li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 0.78rem;
  color: rgba(18, 20, 28, 0.55);
}

.test-cards code {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.01em;
  color: var(--ink);
}

.pay-not-found {
  margin: 0;
  color: rgba(18, 20, 28, 0.55);
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .input,
  .expiry-field,
  .card-brand,
  .pay-button {
    transition: none;
  }
}
</style>
