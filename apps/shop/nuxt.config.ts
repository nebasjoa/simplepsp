export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  runtimeConfig: {
    gatewayApiKey: process.env.GATEWAY_API_KEY || "pk_demo",
    gatewayApiSecret: process.env.GATEWAY_API_SECRET || "sk_demo_secret",
    public: {
      gatewayUrl: process.env.GATEWAY_URL || "http://localhost:4101",
      shopUrl: process.env.SHOP_URL || "http://localhost:4100",
      // The API key is a public identifier (sent as X-Api-Key), safe to expose - it's the
      // secret, never put here, that actually authenticates requests.
      gatewayApiKey: process.env.GATEWAY_API_KEY || "pk_demo",
    },
  },
});
