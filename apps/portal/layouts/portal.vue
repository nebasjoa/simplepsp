<script setup lang="ts">
const { user, clear } = useUserSession();

async function logout() {
  await clear();
  await navigateTo("/login");
}
</script>

<template>
  <div style="font-family: sans-serif">
    <nav style="display: flex; gap: 1.5rem; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid #ddd">
      <strong>SimplePSP Portal</strong>
      <NuxtLink to="/portal">Overview</NuxtLink>
      <NuxtLink to="/portal/payments">Payments</NuxtLink>
      <NuxtLink to="/portal/credentials">Credentials</NuxtLink>
      <NuxtLink to="/portal/test">Test payment</NuxtLink>
      <span style="margin-left: auto; display: inline-flex; align-items: center">
        <OwnerNote role="Merchant" :name="user?.name" :email="user?.email" />
        <InfoTip
          text="Everything in this portal is scoped to your merchant account only - the server reads merchantId from your session, never from the page."
        />
      </span>
      <button @click="logout">Log out</button>
    </nav>
    <main style="max-width: 960px; margin: 2rem auto; padding: 0 1rem">
      <slot />
    </main>
  </div>
</template>
