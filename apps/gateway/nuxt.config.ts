export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  runtimeConfig: {
    acquirerUrl: process.env.ACQUIRER_URL || "http://localhost:4102",
    internalAdminSecret: process.env.INTERNAL_ADMIN_SECRET || "",
    public: {
      gatewayUrl: process.env.GATEWAY_URL || "http://localhost:4101",
    },
  },
});
