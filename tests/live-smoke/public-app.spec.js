import { test, expect } from "@playwright/test";

const HOME_HEADING = "Ücretsiz hesabınızı oluşturun.";

function monitorPublicPage(page) {
  const pageErrors = [];
  const failedCriticalResources = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("response", response => {
    const request = response.request();
    const resourceType = request.resourceType();
    const sameOrigin = new URL(response.url()).origin === new URL(page.url()).origin;
    if (sameOrigin && ["document", "script", "stylesheet"].includes(resourceType) && response.status() >= 400) {
      failedCriticalResources.push(`${response.status()} ${resourceType} ${response.url()}`);
    }
  });
  return { pageErrors, failedCriticalResources };
}

async function isolateBlockedServiceWorker(page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: undefined });
  });
}

async function expectPublicHome(page) {
  const response = await page.goto("/");
  expect(response).not.toBeNull();
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(400);
  await expect(page).toHaveTitle(/\S/);
  await expect(page.locator("#app")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: HOME_HEADING })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Ücretsiz Başla" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Hesap bilgileri yükleniyor..." })).toHaveCount(0);
}

test("public home and login UI stay available without mutations", async ({ page }) => {
  await isolateBlockedServiceWorker(page);
  const evidence = monitorPublicPage(page);
  await expectPublicHome(page);

  await page.goto("/#/login");
  const form = page.locator('form[data-account-form="login"]');
  await expect(form).toBeVisible();
  await expect(form.locator('input[type="email"]')).toBeVisible();
  await expect(form.locator('input[type="password"]')).toBeVisible();
  await expect(form.getByRole("button", { name: "Giriş yap" })).toBeVisible();

  expect(evidence.pageErrors).toEqual([]);
  expect(evidence.failedCriticalResources).toEqual([]);
});

test("public home fits a 390 by 844 mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await isolateBlockedServiceWorker(page);
  const evidence = monitorPublicPage(page);
  await expectPublicHome(page);
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(392);
  expect(evidence.pageErrors).toEqual([]);
  expect(evidence.failedCriticalResources).toEqual([]);
});
