<script setup lang="ts">
import { TEST_CARD_CATALOG } from "@simplepsp/shared";

const loading = ref(false);
const selectedCard = ref(TEST_CARD_CATALOG[0]!.number);

async function checkoutHosted() {
  loading.value = true;
  const result = await $fetch<{ redirectUrl: string }>("/api/checkout", {
    method: "POST",
    body: { mode: "hosted" },
  });
  window.location.href = result.redirectUrl;
}

async function checkoutDirect() {
  loading.value = true;
  try {
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
  <div style="max-width: 480px; margin: 3rem auto; font-family: sans-serif">
    <h1>Demo Shop</h1>
    <p>Widget &mdash; 10.99 EUR</p>

    <section style="margin-bottom: 1.5rem">
      <h2 style="font-size: 1rem">Hosted (redirect) checkout</h2>
      <p style="color: #666; font-size: 0.85rem">
        Card data is entered on the gateway's hosted page &mdash; the shop never sees it.
      </p>
      <button :disabled="loading" @click="checkoutHosted">
        {{ loading ? "Redirecting..." : "Checkout (hosted)" }}
      </button>
    </section>

    <section>
      <h2 style="font-size: 1rem">Direct (server-to-server) checkout</h2>
      <p style="color: #666; font-size: 0.85rem">
        The shop collects the card itself and posts it straight to the gateway API. That puts the
        merchant in the strictest PCI scope (SAQ D) &mdash; fine here since no real cards exist, but
        real gateways steer merchants toward the hosted flow instead.
      </p>
      <label>
        Test card
        <select v-model="selectedCard">
          <option v-for="c in TEST_CARD_CATALOG" :key="c.number" :value="c.number">{{ c.label }}</option>
        </select>
      </label>
      <br />
      <button :disabled="loading" @click="checkoutDirect">
        {{ loading ? "Processing..." : "Checkout (direct)" }}
      </button>
    </section>
  </div>
</template>
