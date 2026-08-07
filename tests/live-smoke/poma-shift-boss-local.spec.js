import { test, expect } from '@playwright/test';

test.describe.configure({ retries: 0, timeout: 28_000 });

async function openDevGame(page, suffix) {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  await page.goto(`/games/poma-shift/?dev=1&browser-smoke=${suffix}`, {
    waitUntil: 'domcontentloaded',
    timeout: 8_000,
  });
  await page.waitForFunction(() => Boolean(window.PomaShiftMeta?.dev?.goto));
  // mobile-release-v2 has a one-time 350 ms boot preparation callback. A human
  // cannot reach Level 90 before it settles, so smoke tests must not race it.
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

test('living lobby Level 90 boss node starts Sugar Cloud through the existing three-slot loadout', async ({ page }) => {
  test.setTimeout(32_000);
  const pageErrors = await openDevGame(page, 'boss-lobby');

  await page.evaluate(() => {
    window.PomaShiftMeta.dev.unlockThrough(90);
    window.PomaShiftLobby.open({ animate: false });
  });

  const lobby = page.locator('.poma-lobby');
  await expect(lobby).toBeVisible({ timeout: 3_000 });
  await expect(lobby.locator('.poma-lobby-slot')).toHaveCount(3);

  const bossNode = lobby.locator('.poma-map-node[data-lobby-level="90"]');
  await expect(bossNode).toBeVisible({ timeout: 3_000 });
  await expect(bossNode.locator('.sugar-cloud-map-art.poma-lobby-sugar-cloud')).toHaveCount(1);
  await expect(bossNode.locator('.poma-boss-node-label')).toHaveText('BOSS');
  await expect(bossNode.locator('.poma-boss-cloud')).toHaveCount(0);

  // The active map node intentionally bounces forever. Native DOM click tests the
  // same selection handler without asking Playwright to wait for visual stability.
  await bossNode.evaluate((node) => node.click());
  await expect(page.locator('[data-lobby-play-level]')).toHaveText('90');
  await page.locator('[data-lobby-play]').click();

  await expect(lobby).toBeHidden({ timeout: 3_000 });
  await expect.poll(() => page.evaluate(() => ({ level: state.level, status: state.status }))).toEqual({ level: 90, status: 'playing' });
  await expect(page.locator('.loadout-screen')).toBeHidden({ timeout: 3_000 });

  const bossHud = page.locator('.boss-hud');
  await expect(bossHud).toBeVisible({ timeout: 3_000 });
  await expect(bossHud).toContainText('Yapışkan Şeker Bulutu');
  await expect(bossHud.locator('.boss-hud-icon img')).toHaveAttribute('src', /sugar-cloud\.png/);
  await expect(bossHud.locator('.boss-hud-timer')).toContainText('3 sn');

  await expect.poll(() => page.evaluate(() => (
    window.PomaShiftMetrics?.export?.().filter((event) => event.name === 'sugar_cloud_fill').length || 0
  )), { timeout: 4_500 }).toBeGreaterThan(0);

  await page.evaluate(() => {
    state.shiftsDone = state.targetShifts;
    checkWin();
  });

  const win = page.locator('.win-view');
  await expect(win).toBeVisible({ timeout: 3_000 });
  await expect(win.locator(':scope > .poma-result-main')).toHaveCount(1);
  await expect(win.locator('.boss-result-opponent.is-defeated')).toHaveCount(1);
  await expect(win.locator('.boss-result-opponent')).toContainText('Şeker Bulutu dağıldı!');
  await expect(win.locator('.boss-result-opponent-art')).toHaveAttribute('src', /sugar-cloud\.png/);
  await expect(win.locator(':scope > .sugar-cloud-result-art')).toHaveCount(0);
  await expect(win.locator('.boss-complete-badge')).toHaveCount(0);

  await win.locator('[data-map]').click();
  await expect(lobby).toBeVisible({ timeout: 3_000 });
  expect(pageErrors).toEqual([]);
});

test('Level 90 preparation identifies the boss and fail result keeps one sad Poma plus compact opponent state', async ({ page }) => {
  const pageErrors = await openDevGame(page, 'boss-fail');

  await page.evaluate(() => window.PomaShiftMeta.dev.goto(90));
  await hideLobby(page);

  const picker = page.locator('.loadout-screen');
  await expect(picker).toBeVisible({ timeout: 3_000 });
  const prep = picker.locator('.loadout-card.is-boss');
  await expect(prep.locator('.boss-prep-identity')).toBeVisible({ timeout: 2_000 });
  await expect(prep.locator('.boss-prep-identity')).toContainText('LEVEL 90 · İLK BOSS');
  await expect(prep.locator('.boss-prep-identity')).toContainText('Yapışkan Şeker Bulutu');
  await expect(prep.locator('.boss-prep-art')).toHaveAttribute('src', /sugar-cloud\.png/);
  await expect(prep.locator('.loadout-picker-slot')).toHaveCount(3);

  await prep.locator('[data-picker-start]').click();
  await expect(picker).toBeHidden({ timeout: 2_000 });
  await expect(page.locator('.boss-hud')).toBeVisible({ timeout: 2_000 });

  await page.evaluate(() => lose('Test boss fail', 'sugar_full'));
  const fail = page.locator('.fail-view');
  await expect(fail).toBeVisible({ timeout: 3_000 });
  await expect(fail.locator(':scope > .poma-result-main')).toHaveCount(1);
  await expect(fail.locator(':scope > .poma-result-main')).toHaveAttribute('src', /poma-sad\.png/);
  await expect(fail.locator('.boss-result-opponent.is-standing')).toHaveCount(1);
  await expect(fail.locator('.boss-result-opponent')).toContainText('Şeker Bulutu hâlâ burada');
  await expect(fail.locator(':scope > .sugar-cloud-result-art')).toHaveCount(0);

  await fail.locator('[data-map]').click();
  await expect(page.locator('.poma-lobby')).toBeVisible({ timeout: 3_000 });
  expect(pageErrors).toEqual([]);
});
