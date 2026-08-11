import { test, expect } from '@playwright/test';

async function openDevGame(page) {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));

  await page.addInitScript(() => {
    try { localStorage.setItem('poma.analytics.consent.v1', 'denied'); } catch {}
  });
  await page.goto('/games/poma-shift/?dev=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.PomaShiftMeta?.dev?.goto));
  await page.waitForTimeout(450);

  return pageErrors;
}

async function hideLobby(page) {
  await page.evaluate(() => {
    const lobby = document.querySelector('.poma-lobby');
    if (lobby) lobby.hidden = true;
    document.body.classList.remove('poma-lobby-open');
    window.PomaShiftLobbyActive = false;
  });
}

test('Poma Shift public page loads core game and meta UI', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error)));

  await page.goto('/games/poma-shift/', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#game')).toBeVisible();
  await expect(page.locator('#levelValue')).toHaveText(/\d+/);
  await expect(page.locator('#moveValue')).toHaveText(/\d+\/\d+/);
  await expect(page.locator('[data-meta-coins]')).toHaveText(/\d+/);
  await expect(page.locator('[data-meta-life-count]')).toContainText('/3');
  await expect(page.locator('.power-dock')).toBeAttached();
  await expect(page.locator('.power-dock')).toBeHidden();

  const spriteResponse = await page.request.get('/assets/brand/poma-academy/poma-shift-character-sprite.webp');
  expect(spriteResponse.ok()).toBe(true);

  expect(pageErrors).toEqual([]);
});

test('Poma Shift live Level 11 uses the locked full-level Rush flow', async ({ page }) => {
  const pageErrors = await openDevGame(page);

  await page.evaluate(() => window.PomaShiftMeta.dev.goto(11));
  await hideLobby(page);

  const intro = page.locator('.rush-intro');
  await expect(intro).toBeVisible();
  await expect(intro.locator('[data-rush-level]')).toHaveText('LEVEL 11');
  await expect(intro.locator('[data-rush-time]')).toContainText('60 saniye');
  await expect(intro.locator('[data-rush-target]')).toContainText('2 SHIFT');
  await expect(intro).toContainText('2 tehlike satırı');

  const timerValue = page.locator('[data-series-time]');
  await expect(timerValue).toHaveText('60s');
  await page.waitForTimeout(700);
  await expect(timerValue).toHaveText('60s');

  await intro.locator('[data-rush-start]').click();
  await expect(intro).toBeHidden();
  await page.waitForTimeout(1200);

  const remaining = Number.parseFloat((await timerValue.textContent()) || '60');
  expect(remaining).toBeLessThan(60);
  expect(pageErrors).toEqual([]);
});

test('Poma Shift live Level 90 starts Sugar Cloud boss runtime', async ({ page }) => {
  const pageErrors = await openDevGame(page);

  await page.evaluate(() => window.PomaShiftMeta.dev.goto(90));
  await hideLobby(page);
  await expect(page.locator('#levelValue')).toHaveText('90');
  await expect(page.locator('.rush-intro')).toBeHidden();

  const picker = page.locator('.loadout-screen');
  await expect(picker).toBeVisible({ timeout: 3000 });
  await picker.locator('[data-picker-start]').click();
  await expect(picker).toBeHidden({ timeout: 3000 });
  await expect(page.locator('.boss-hud')).toBeVisible({ timeout: 3000 });

  await page.waitForFunction(() => window.PomaShiftMeta?.snapshot?.().runtime?.sugarTimer === true);
  await expect.poll(() => page.evaluate(() => (
    window.PomaShiftMetrics?.export?.().filter((event) => event.name === 'sugar_cloud_fill').length || 0
  )), { timeout: 4500 }).toBeGreaterThan(0);

  expect(pageErrors).toEqual([]);
});

test('Poma Shift live generator opens a five-digit level without crashing', async ({ page }) => {
  const pageErrors = await openDevGame(page);

  await page.evaluate(() => window.PomaShiftMeta.dev.goto(10000));

  await expect(page.locator('#levelValue')).toHaveText('10000');
  await expect(page.locator('#moveValue')).toHaveText(/\d+\/\d+/);
  await expect(page.locator('#boardValue')).toHaveText(/\d+×\d+/);
  await expect(page.locator('#game')).toBeVisible();
  expect(pageErrors).toEqual([]);
});
