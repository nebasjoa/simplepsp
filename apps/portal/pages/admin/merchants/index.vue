<script setup lang="ts">
definePageMeta({ middleware: "operator-auth", layout: "admin" });

const { data: merchants } = await useFetch("/api/admin/merchants");
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center">
      <h1>Merchants</h1>
      <NuxtLink to="/admin/merchants/new" style="border: 1px solid #333; padding: 0.4rem 0.8rem; border-radius: 4px">
        + New merchant
      </NuxtLink>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-top: 1rem">
      <thead>
        <tr style="text-align: left; border-bottom: 1px solid #ddd">
          <th>Name</th>
          <th>Email</th>
          <th>Status</th>
          <th>Payments</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in merchants" :key="m.id" style="border-bottom: 1px solid #eee">
          <td>{{ m.name }}</td>
          <td>{{ m.email }}</td>
          <td>{{ m.active ? "Active" : "Disabled" }}</td>
          <td>{{ m.paymentCount }}</td>
          <td><NuxtLink :to="`/admin/merchants/${m.id}`">Manage</NuxtLink></td>
        </tr>
      </tbody>
    </table>
    <p v-if="merchants && merchants.length === 0" style="color: #666">No merchants yet.</p>
  </div>
</template>
