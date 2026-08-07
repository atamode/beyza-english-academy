import { test, expect } from '@playwright/test';

test('Poma Shift boots to lobby and Level 1 opens', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  await page.goto('http://127.0.0.1:8765/games/poma-shift/?browser-smoke=1', {
    waitUntil: 'domcontentloaded',
    timeout: 10_000,
  });

  const lobby = page.locator('.poma-lobby');
  await expect(lobby).toBeVisible({ timeout: 5_000 });
  await expect(page.locator('[data-lobby-play-level]')).toHaveText('1');

  await page.locator('[data-lobby-play]').click();
  await expect(lobby).toBeHidden({ timeout: 5_000 });
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
