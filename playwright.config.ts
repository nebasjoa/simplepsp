import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:4100",
  },
  webServer: [
    {
      command: "corepack pnpm --filter @simplepsp/acquirer dev",
      port: 4102,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "corepack pnpm --filter @simplepsp/gateway dev",
      port: 4101,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "corepack pnpm --filter @simplepsp/shop dev",
      port: 4100,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "corepack pnpm --filter @simplepsp/portal dev",
      port: 4103,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
