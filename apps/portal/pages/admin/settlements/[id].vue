<script setup lang="ts">
definePageMeta({ middleware: "operator-auth", layout: "admin" });

interface SettlementBatchDetail {
  id: string;
  status: string;
  paymentCount: number;
  settledCount: number;
  failedCount: number;
  createdAt: string;
  merchants: { merchantId: string; merchantName: string; currency: string; count: number; totalAmount: number }[];
  payments: {
    id: string;
    reference: string;
    merchantName: string;
    currency: string;
    amount: number;
    settledAmount: number | null;
    settlementOutcome: string | null;
    settlementReason: string | null;
  }[];
}

const route = useRoute();
const { data: batch } = await useFetch<SettlementBatchDetail>(`/api/admin/settlements/${route.params.id}`);
</script>

<template>
  <div v-if="batch">
    <NuxtLink to="/admin/settlements">&larr; Settlements</NuxtLink>
    <h1>Batch {{ batch.id }}</h1>
    <p style="color: #666">{{ new Date(batch.createdAt).toLocaleString() }} &mdash; {{ batch.settledCount }} settled, {{ batch.failedCount }} failed, {{ batch.paymentCount }} total</p>

    <h2 style="margin-top: 1.5rem">By merchant</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem">
      <thead>
        <tr style="text-align: left; border-bottom: 1px solid #ddd">
          <th>Merchant</th>
          <th>Currency</th>
          <th>Payments</th>
          <th>Total settled</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in batch.merchants" :key="`${m.merchantId}:${m.currency}`" style="border-bottom: 1px solid #eee">
          <td>{{ m.merchantName }}</td>
          <td>{{ m.currency }}</td>
          <td>{{ m.count }}</td>
          <td>{{ (m.totalAmount / 100).toFixed(2) }} {{ m.currency }}</td>
        </tr>
      </tbody>
    </table>

    <h2 style="margin-top: 1.5rem">Payments</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem">
      <thead>
        <tr style="text-align: left; border-bottom: 1px solid #ddd">
          <th>Reference</th>
          <th>Merchant</th>
          <th>Amount</th>
          <th>Outcome</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in batch.payments" :key="p.id" style="border-bottom: 1px solid #eee">
          <td>{{ p.reference }}</td>
          <td>{{ p.merchantName }}</td>
          <td>{{ (p.amount / 100).toFixed(2) }} {{ p.currency }}</td>
          <td>
            {{ p.settlementOutcome }}
            <span v-if="p.settlementReason" style="color: #666"> - {{ p.settlementReason }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
