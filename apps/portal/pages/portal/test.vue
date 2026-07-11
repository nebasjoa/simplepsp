<script setup lang="ts">
import { TEST_CARD_CATALOG } from "@simplepsp/shared";

definePageMeta({ middleware: "merchant-auth", layout: "portal" });

const route = useRoute();
const mode = ref<"hosted" | "direct">("hosted");
const selectedCard = ref(TEST_CARD_CATALOG[0]!.number);
const loading = ref(false);
const result = ref<Record<string, unknown> | null>(null);

const returnedPaymentId = route.query.paymentId as string | undefined;
if (returnedPaymentId) {
  const { data } = await useFetch(`/api/portal/payments/${returnedPaymentId}`);
  result.value = data.value;
}

async function fire() {
  loading.value = true;
  result.value = null;
  try {
    const body: Record<string, unknown> = { mode: mode.value };
    if (mode.value === "direct") body.cardNumber = selectedCard.value;
    const res = await $fetch<{ redirectUrl?: string }>("/api/portal/test-payment", { method: "POST", body });
    if (mode.value === "hosted" && res.redirectUrl) {
      window.location.href = res.redirectUrl;
    } else {
      result.value = res;
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <h1>Fire a test payment</h1>
    <p style="color: #666">
      Sends a real signed request to the gateway using this account's own API credentials - handy for live
      demos.
    </p>

    <p>
      <label><input v-model="mode" type="radio" value="hosted" /> Hosted (redirect)</label>
      <InfoTip text="Card data is entered on a gateway-hosted page - this account's server never sees the card number." />
      &nbsp;
      <label><input v-model="mode" type="radio" value="direct" /> Direct (server-to-server)</label>
      <InfoTip text="The card is posted straight to the gateway API in this request. Puts the merchant in the strictest PCI scope (SAQ D) - fine for a demo, but real gateways steer merchants toward the hosted flow." />
    </p>

    <p v-if="mode === 'direct'">
      <label>
        Test card
        <InfoTip text="Each test card number deterministically maps to an outcome (approved, declined, processing error, or a 3DS challenge) - no randomness, so demos are reproducible." />
        <select v-model="selectedCard">
          <option v-for="c in TEST_CARD_CATALOG" :key="c.number" :value="c.number">{{ c.label }}</option>
        </select>
      </label>
    </p>

    <button :disabled="loading" @click="fire">{{ loading ? "Sending..." : "Send test payment" }}</button>

    <pre v-if="result" style="background: #f6f6f6; padding: 1rem; margin-top: 1rem">{{ JSON.stringify(result, null, 2) }}</pre>
  </div>
</template>
