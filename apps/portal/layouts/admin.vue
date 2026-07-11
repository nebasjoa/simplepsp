<script setup lang="ts">
const { user, clear } = useUserSession();

async function logout() {
  await clear();
  await navigateTo("/admin/login");
}
</script>

<template>
  <div style="font-family: sans-serif">
    <nav style="display: flex; gap: 1.5rem; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid #ddd; background: #1a1a2e; color: white">
      <strong>SimplePSP Admin</strong>
      <NuxtLink to="/admin/merchants" style="color: white">Merchants</NuxtLink>
      <span style="margin-left: auto; color: #ccc; font-size: 0.85rem">{{ user?.email }}</span>
      <button @click="logout">Log out</button>
    </nav>
    <main style="max-width: 960px; margin: 2rem auto; padding: 0 1rem">
      <slot />
    </main>
  </div>
</template>
