import { test, expect } from '@playwright/test';

test.describe.configure({ retries: 0, timeout: 32_000 });

async function openDevGame(page, suffix) {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  await page.goto(`/games/poma-shift/?dev=1&browser-smoke=${suffix}`, {
    waitUntil: 'domcontentloaded',
    timeout: 8_000,
  });
  await page.waitForFunction(() => Boolean(window.PomaShiftMeta?.dev?.goto));
  // Let one-time boot callbacks finish before jumping dozens of levels in dev mode.
  await page.waitForTimeout(450);
  return pageErrors;
}

async function settlePreparation(page, level) {
  await page.waitForTimeout(160);

  const intro = page.locator('.rush-intro');
  if (await intro.isVisible().catch(() => false)) {
    if (level === 70) {
      await expect(intro.locator('[data-rush-milestone]')).toContainText('Fire Poma');
      await expect(intro.locator('[data-rush-milestone]')).toContainText('Alev Dalgası');
      await expect(intro.locator('[data-rush-milestone]')).not.toContainText('Dede Poma');
    }
    if (level === 80) {
      await expect(intro.locator('[data-rush-milestone]')).toContainText('PomaHero');
      await expect(intro.locator('[data-rush-milestone]')).toContainText('Sihirli Yaprak');
      await expect(intro.locator('[data-rush-milestone]')).not.toContainText('Hero Poma');
    }
    await intro.locator('[data-rush-start]').click();
    await expect(intro).toBeHidden({ timeout: 3_000 });
  }

  const picker = page.locator('.loadout-screen');
  if (await picker.isVisible().catch(() => false)) {
    await picker.locator('[data-picker-start]').click();
    await expect(picker).toBeHidden({ timeout: 3_000 });
  }

  await page.waitForTimeout(120);
}

async function enterDevLevel(page, level) {
  await page.evaluate((target) => {
    window.PomaShiftMeta.dev.goto(target);
    const lobby = document.querySelector('.poma-lobby');
    if (lobby) lobby.hidden = true;
    document.body.classList.remove('poma-lobby-open');
    window.PomaShiftLobbyActive = false;
  }, level);

  await settlePreparation(page, level);
  await expect.poll(() => page.evaluate(() => ({ status: state.status, level: state.level })), { timeout: 3_000 })
    .toEqual({ status: 'playing', level });
}

async function completeCurrentLevel(page) {
  await page.evaluate(() => {
    state.shiftsDone = state.targetShifts;
    checkWin();
  });
  await expect(page.locator('.win-view')).toBeVisible({ timeout: 3_000 });
}

async function unlockPowerAndOpenLobbyDetail(page, level, id, powerName, characterName) {
  await enterDevLevel(page, level);
  await completeCurrentLevel(page);

  const win = page.locator('.win-view');
  const card = win.locator('.unlock-badge.poma-unlock-card');
  await expect(card).toBeVisible({ timeout: 3_000 });
  await expect(card).toContainText('YENİ GÜÇ AÇILDI');
  await expect(card).toContainText(characterName);
  await expect(card).toContainText(powerName);

  await card.locator(`[data-unlock-shop="${id}"]`).click();

  const lobby = page.locator('.poma-lobby');
  await expect(lobby).toBeVisible({ timeout: 3_000 });
  const detail = page.locator('.poma-lobby-detail');
  await expect(detail).toBeVisible({ timeout: 3_000 });
  await expect(detail.locator('h2')).toHaveText(powerName);
  await expect(detail).toContainText(characterName);
  await expect(detail).toContainText('Stok: ×1', { timeout: 3_000 });
  await expect(detail.locator(`.poma-character-portrait.char-${id === 'firewave' ? 'fire' : 'hero'}`)).toHaveCount(1);

  await detail.locator(`[data-detail-slot="${id}"]`).click();
  await expect(detail.locator(`[data-detail-slot="${id}"]`)).toHaveText('SLOTTAN ÇIKAR');
  await detail.locator('button.poma-detail-close[data-detail-close]').click();

  await page.locator('[data-lobby-play]').click();
  await expect(lobby).toBeHidden({ timeout: 4_000 });
  await expect.poll(() => page.evaluate(() => ({ status: state.status, level: state.level })), { timeout: 4_000 })
    .toEqual({ status: 'playing', level: level + 1 });

  // Lobby play synchronizes and auto-commits the selected three slots. Give its
  // 110 ms bridge time to finish and verify no stale preparation overlay remains.
  await page.waitForTimeout(220);
  await expect(page.locator('.loadout-screen')).toBeHidden({ timeout: 3_000 });
  await expect(page.locator('.rush-intro')).toBeHidden({ timeout: 3_000 });

  const firstSlot = page.locator('.battle-loadout [data-loadout-slot="0"]');
  await expect(firstSlot).toContainText(powerName);
  return firstSlot;
}

test('Level 70 unlocks Fire Poma and Alev Dalgası burns exactly the first two board rows', async ({ page }) => {
  const pageErrors = await openDevGame(page, 'fire-runtime');
  const fireSlot = await unlockPowerAndOpenLobbyDetail(page, 70, 'firewave', 'Alev Dalgası', 'Fire Poma');

  await expect.poll(() => page.evaluate(() => window.PomaShiftFirePower?.quantity?.() || 0), { timeout: 3_000 }).toBe(1);

  await page.evaluate(() => {
    state.grid.forEach((row) => row.fill(null));
    state.grid[0][0] = '#ff6b4a';
    state.grid[1][Math.min(1, state.grid[1].length - 1)] = '#ffb000';
    state.grid[2][0] = '#6fcf97';
    render();
  });

  await fireSlot.click();
  await expect(page.locator('.fire-wave-overlay')).toBeVisible({ timeout: 1_500 });
  await expect.poll(() => page.evaluate(() => ({
    topTwoClear: state.grid.slice(0, 2).every((row) => row.every((cell) => !cell)),
    thirdRowPreserved: Boolean(state.grid[2][0]),
    quantity: window.PomaShiftFirePower?.quantity?.() || 0,
  })), { timeout: 2_500 }).toEqual({ topTwoClear: true, thirdRowPreserved: true, quantity: 0 });

  expect(pageErrors).toEqual([]);
});

test('Level 80 unlocks PomaHero and Sihirli Yaprak clears the entire board', async ({ page }) => {
  const pageErrors = await openDevGame(page, 'leaf-runtime');
  const leafSlot = await unlockPowerAndOpenLobbyDetail(page, 80, 'leaf', 'Sihirli Yaprak', 'PomaHero');

  await expect.poll(() => page.evaluate(() => window.PomaShiftMeta.snapshot().meta.inventory.leaf || 0), { timeout: 3_000 }).toBe(1);

  await page.evaluate(() => {
    state.grid.forEach((row) => row.fill(null));
    state.grid[0][0] = '#ff6b4a';
    state.grid[Math.min(2, state.grid.length - 1)][0] = '#6fcf97';
    state.grid[state.grid.length - 1][state.grid[state.grid.length - 1].length - 1] = '#58b8ff';
    render();
  });

  await leafSlot.click();
  await expect.poll(() => page.evaluate(() => ({
    boardClear: state.grid.every((row) => row.every((cell) => !cell)),
    quantity: window.PomaShiftMeta.snapshot().meta.inventory.leaf || 0,
    message: document.getElementById('message')?.textContent || '',
  })), { timeout: 2_000 }).toEqual({
    boardClear: true,
    quantity: 0,
    message: 'Sihirli Yaprak bütün boardu temizledi.',
  });

  expect(pageErrors).toEqual([]);
});
