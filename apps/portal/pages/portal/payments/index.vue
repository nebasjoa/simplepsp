<script setup lang="ts">
definePageMeta({ middleware: "merchant-auth", layout: "portal" });

const STATUSES = [
  "initiated",
  "authorized",
  "captured",
  "declined",
  "failed",
  "voided",
  "expired",
  "partially_refunded",
  "refunded",
  "settled",
];

const status = ref("");
const reference = ref("");
const page = ref(1);

const { data } = await useFetch("/api/portal/payments", {
  query: computed(() => ({
    status: status.value || undefined,
    reference: reference.value || undefined,
    page: page.value,
  })),
});

watch([status, reference], () => {
  page.value = 1;
});
</script>

<template>
  <div>
    <h1>Payments</h1>
    <div style="display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center">
      <input v-model="reference" placeholder="Filter by reference" />
      <select v-model="status">
        <option value="">All statuses</option>
        <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
      <InfoTip
        text="Status moves through a strict state machine, e.g. initiated -> authorized -> captured -> refunded. Illegal jumps (like captured straight to authorized) are rejected server-side, never silently allowed."
      />
    </div>

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
        <tr v-for="p in data?.items" :key="p.id" style="border-bottom: 1px solid #eee">
          <td><NuxtLink :to="`/portal/payments/${p.id}`">{{ p.reference }}</NuxtLink></td>
          <td>{{ p.status }}</td>
          <td>{{ (p.amount / 100).toFixed(2) }} {{ p.currency }}</td>
          <td>{{ new Date(p.createdAt).toLocaleString() }}</td>
        </tr>
      </tbody>
    </table>
    <p v-if="data && data.items.length === 0" style="color: #666">No payments match.</p>

    <div v-if="data" style="margin-top: 1rem; display: flex; gap: 0.5rem; align-items: center">
      <button :disabled="page <= 1" @click="page--">Prev</button>
      <span>Page {{ data.page }} ({{ data.total }} total)</span>
      <button :disabled="page * data.pageSize >= data.total" @click="page++">Next</button>
    </div>
  </div>
</template>
