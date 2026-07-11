export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["nuxt-auth-utils"],
  runtimeConfig: {
    public: {
      gatewayUrl: process.env.GATEWAY_URL || "http://localhost:4101",
      portalUrl: process.env.PORTAL_URL || "http://localhost:4103",
    },
  },
});
