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
      <span style="margin-left: auto; display: inline-flex; align-items: center; color: #ccc">
        <OwnerNote role="Operator" :email="user?.email" />
        <InfoTip
          text="Operator sessions are a separate auth namespace from merchant sessions - an operator can manage merchants here but can never log into a merchant's portal."
        />
      </span>
      <button @click="logout">Log out</button>
    </nav>
    <main style="max-width: 960px; margin: 2rem auto; padding: 0 1rem">
      <slot />
    </main>
  </div>
</template>
