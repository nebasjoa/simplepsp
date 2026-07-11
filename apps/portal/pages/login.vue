<script setup lang="ts">
const email = ref("merchant@demo.test");
const password = ref("");
const error = ref("");
const loading = ref(false);
const { fetch: refreshSession } = useUserSession();

async function login() {
  error.value = "";
  loading.value = true;
  try {
    await $fetch("/api/portal/login", { method: "POST", body: { email: email.value, password: password.value } });
    await refreshSession();
    await navigateTo("/portal");
  } catch (e) {
    error.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Login failed";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div style="max-width: 360px; margin: 4rem auto; font-family: sans-serif">
    <h1>
      Merchant login
      <InfoTip text="Merchant sessions are a separate namespace from operator (admin) sessions - logging in here never grants access to /admin." />
    </h1>
    <form @submit.prevent="login">
      <p><label>Email<br /><input v-model="email" type="email" required /></label></p>
      <p><label>Password<br /><input v-model="password" type="password" required /></label></p>
      <button :disabled="loading" type="submit">{{ loading ? "Signing in..." : "Sign in" }}</button>
    </form>
    <p v-if="error" style="color: crimson">{{ error }}</p>
    <p style="margin-top: 2rem; font-size: 0.85rem; color: #666">
      <NuxtLink to="/admin/login">Operator login →</NuxtLink>
    </p>
  </div>
</template>
