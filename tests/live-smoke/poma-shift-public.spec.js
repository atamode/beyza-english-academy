import { test, expect } from '@playwright/test';

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
