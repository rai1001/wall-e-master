import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry"
  },
  webServer: {
    command: "pnpm --filter @clawos/web dev",
    port: 3100,
    reuseExistingServer: false,
    timeout: 120_000
  }
});
