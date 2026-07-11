<script setup lang="ts">
const route = useRoute();
const token = route.params.token as string;

const { data: payment } = await useFetch(`/api/pay/${token}`);

const cardNumber = ref("4242 4242 4242 4242");
const expMonth = ref("12");
const expYear = ref("2030");
const cvc = ref("123");
</script>

<template>
  <div v-if="payment" style="max-width: 420px; margin: 3rem auto; font-family: sans-serif">
    <OwnerNote role="Merchant" :name="payment.merchantName" />
    <h1>
      Pay {{ (payment.amount / 100).toFixed(2) }} {{ payment.currency }}
      <InfoTip text="This page is hosted by the gateway, not the shop - the card data you enter here is never seen by the merchant's own server." />
    </h1>
    <p>Reference: {{ payment.reference }}</p>

    <form method="post" :action="`/pay/${token}`">
      <label>
        Card number
        <input v-model="cardNumber" name="cardNumber" type="text" />
      </label>
      <div style="display: flex; gap: 1rem">
        <label>
          Exp. month
          <input v-model="expMonth" name="expMonth" type="text" size="2" />
        </label>
        <label>
          Exp. year
          <input v-model="expYear" name="expYear" type="text" size="4" />
        </label>
        <label>
          CVC
          <input v-model="cvc" name="cvc" type="text" size="3" />
        </label>
      </div>
      <button type="submit">Pay</button>
    </form>

    <p style="color: #666; font-size: 0.85rem">
      Demo test cards: 4242 4242 4242 4242 (approved), 4000 0000 0000 0002 (declined), 4000 0000 0000 3220
      (requires 3D Secure).
    </p>
  </div>
  <div v-else>
    <p>Payment not found.</p>
  </div>
</template>
