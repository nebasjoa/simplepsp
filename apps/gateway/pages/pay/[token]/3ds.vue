<script setup lang="ts">
const route = useRoute();
const token = route.params.token as string;

const { data: payment } = await useFetch(`/api/pay/${token}`);
</script>

<template>
  <div
    v-if="payment"
    style="
      max-width: 420px;
      margin: 3rem auto;
      font-family: sans-serif;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 1.5rem;
      background: #f4f5fb;
    "
  >
    <p style="font-size: 0.75rem; letter-spacing: 0.05em; text-transform: uppercase; color: #666; margin: 0">
      Simulated card issuer &middot; 3D Secure
    </p>
    <OwnerNote role="Merchant" :name="payment.merchantName" />
    <h1 style="font-size: 1.2rem">
      Verify this payment
      <InfoTip text="In a real integration your bank (the card issuer) hosts this challenge page, not the gateway - it's simulated here so the 3DS step is visible end to end." />
    </h1>
    <p>
      Confirm the {{ (payment.amount / 100).toFixed(2) }} {{ payment.currency }} payment
      <span v-if="payment.cardBrand">on your {{ payment.cardBrand }} card ending in {{ payment.cardLast4 }}</span>
      to continue.
    </p>

    <form method="post" :action="`/pay/${token}/3ds`" style="display: flex; gap: 1rem; margin-top: 1.5rem">
      <button type="submit" name="decision" value="approve">Approve</button>
      <button type="submit" name="decision" value="decline">Decline</button>
    </form>

    <p style="color: #666; font-size: 0.8rem; margin-top: 1.5rem">
      This is a simulated ACS (Access Control Server) page - in a real integration your bank would host this
      step, not the gateway.
    </p>
  </div>
  <div v-else>
    <p>Payment not found.</p>
  </div>
</template>
