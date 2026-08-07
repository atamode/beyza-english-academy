import { test, expect } from '@playwright/test';

test.describe.configure({ retries: 0, timeout: 20_000 });

async function hideLobbyForDevPlay(page) {
  await page.evaluate(() => {
    const lobby = document.querySelector('.poma-lobby');
    if (lobby) lobby.hidden = true;
    document.body.classList.remove('poma-lobby-open');
    window.PomaShiftLobbyActive = false;
  });
}

async function completeCurrentLevel(page) {
  await page.evaluate(() => {
    state.shiftsDone = state.targetShifts;
    checkWin();
  });
}

test('Level 10 first clear promotes Poma Dahi unlock to a one-time shop card', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  await page.goto('/games/poma-shift/?dev=1&browser-smoke=unlock', {
    waitUntil: 'domcontentloaded',
    timeout: 8_000,
  });
  await page.waitForFunction(() => Boolean(window.PomaShiftMeta?.dev?.goto));

  await page.evaluate(() => window.PomaShiftMeta.dev.goto(10));
  await hideLobbyForDevPlay(page);
  await expect(page.locator('#levelValue')).toHaveText('10');

  await completeCurrentLevel(page);
  const win = page.locator('.win-view');
  await expect(win).toBeVisible({ timeout: 3_000 });

  const card = win.locator('.unlock-badge.poma-unlock-card');
  await expect(card).toBeVisible({ timeout: 3_000 });
  await expect(card.locator('.poma-unlock-kicker')).toHaveText('YENİ GÜÇ AÇILDI');
  await expect(card).toContainText('Poma Dahi');
  await expect(card).toContainText('Bilgisayar');

  const shop = card.locator('[data-unlock-shop="computer"]');
  await expect(shop).toHaveText(/MAĞAZADA GÖR/);
  await shop.click();

  const lobby = page.locator('.poma-lobby');
  await expect(lobby).toBeVisible({ timeout: 3_000 });
  const detail = page.locator('.poma-lobby-detail');
  await expect(detail).toBeVisible({ timeout: 3_000 });
  await expect(detail.locator('h2')).toHaveText('Bilgisayar');
  await expect(detail).toContainText('Poma Dahi');
  await expect(detail).toContainText('Stok: ×1');

  await detail.locator('[data-detail-close]').click();
  await page.evaluate(() => window.PomaShiftMeta.dev.goto(10));
  await hideLobbyForDevPlay(page);
  await completeCurrentLevel(page);

  const replayWin = page.locator('.win-view');
  await expect(replayWin).toBeVisible({ timeout: 3_000 });
  await expect(replayWin.locator('.poma-unlock-card')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
