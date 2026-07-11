export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  runtimeConfig: {
    acquirerUrl: process.env.ACQUIRER_URL || "http://localhost:4102",
    public: {
      gatewayUrl: process.env.GATEWAY_URL || "http://localhost:4101",
    },
  },
});
