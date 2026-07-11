<script setup lang="ts">
const route = useRoute();
const paymentId = route.query.paymentId as string;

const { data: payment } = await useFetch("/api/payment-status", {
  query: { paymentId },
});
</script>

<template>
  <div style="max-width: 420px; margin: 3rem auto; font-family: sans-serif">
    <h1>Order status</h1>
    <p v-if="payment">
      Payment <strong>{{ payment.status }}</strong> ({{ (payment.amount / 100).toFixed(2) }}
      {{ payment.currency }}, ref {{ payment.reference }})
    </p>
    <p v-else>Payment not found.</p>
  </div>
</template>
