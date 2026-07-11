<script setup lang="ts">
defineProps<{ role: string; name?: string; email?: string }>();
</script>

<template>
  <p class="owner-note">
    <span class="owner-note-dot" aria-hidden="true" />
    <span class="owner-note-role">{{ role }}</span>
    <template v-if="name || email">
      <span v-if="name">{{ name }}</span>
      <span v-if="email" class="owner-note-email">({{ email }})</span>
    </template>
  </p>
</template>

<style scoped>
.owner-note {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: #8a8a8a;
  margin: 0;
  white-space: nowrap;
}
.owner-note-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9ca3af;
  flex-shrink: 0;
}
.owner-note-role {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.68rem;
  color: #a0a0a0;
}
.owner-note-email {
  color: #a0a0a0;
}
</style>
