<script setup lang="ts">
definePageMeta({ middleware: "merchant-auth", layout: "portal" });

const { data } = await useFetch("/api/portal/overview");
</script>

<template>
  <div>
    <h1>Overview</h1>
    <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin: 1rem 0">
      <div
        v-for="t in data?.totals"
        :key="t.status"
        style="border: 1px solid #ddd; padding: 0.75rem 1rem; border-radius: 6px; min-width: 120px"
      >
        <div style="font-size: 0.8rem; color: #666">{{ t.status }}</div>
        <div style="font-size: 1.4rem">{{ t.count }}</div>
        <div style="font-size: 0.8rem; color: #666">{{ (t.amount / 100).toFixed(2) }}</div>
      </div>
      <p v-if="!data?.totals.length" style="color: #666">No payments yet.</p>
    </div>

    <h2>Recent payments</h2>
    <table style="width: 100%; border-collapse: collapse">
      <thead>
        <tr style="text-align: left; border-bottom: 1px solid #ddd">
          <th>Reference</th>
          <th>Status</th>
          <th>Amount</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in data?.recent" :key="p.id" style="border-bottom: 1px solid #eee">
          <td><NuxtLink :to="`/portal/payments/${p.id}`">{{ p.reference }}</NuxtLink></td>
          <td>{{ p.status }}</td>
          <td>{{ (p.amount / 100).toFixed(2) }} {{ p.currency }}</td>
          <td>{{ new Date(p.createdAt).toLocaleString() }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
