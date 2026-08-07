import { test, expect } from '@playwright/test';

const firstHalf = [
  'mobile-layout.js','game-feel.js','rush-disable.js','product-ui.js','win-reveal.js',
  'threat-system.js','timer-heartbeat.js','poma-brand.js','meta-system.js',
];
const secondA = [
  'character-progression-v2.js','character-art.js','launch-polish.js','boss-ui.js',
  'timed-level-guard.js','analytics-bridge.js','dev-panel.js','combo-system.js',
];
const secondB = [
  'rush-mode.js','rush-continue.js','rush-runtime-guard.js','ui-hotfix.js','audio-mix.js',
  'fire-compat.js','mobile-release-v2.js',
];

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

test('diagnostic E: first half + secondA', async ({ page }) => {
  await abortScripts(page, secondB);
  await expectBoot(page);
});

test('diagnostic F: first half + secondB', async ({ page }) => {
  await abortScripts(page, secondA);
  await expectBoot(page);
});
