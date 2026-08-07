import { test, expect } from '@playwright/test';

test.describe.configure({ retries: 0, timeout: 15_000 });

test('Poma Shift opens lobby and starts Level 1 in Chromium', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  await page.goto('/games/poma-shift/?browser-smoke=1', {
    waitUntil: 'domcontentloaded',
    timeout: 8_000,
  });

  const lobby = page.locator('.poma-lobby');
  await expect(lobby).toBeVisible({ timeout: 3_000 });
  await expect(page.locator('[data-lobby-play-level]')).toHaveText('1');
  await expect(page.locator('[data-lobby-play]')).toBeEnabled();

  await page.locator('[data-lobby-play]').click();
  await expect(lobby).toBeHidden({ timeout: 3_000 });
  await expect(page.locator('#levelValue')).toHaveText('1');
  await expect(page.locator('#game')).toBeVisible();

  const runtime = await page.evaluate(() => ({
    lobbyActive: Boolean(window.PomaShiftLobbyActive),
    level: typeof state !== 'undefined' ? state.level : null,
    status: typeof state !== 'undefined' ? state.status : null,
  }));

  expect(runtime).toEqual({ lobbyActive: false, level: 1, status: 'playing' });
  expect(pageErrors).toEqual([]);
});
