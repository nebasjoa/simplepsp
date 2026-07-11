<script setup lang="ts">
const email = ref("admin@demo.test");
const password = ref("");
const error = ref("");
const loading = ref(false);
const { fetch: refreshSession } = useUserSession();

async function login() {
  error.value = "";
  loading.value = true;
  try {
    await $fetch("/api/admin/login", { method: "POST", body: { email: email.value, password: password.value } });
    await refreshSession();
    await navigateTo("/admin/merchants");
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
      Operator login
      <InfoTip text="Operator sessions are a separate namespace from merchant sessions - operators manage merchants here but can never sign into a merchant's own portal with this login." />
    </h1>
    <p style="color: #666; font-size: 0.85rem">Gateway staff area - separate from merchant accounts.</p>
    <form @submit.prevent="login">
      <p><label>Email<br /><input v-model="email" type="email" required /></label></p>
      <p><label>Password<br /><input v-model="password" type="password" required /></label></p>
      <button :disabled="loading" type="submit">{{ loading ? "Signing in..." : "Sign in" }}</button>
    </form>
    <p v-if="error" style="color: crimson">{{ error }}</p>
  </div>
</template>
