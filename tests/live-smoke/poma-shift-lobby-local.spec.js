import { test, expect } from '@playwright/test';

const enhancements = [
  'mobile-layout.js','game-feel.js','rush-disable.js','product-ui.js','win-reveal.js',
  'threat-system.js','timer-heartbeat.js','poma-brand.js','meta-system.js',
  'character-progression-v2.js','character-art.js','launch-polish.js','boss-ui.js',
  'timed-level-guard.js','analytics-bridge.js','dev-panel.js','combo-system.js',
  'rush-mode.js','rush-continue.js','rush-runtime-guard.js','ui-hotfix.js','audio-mix.js',
  'fire-compat.js','mobile-release-v2.js',
];
const firstHalf = enhancements.slice(0, 9);
const secondHalf = enhancements.slice(9);

async function abortScripts(page, names) {
  await page.route('**/*.js*', async (route) => {
    const url = route.request().url();
    if (names.some((name) => url.includes(`/${name}`))) return route.abort();
    return route.continue();
  });
}

async function expectBoot(page) {
  await page.goto('/games/poma-shift/?browser-smoke=1', {
    waitUntil: 'domcontentloaded',
    timeout: 5_000,
  });
  await expect(page.locator('.poma-lobby')).toBeVisible({ timeout: 2_000 });
}

test.describe.configure({ retries: 0, timeout: 8_000 });

test('diagnostic A: core + lobby only boots', async ({ page }) => {
  await abortScripts(page, enhancements);
  await expectBoot(page);
});

test('diagnostic B: first enhancement half boots when second half blocked', async ({ page }) => {
  await abortScripts(page, secondHalf);
  await expectBoot(page);
});

test('diagnostic C: second enhancement half boots when first half blocked', async ({ page }) => {
  await abortScripts(page, firstHalf);
  await expectBoot(page);
});

test('diagnostic D: full Poma Shift boots', async ({ page }) => {
  await expectBoot(page);
});
