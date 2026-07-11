<script setup lang="ts">
definePageMeta({ middleware: "operator-auth", layout: "admin" });

const route = useRoute();
const { data: merchant, refresh } = await useFetch(`/api/admin/merchants/${route.params.id}`);

const rotatedSecret = ref("");
const resetPassword = ref("");
const busy = ref(false);

async function toggleActive() {
  busy.value = true;
  try {
    await $fetch(`/api/admin/merchants/${route.params.id}`, {
      method: "PATCH",
      body: { active: !merchant.value?.active },
    });
    await refresh();
  } finally {
    busy.value = false;
  }
}

async function rotateSecret() {
  if (!confirm("This invalidates the merchant's current secret immediately. Continue?")) return;
  busy.value = true;
  try {
    const res = await $fetch<{ secret: string }>(`/api/admin/merchants/${route.params.id}/rotate-secret`, {
      method: "POST",
    });
    rotatedSecret.value = res.secret;
  } finally {
    busy.value = false;
  }
}

async function resetPortalPassword() {
  busy.value = true;
  try {
    const res = await $fetch<{ password: string }>(`/api/admin/merchants/${route.params.id}/reset-password`, {
      method: "POST",
    });
    resetPassword.value = res.password;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div v-if="merchant">
    <p><NuxtLink to="/admin/merchants">← Merchants</NuxtLink></p>
    <h1>{{ merchant.name }}</h1>
    <p>{{ merchant.email }} &middot; {{ merchant.active ? "Active" : "Disabled" }} &middot; {{ merchant.paymentCount }} payments</p>
    <p>API key: <code>{{ merchant.apiKey }}</code></p>

    <p>
      <button :disabled="busy" @click="toggleActive">{{ merchant.active ? "Disable" : "Enable" }} merchant</button>
      <button :disabled="busy" @click="rotateSecret" style="margin-left: 0.5rem">Rotate secret</button>
      <button :disabled="busy" @click="resetPortalPassword" style="margin-left: 0.5rem">Reset portal password</button>
    </p>

    <p v-if="rotatedSecret" style="border: 1px solid #ddd; padding: 0.5rem">
      New secret (shown once): <code>{{ rotatedSecret }}</code>
    </p>
    <p v-if="resetPassword" style="border: 1px solid #ddd; padding: 0.5rem">
      New portal password (shown once): <code>{{ resetPassword }}</code>
    </p>
  </div>
</template>
