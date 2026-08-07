import { test, expect } from '@playwright/test';

test.describe.configure({ retries: 0, timeout: 15_000 });

async function openLevelOne(page) {
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

  return { lobby, pageErrors };
}

test('Poma Shift opens lobby and starts Level 1 in Chromium', async ({ page }) => {
  const { pageErrors } = await openLevelOne(page);

  const runtime = await page.evaluate(() => ({
    lobbyActive: Boolean(window.PomaShiftLobbyActive),
    level: typeof state !== 'undefined' ? state.level : null,
    status: typeof state !== 'undefined' ? state.status : null,
  }));

  expect(runtime).toEqual({ lobbyActive: false, level: 1, status: 'playing' });
  expect(pageErrors).toEqual([]);
});

test('win and fail results show exactly one state-aware Poma and map returns to the lobby', async ({ page }) => {
  const { lobby, pageErrors } = await openLevelOne(page);

  await page.evaluate(() => lose('Test fail', 'move_limit'));
  const fail = page.locator('.fail-view');
  await expect(fail).toBeVisible({ timeout: 3_000 });
  await expect(fail.locator(':scope > .poma-result-main')).toHaveCount(1);
  await expect(fail.locator(':scope > .poma-result-avatar, :scope > .poma-result-art')).toHaveCount(1);
  await expect(fail.locator(':scope > .poma-result-main')).toHaveAttribute('src', /poma-sad\.png/);

  await fail.locator('[data-map]').click();
  await expect(lobby).toBeVisible({ timeout: 3_000 });

  await page.locator('[data-lobby-play]').click();
  await expect(lobby).toBeHidden({ timeout: 3_000 });
  await page.evaluate(() => {
    state.shiftsDone = state.targetShifts;
    checkWin();
  });

  const win = page.locator('.win-view');
  await expect(win).toBeVisible({ timeout: 3_000 });
  await expect(win.locator(':scope > .poma-result-main')).toHaveCount(1);
  await expect(win.locator(':scope > .poma-result-avatar, :scope > .poma-result-art')).toHaveCount(1);
  await expect(win.locator(':scope > .poma-result-main')).toHaveAttribute('src', /poma-main-wave\.png/);
  expect(pageErrors).toEqual([]);
});

test('5/5 rewarded continues end in an actionable fail screen instead of a dead state', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pomaShift.prelaunch-clean.v44', '1');
    localStorage.setItem('pomaShift.progress.v1', JSON.stringify({ highestUnlocked: 1, lastLevel: 1 }));
    localStorage.setItem('pomaShift.meta.v1', JSON.stringify({
      lives: 2,
      continueAdsByLevel: { '1': 5 },
    }));
  });

  const { lobby, pageErrors } = await openLevelOne(page);
  await expect.poll(() => page.evaluate(() => state.status)).toBe('playing');

  const seeded = await page.evaluate(() => ({
    lives: window.PomaShiftMeta?.snapshot?.()?.meta?.lives,
    continues: window.PomaShiftMeta?.snapshot?.()?.meta?.continueAdsByLevel?.['1'],
  }));
  expect(seeded).toEqual({ lives: 2, continues: 5 });

  await page.evaluate(() => lose('Test terminal fail', 'move_limit'));
  let fail = page.locator('.fail-view');
  await expect(fail).toBeVisible({ timeout: 3_000 });
  await expect(fail.locator('[data-meta-continue]')).toHaveCount(0);
  await expect(fail.locator('[data-terminal-continue-note]')).toContainText('5/5 reklam devamı kullanıldı');
  await expect(fail.locator('[data-retry]')).toBeEnabled();
  await expect(fail.locator('[data-map]')).toBeEnabled();

  await fail.locator('[data-retry]').click();
  await expect(fail).toBeHidden({ timeout: 3_000 });
  await expect.poll(() => page.evaluate(() => state.status)).toBe('playing');

  await page.evaluate(() => lose('Test terminal fail again', 'move_limit'));
  fail = page.locator('.fail-view');
  await expect(fail).toBeVisible({ timeout: 3_000 });
  await expect(fail.locator('[data-retry]')).toBeEnabled();
  await expect(fail.locator('[data-map]')).toBeEnabled();
  await fail.locator('[data-map]').click();
  await expect(lobby).toBeVisible({ timeout: 3_000 });
  expect(pageErrors).toEqual([]);
});
