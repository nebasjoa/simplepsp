<script setup lang="ts">
definePageMeta({ middleware: "operator-auth", layout: "admin" });

const { data, refresh } = await useFetch("/api/admin/settlements");
const running = ref(false);
const lastResult = ref<{ batchId: string; paymentCount: number; settledCount: number; failedCount: number } | null>(null);

async function runBatch() {
  running.value = true;
  try {
    lastResult.value = await $fetch<{ batchId: string; paymentCount: number; settledCount: number; failedCount: number }>(
      "/api/admin/settlements/run",
      { method: "POST" },
    );
    await refresh();
  } finally {
    running.value = false;
  }
}
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center">
      <h1>
        Settlements
        <InfoTip text="A capture only means the card cleared. Settlement is the separate, batched step where the gateway submits everything it has captured to the acquirer and gets confirmation it can actually pay merchants - that's the money-movement step, not the auth step." />
      </h1>
      <button :disabled="running" style="border: 1px solid #333; padding: 0.4rem 0.8rem; border-radius: 4px" @click="runBatch">
        {{ running ? "Running..." : "Run settlement batch" }}
      </button>
    </div>

    <div v-if="lastResult" style="margin-top: 1rem; padding: 0.75rem 1rem; border: 1px solid #cde; border-radius: 4px; background: #eef4ff">
      Batch {{ lastResult.batchId }}: {{ lastResult.settledCount }} settled, {{ lastResult.failedCount }} failed, out of {{ lastResult.paymentCount }} eligible.
    </div>

    <h2 style="margin-top: 2rem">Pending settlement</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem">
      <thead>
        <tr style="text-align: left; border-bottom: 1px solid #ddd">
          <th>Currency</th>
          <th>Payments</th>
          <th>Total amount</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in data?.pending" :key="p.currency" style="border-bottom: 1px solid #eee">
          <td>{{ p.currency }}</td>
          <td>{{ p.count }}</td>
          <td>{{ (p.totalAmount / 100).toFixed(2) }} {{ p.currency }}</td>
        </tr>
      </tbody>
    </table>
    <p v-if="data && data.pending.length === 0" style="color: #666">Nothing eligible for settlement right now.</p>

    <h2 style="margin-top: 2rem">Batch history</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem">
      <thead>
        <tr style="text-align: left; border-bottom: 1px solid #ddd">
          <th>When</th>
          <th>Payments</th>
          <th>Settled</th>
          <th>Failed</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in data?.batches" :key="b.id" style="border-bottom: 1px solid #eee">
          <td>{{ new Date(b.createdAt).toLocaleString() }}</td>
          <td>{{ b.paymentCount }}</td>
          <td>{{ b.settledCount }}</td>
          <td>{{ b.failedCount }}</td>
          <td><NuxtLink :to="`/admin/settlements/${b.id}`">Details</NuxtLink></td>
        </tr>
      </tbody>
    </table>
    <p v-if="data && data.batches.length === 0" style="color: #666">No settlement batches have run yet.</p>
  </div>
</template>
