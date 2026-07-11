<script setup lang="ts">
definePageMeta({ middleware: "merchant-auth", layout: "portal" });

const { data: creds, refresh } = await useFetch("/api/portal/credentials");
const webhookUrl = ref(creds.value?.webhookUrl ?? "");
watch(creds, (v) => {
  if (v) webhookUrl.value = v.webhookUrl ?? "";
});

const revealedSecret = ref("");
const savingWebhook = ref(false);
const rotating = ref(false);

async function saveWebhook() {
  savingWebhook.value = true;
  try {
    await $fetch("/api/portal/credentials/webhook-url", { method: "POST", body: { webhookUrl: webhookUrl.value } });
    await refresh();
  } finally {
    savingWebhook.value = false;
  }
}

async function rotateSecret() {
  if (!confirm("Rotating immediately invalidates the current secret. Continue?")) return;
  rotating.value = true;
  try {
    const res = await $fetch<{ secret: string }>("/api/portal/credentials/rotate-secret", { method: "POST" });
    revealedSecret.value = res.secret;
  } finally {
    rotating.value = false;
  }
}
</script>

<template>
  <div>
    <h1>API credentials</h1>

    <p><strong>API key</strong><br /><code>{{ creds?.apiKey }}</code></p>

    <p>
      <strong>Secret</strong><br />
      <span v-if="revealedSecret"><code>{{ revealedSecret }}</code> — copy it now, it won't be shown again.</span>
      <span v-else style="color: #666">Hidden. Rotating shows the new value once.</span>
    </p>
    <button :disabled="rotating" @click="rotateSecret">{{ rotating ? "Rotating..." : "Rotate secret" }}</button>

    <h2>Default webhook URL</h2>
    <p>
      <input v-model="webhookUrl" style="width: 100%; max-width: 420px" placeholder="https://example.com/webhooks/gateway" />
    </p>
    <button :disabled="savingWebhook" @click="saveWebhook">{{ savingWebhook ? "Saving..." : "Save" }}</button>
  </div>
</template>
