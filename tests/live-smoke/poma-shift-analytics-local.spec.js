import { test, expect } from '@playwright/test';

test.describe.configure({ retries: 0, timeout: 24_000 });

async function useTestingAnalytics(page, consent) {
  await page.addInitScript(({ consentValue }) => {
    window.PomaShiftAnalyticsConfig = { measurementId: 'G-TESTPOMASHIFT', testing: true };
    if (consentValue) localStorage.setItem('poma.analytics.consent.v1', consentValue);
    else localStorage.removeItem('poma.analytics.consent.v1');
  }, { consentValue: consent });
}

function remoteEvents(page) {
  return page.evaluate(() => (window.dataLayer || [])
    .map((entry) => Array.from(entry))
    .filter((entry) => entry[0] === 'event')
    .map((entry) => ({ name: entry[1], params: entry[2] || {} })));
}

test('analytics consent is reversible and denied users keep local telemetry without remote events', async ({ page }) => {
  await useTestingAnalytics(page, null);
  await page.goto('/games/poma-shift/?dev=1&browser-smoke=analytics-consent', {
    waitUntil: 'domcontentloaded',
    timeout: 8_000,
  });
  await page.waitForFunction(() => Boolean(window.PomaShiftAnalytics && window.PomaShiftAnalyticsBridge));

  const panel = page.locator('[data-poma-shift-analytics-consent]');
  await expect(panel).toBeVisible({ timeout: 2_000 });
  await expect(panel).toContainText('Google Analytics');
  await expect(page.locator('[data-poma-shift-analytics-settings]')).toBeVisible({ timeout: 2_000 });

  await panel.locator('[data-choice="denied"]').click();
  await expect(panel).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.PomaShiftAnalytics.status().consent)).toBe('denied');
  await expect(page.locator('script[data-poma-shift-ga4]')).toHaveCount(0);

  const before = await page.evaluate(() => window.PomaShiftMetrics.export().length);
  await page.evaluate(() => metric('level_fail', { reason: 'analytics_denied_test' }));
  const after = await page.evaluate(() => window.PomaShiftMetrics.export().length);
  expect(after).toBe(before + 1);
  expect((await remoteEvents(page)).some((event) => event.name === 'ps_level_fail')).toBe(false);

  await page.locator('[data-poma-shift-analytics-settings]').click();
  await expect(panel).toBeVisible({ timeout: 2_000 });
  await panel.locator('[data-choice="granted"]').click();
  await expect.poll(() => page.evaluate(() => window.PomaShiftAnalytics.status().consent)).toBe('granted');
  await expect.poll(() => page.evaluate(() => window.PomaShiftAnalytics.status().tagReady)).toBe(true);
  await expect(page.locator('script[data-poma-shift-ga4]')).toHaveCount(0);
  await expect(page.locator('[data-poma-shift-analytics-settings]')).toContainText('✓');
});

test('granted analytics sends only whitelisted ps events with the live lexical level', async ({ page }) => {
  await useTestingAnalytics(page, 'granted');
  await page.goto('/games/poma-shift/?dev=1&browser-smoke=analytics-events', {
    waitUntil: 'domcontentloaded',
    timeout: 8_000,
  });
  await page.waitForFunction(() => Boolean(window.PomaShiftAnalytics && window.PomaShiftMeta?.dev?.goto));

  await page.evaluate(() => {
    window.PomaShiftMeta.dev.goto(70);
    metric('level_fail', {
      reason: 'analytics_level_test',
      secret_field: 'must_not_leave_device',
    });
    metric('sugar_cloud_fill', { rows: 1, cols: 1 });
  });

  await expect.poll(async () => {
    const events = await remoteEvents(page);
    return events.some((event) => event.name === 'ps_level_fail' && event.params.reason === 'analytics_level_test');
  }).toBe(true);

  const events = await remoteEvents(page);
  const fail = events.find((event) => event.name === 'ps_level_fail' && event.params.reason === 'analytics_level_test');
  expect(fail.params.level).toBe(70);
  expect(fail.params.surface).toBe('web');
  expect(fail.params.secret_field).toBeUndefined();
  expect(events.some((event) => event.name === 'ps_sugar_cloud_fill')).toBe(false);
});
