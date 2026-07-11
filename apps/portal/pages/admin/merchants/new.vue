<script setup lang="ts">
definePageMeta({ middleware: "operator-auth", layout: "admin" });

const name = ref("");
const email = ref("");
const loading = ref(false);
const error = ref("");
const created = ref<{ id: string; apiKey: string; secret: string; initialPassword: string } | null>(null);

async function create() {
  error.value = "";
  loading.value = true;
  try {
    created.value = await $fetch<{ id: string; apiKey: string; secret: string; initialPassword: string }>(
      "/api/admin/merchants",
      { method: "POST", body: { name: name.value, email: email.value } },
    );
  } catch (e) {
    error.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Failed to create merchant";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <p><NuxtLink to="/admin/merchants">← Merchants</NuxtLink></p>
    <h1>
      New merchant
      <InfoTip text="Creates an apiKey (public), a secret (HMAC signing key), and an initial portal password all at once. All three are shown once on this screen only - after that the secret can only be rotated, never re-fetched." />
    </h1>

    <div v-if="!created">
      <form @submit.prevent="create">
        <p><label>Name<br /><input v-model="name" required /></label></p>
        <p><label>Email<br /><input v-model="email" type="email" required /></label></p>
        <button :disabled="loading" type="submit">{{ loading ? "Creating..." : "Create merchant" }}</button>
      </form>
      <p v-if="error" style="color: crimson">{{ error }}</p>
    </div>

    <div v-else style="border: 1px solid #ddd; padding: 1rem; border-radius: 6px">
      <p><strong>Merchant created.</strong> These are shown once - copy them now.</p>
      <p>API key: <code data-testid="new-merchant-api-key">{{ created.apiKey }}</code></p>
      <p>Secret: <code data-testid="new-merchant-secret">{{ created.secret }}</code></p>
      <p>Initial portal password: <code data-testid="new-merchant-initial-password">{{ created.initialPassword }}</code></p>
      <p><NuxtLink :to="`/admin/merchants/${created.id}`">Go to merchant →</NuxtLink></p>
    </div>
  </div>
</template>
