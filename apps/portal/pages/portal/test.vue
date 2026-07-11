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
      Sends a real signed request to the gateway using this account's own API credentials — handy for live
      demos.
    </p>

    <p>
      <label><input v-model="mode" type="radio" value="hosted" /> Hosted (redirect)</label>
      &nbsp;
      <label><input v-model="mode" type="radio" value="direct" /> Direct (server-to-server)</label>
    </p>

    <p v-if="mode === 'direct'">
      <label>
        Test card
        <select v-model="selectedCard">
          <option v-for="c in TEST_CARD_CATALOG" :key="c.number" :value="c.number">{{ c.label }}</option>
        </select>
      </label>
    </p>

    <button :disabled="loading" @click="fire">{{ loading ? "Sending..." : "Send test payment" }}</button>

    <pre v-if="result" style="background: #f6f6f6; padding: 1rem; margin-top: 1rem">{{ JSON.stringify(result, null, 2) }}</pre>
  </div>
</template>
