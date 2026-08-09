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

async function openRushLevelEleven(page) {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  await page.goto('/games/poma-shift/?dev=1&browser-smoke=rush', {
    waitUntil: 'domcontentloaded',
    timeout: 8_000,
  });
  await page.waitForFunction(() => Boolean(window.PomaShiftMeta?.dev?.goto));
  await page.evaluate(() => {
    window.PomaShiftMeta.dev.goto(11);
    const lobby = document.querySelector('.poma-lobby');
    if (lobby) lobby.hidden = true;
    document.body.classList.remove('poma-lobby-open');
    window.PomaShiftLobbyActive = false;
  });

  const intro = page.locator('.rush-intro');
  await expect(intro).toBeVisible({ timeout: 3_000 });
  await expect(intro.locator('[data-rush-level]')).toHaveText('LEVEL 11');
  await intro.locator('[data-rush-start]').click();
  await expect(intro).toBeHidden({ timeout: 3_000 });
  await expect.poll(() => page.evaluate(() => state.status)).toBe('playing');

  return { lobby: page.locator('.poma-lobby'), pageErrors };
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

test('QA preview opens Levels 1–90 without permanently changing normal progress', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  await page.goto('/games/poma-shift/?qa=1&browser-smoke=qa', {
    waitUntil: 'domcontentloaded',
    timeout: 8_000,
  });
  await page.waitForFunction(() => Boolean(window.PomaShiftQAPreview?.active));

  const lobby = page.locator('.poma-lobby');
  await expect(lobby).toBeVisible({ timeout: 3_000 });
  await expect(page.locator('.poma-qa-badge')).toContainText('LEVEL 1–90 AÇIK');

  const level90 = page.locator('[data-lobby-level="90"]');
  await expect(level90).toBeVisible();
  await expect(level90).not.toHaveClass(/locked/);
  await expect(level90.locator(':scope > span')).toHaveText('90');
  await level90.click();
  await expect(page.locator('[data-lobby-play-level]')).toHaveText('90');
  await page.locator('[data-lobby-play]').click();
  await expect(lobby).toBeHidden({ timeout: 3_000 });
  await expect(page.locator('#levelValue')).toHaveText('90');

  await page.goto('/games/poma-shift/?browser-smoke=qa-restored', {
    waitUntil: 'domcontentloaded',
    timeout: 8_000,
  });
  await expect(page.locator('.poma-lobby')).toBeVisible({ timeout: 3_000 });
  await expect(page.locator('[data-lobby-play-level]')).toHaveText('1');
  expect(pageErrors).toEqual([]);
});

test('first visit exposes a ready welcome gift and then returns to the 12-hour cadence', async ({ page }) => {
  const { pageErrors } = await openLevelOne(page);

  const giftTimer = page.locator('[data-meta-gift-timer]');
  await expect(giftTimer).toHaveText('HAZIR', { timeout: 3_000 });
  await page.locator('[data-meta-gift]').click();

  const modal = page.locator('.meta-modal');
  await expect(modal).toBeVisible({ timeout: 3_000 });
  await expect(modal).toContainText('+100');

  const stateAfterClaim = await page.evaluate(() => {
    const snapshot = window.PomaShiftMeta?.snapshot?.()?.meta || {};
    return {
      coins: Number(snapshot.coins || 0),
      giftReadyAt: Number(snapshot.returnGiftReadyAt || 0),
      now: Date.now(),
    };
  });
  expect(stateAfterClaim.coins).toBeGreaterThanOrEqual(100);
  expect(stateAfterClaim.giftReadyAt).toBeGreaterThan(stateAfterClaim.now);
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

test('Sugar Cloud collision is terminal and cannot be revived by a rewarded move continue', async ({ page }) => {
  const { pageErrors } = await openLevelOne(page);

  await page.evaluate(() => lose('Şeker Bulutu bloklara ulaştı.', 'cloud_crush'));
  const fail = page.locator('.fail-view');
  await expect(fail).toBeVisible({ timeout: 3_000 });
  await expect(fail.locator('button[data-meta-continue]')).toHaveCount(0);
  await expect(fail.locator('[data-terminal-cloud-note]')).toContainText('ek hamle kullanılamaz');
  await page.waitForTimeout(500);
  await expect.poll(() => page.evaluate(() => state.status)).toBe('lost');
  await expect(fail.locator('button[data-meta-continue]')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test('5/5 rewarded continues end in an actionable fail screen instead of a dead state', async ({ page }) => {
  test.setTimeout(30_000);
  const { lobby, pageErrors } = await openLevelOne(page);

  for (let index = 0; index < 5; index += 1) {
    await expect.poll(() => page.evaluate(() => state.status)).toBe('playing');
    await page.evaluate((attempt) => lose(`Test continue fail ${attempt}`, 'move_limit'), index + 1);

    const fail = page.locator('.fail-view');
    await expect(fail).toBeVisible({ timeout: 3_000 });
    const continueButton = fail.locator('button[data-meta-continue]');
    await expect(continueButton).toBeVisible({ timeout: 2_000 });
    await continueButton.click();

    await expect.poll(() => page.evaluate(() => state.status), { timeout: 3_000 }).toBe('playing');
    await expect(fail).toBeHidden({ timeout: 3_000 });

    const used = await page.evaluate(() => (
      Number(window.PomaShiftMeta?.snapshot?.()?.meta?.continueAdsByLevel?.['1'] || 0)
    ));
    expect(used).toBe(index + 1);
  }

  await page.evaluate(() => lose('Test terminal fail', 'move_limit'));
  let fail = page.locator('.fail-view');
  await expect(fail).toBeVisible({ timeout: 3_000 });
  await expect(fail.locator('button[data-meta-continue]')).toHaveCount(0);
  await expect(fail.locator('[data-terminal-continue-note]')).toContainText('5/5 reklam devamı kullanıldı');
  await expect(fail.locator('[data-retry]')).toBeEnabled();
  await expect(fail.locator('[data-map]')).toBeEnabled();

  const lifeAfterContinuedAttempt = await page.evaluate(() => (
    Number(window.PomaShiftMeta?.snapshot?.()?.meta?.lives)
  ));
  expect(lifeAfterContinuedAttempt).toBe(2);

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

test('Level 11 Rush survives five rewarded continues and terminates without duplicate notes or freeze', async ({ page }) => {
  test.setTimeout(35_000);
  const { lobby, pageErrors } = await openRushLevelEleven(page);

  for (let index = 0; index < 5; index += 1) {
    await page.evaluate((attempt) => lose(`Test RUSH continue fail ${attempt}`, 'move_limit'), index + 1);
    const fail = page.locator('.fail-view');
    await expect(fail).toBeVisible({ timeout: 3_000 });

    const continueButton = fail.locator('button[data-meta-continue]');
    await expect(continueButton).toBeVisible({ timeout: 2_000 });
    await expect(continueButton).toContainText('+10 sn');
    await continueButton.click();

    await expect.poll(() => page.evaluate(() => state.status), { timeout: 3_000 }).toBe('playing');
    await expect(fail).toBeHidden({ timeout: 3_000 });
    const used = await page.evaluate(() => (
      Number(window.PomaShiftMeta?.snapshot?.()?.meta?.continueAdsByLevel?.['11'] || 0)
    ));
    expect(used).toBe(index + 1);
  }

  await page.evaluate(() => lose('Test RUSH terminal fail', 'move_limit'));
  const fail = page.locator('.fail-view');
  await expect(fail).toBeVisible({ timeout: 3_000 });
  await expect(fail.locator('button[data-meta-continue]')).toHaveCount(0);
  await expect(fail.locator('[data-terminal-continue-note]')).toHaveCount(1);
  await expect(fail.locator('[data-terminal-continue-note]')).toContainText('5/5 reklam devamı kullanıldı');
  await expect(fail.locator('[data-rush-continue-limit]')).toHaveCount(0);
  await expect(fail.locator('[data-retry]')).toBeEnabled();
  await expect(fail.locator('[data-map]')).toBeEnabled();

  await fail.locator('[data-map]').click();
  await expect(lobby).toBeVisible({ timeout: 3_000 });
  expect(pageErrors).toEqual([]);
});

test('leaving Rush for Level 13 cannot leave a stale Rush overlay or timer behind', async ({ page }) => {
  const { pageErrors } = await openRushLevelEleven(page);

  await page.evaluate(() => setupLevel(13));
  await expect.poll(() => page.evaluate(() => state.level)).toBe(13);
  await expect.poll(() => page.evaluate(() => state.status)).toBe('playing');
  await page.waitForTimeout(350);

  await expect(page.locator('.rush-intro')).toBeHidden();
  await expect(page.locator('.series-timer-copy span')).toHaveText('SERİ');
  await expect(page.locator('[data-series-time]')).toHaveText('SERBEST');
  expect(pageErrors).toEqual([]);
});