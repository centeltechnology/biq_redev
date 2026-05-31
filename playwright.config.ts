import { defineConfig } from "@playwright/test";

const chromiumPath = process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5000",
    storageState: "./e2e/.auth/state.json",
    launchOptions: chromiumPath ? { executablePath: chromiumPath } : {},
    trace: "off",
  },
  projects: [{ name: "chromium" }],
});
