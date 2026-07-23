import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/live-smoke",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://academy.pomante.com.tr",
    serviceWorkers: "block",
    trace: "first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } }
  ]
});
