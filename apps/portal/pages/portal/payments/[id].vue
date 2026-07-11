<script setup lang="ts">
definePageMeta({ middleware: "merchant-auth", layout: "portal" });

const route = useRoute();
const { data: payment } = await useFetch(`/api/portal/payments/${route.params.id}`);
</script>

<template>
  <div v-if="payment">
    <p><NuxtLink to="/portal/payments">← Payments</NuxtLink></p>
    <h1>{{ payment.reference }}</h1>
    <p>
      <strong>{{ payment.status }}</strong> &mdash; {{ (payment.amount / 100).toFixed(2) }} {{ payment.currency }}
      <span v-if="payment.cardBrand">&middot; {{ payment.cardBrand }} •••• {{ payment.cardLast4 }}</span>
      <InfoTip
        text="Only the card brand and last 4 digits are ever stored - the full card number never touches this database, even for a demo."
      />
    </p>
    <p style="color: #666; font-size: 0.85rem">
      Created {{ new Date(payment.createdAt).toLocaleString() }} &middot; Updated
      {{ new Date(payment.updatedAt).toLocaleString() }}
    </p>

    <h2>
      Refunds
      <InfoTip text="A refund can be partial or cover the full captured amount. Refunds only move forward - a captured payment can't go back to authorized." />
    </h2>
    <p v-if="!payment.refunds.length" style="color: #666">No refunds yet.</p>
    <table v-else style="width: 100%; border-collapse: collapse">
      <thead>
        <tr style="text-align: left; border-bottom: 1px solid #ddd">
          <th>Amount</th>
          <th>Status</th>
          <th>When</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in payment.refunds" :key="r.id" style="border-bottom: 1px solid #eee">
          <td>{{ (r.amount / 100).toFixed(2) }} {{ payment.currency }}</td>
          <td>{{ r.status }}</td>
          <td>{{ new Date(r.createdAt).toLocaleString() }}</td>
        </tr>
      </tbody>
    </table>

    <h2>
      Webhook deliveries
      <InfoTip
        text="This is the signed server-to-server notification the gateway sends on every terminal status change. It, not the browser redirect, is the source of truth the shop reconciles against."
      />
    </h2>
    <p v-if="!payment.webhookDeliveries.length" style="color: #666">No webhook attempts yet.</p>
    <table v-else style="width: 100%; border-collapse: collapse">
      <thead>
        <tr style="text-align: left; border-bottom: 1px solid #ddd">
          <th>Event</th>
          <th>Status</th>
          <th>Attempts</th>
          <th>When</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="w in payment.webhookDeliveries" :key="w.id" style="border-bottom: 1px solid #eee">
          <td>{{ w.eventType }}</td>
          <td>{{ w.status }}</td>
          <td>{{ w.attempts }}</td>
          <td>{{ new Date(w.createdAt).toLocaleString() }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else>Payment not found.</p>
</template>
