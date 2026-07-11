<script setup lang="ts">
defineProps<{ text: string }>();
</script>

<template>
  <span class="info-tip" tabindex="0">
    <span class="info-tip-icon" aria-hidden="true">i</span>
    <span class="info-tip-bubble" role="tooltip">{{ text }}</span>
  </span>
</template>

<style scoped>
.info-tip {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  margin-left: 0.35rem;
  border-radius: 50%;
  background: #e5e7eb;
  color: #555;
  font-size: 0.72rem;
  font-style: italic;
  font-family: Georgia, serif;
  line-height: 1;
  cursor: help;
  vertical-align: middle;
  outline: none;
}
.info-tip:hover,
.info-tip:focus {
  background: #cbd5e1;
}
.info-tip-bubble {
  display: none;
  position: absolute;
  bottom: 130%;
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: #fff;
  padding: 0.5rem 0.65rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-style: normal;
  font-weight: normal;
  line-height: 1.35;
  width: max-content;
  max-width: 260px;
  z-index: 20;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
}
.info-tip:hover .info-tip-bubble,
.info-tip:focus .info-tip-bubble {
  display: block;
}
</style>
