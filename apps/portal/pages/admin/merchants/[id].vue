<script setup lang="ts">
import { PAYMENT_METHOD_CATALOG, type PaymentMethod } from "@simplepsp/shared";

definePageMeta({ middleware: "operator-auth", layout: "admin" });

const route = useRoute();
const { data: merchant, refresh } = await useFetch(`/api/admin/merchants/${route.params.id}`);

const rotatedSecret = ref("");
const resetPassword = ref("");
const busy = ref(false);
const methodError = ref("");

const METHOD_FIELD: Record<PaymentMethod, "cardEnabled" | "paypalEnabled" | "googlePayEnabled"> = {
  card: "cardEnabled",
  paypal: "paypalEnabled",
  google_pay: "googlePayEnabled",
};

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

async function toggleMethod(method: PaymentMethod) {
  if (!merchant.value) return;
  const field = METHOD_FIELD[method];
  methodError.value = "";
  busy.value = true;
  try {
    await $fetch(`/api/admin/merchants/${route.params.id}`, {
      method: "PATCH",
      body: { [field]: !merchant.value[field] },
    });
    await refresh();
  } catch (e) {
    methodError.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage ?? "Failed to update";
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
    <OwnerNote role="Merchant record" :name="merchant.name" :email="merchant.email" />
    <h1>{{ merchant.name }}</h1>
    <p>{{ merchant.email }} &middot; {{ merchant.active ? "Active" : "Disabled" }} &middot; {{ merchant.paymentCount }} payments</p>
    <p>API key: <code>{{ merchant.apiKey }}</code></p>

    <p>
      <button :disabled="busy" @click="toggleActive">{{ merchant.active ? "Disable" : "Enable" }} merchant</button>
      <InfoTip text="Disabling blocks this merchant everywhere: their API keys stop authenticating (401) and their portal login is refused." />
      <button :disabled="busy" @click="rotateSecret" style="margin-left: 0.5rem">Rotate secret</button>
      <InfoTip text="Generates a new HMAC secret and invalidates the old one immediately. Shown once here, then never retrievable again." />
      <button :disabled="busy" @click="resetPortalPassword" style="margin-left: 0.5rem">Reset portal password</button>
      <InfoTip text="Sets a new portal login password for this merchant, shown once. Useful if they've lost access - doesn't touch their API credentials." />
    </p>

    <p v-if="rotatedSecret" style="border: 1px solid #ddd; padding: 0.5rem">
      New secret (shown once): <code>{{ rotatedSecret }}</code>
    </p>
    <p v-if="resetPassword" style="border: 1px solid #ddd; padding: 0.5rem">
      New portal password (shown once): <code>{{ resetPassword }}</code>
    </p>

    <h2 style="margin-top: 1.5rem">
      Payment methods
      <InfoTip text="Only enabled methods are offered on this merchant's hosted payment page. PayPal and Google Pay are dummy, no real integration exists - they simulate an instant-approve wallet checkout to show that a real gateway routes different methods through different rails." />
    </h2>
    <p v-if="methodError" style="color: crimson">{{ methodError }}</p>
    <p v-for="m in PAYMENT_METHOD_CATALOG" :key="m.id">
      <label>
        <input
          type="checkbox"
          :checked="merchant[METHOD_FIELD[m.id]]"
          :disabled="busy"
          @change="toggleMethod(m.id)"
        />
        {{ m.label }}<span v-if="m.dummy" style="color: #666"> (dummy)</span>
      </label>
    </p>
  </div>
</template>
