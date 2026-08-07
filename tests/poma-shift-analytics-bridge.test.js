import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');
const read = name => readFile(path.join(gameDir, name), 'utf8');

test('analytics bridge preserves local telemetry, uses lexical level, and bootstraps a provider', async () => {
  const source = await read('analytics-bridge.js');
  assert.match(source, /baseMetric\(name, payload\)/);
  assert.match(source, /PomaShiftAnalytics/);
  assert.match(source, /target\.track/);
  assert.match(source, /target\.bootstrap/);
  assert.match(source, /typeof state !== 'undefined'/);
  assert.doesNotMatch(source, /Number\(window\.state\?\.level/);
  assert.match(source, /poma-shift:metric/);
});

test('analytics summary contains commercial and retention signals', async () => {
  const source = await read('analytics-bridge.js');
  for (const field of [
    'completionRate', 'continues', 'rewardedAds', 'interstitialAds',
    'coinsEarned', 'coinsSpent', 'boosterPurchases', 'boosterUses',
    'fairnessAdjustments', 'rushTimeouts', 'sugarCloudFills',
  ]) {
    assert.match(source, new RegExp(field));
  }
});

test('analytics summary counts the current full-level Rush timeout event', async () => {
  const source = await read('analytics-bridge.js');
  assert.match(source, /rushTimeouts:\s*count\('rush_timeout'\)/);
  assert.doesNotMatch(source, /rushTimeouts:\s*count\('tray_timeout'\)/);
});

test('GA4 provider is consent-gated, namespaced, and remote payloads are whitelisted', async () => {
  const source = await read('analytics-ga4-v1.js');
  assert.match(source, /CONSENT_KEY = 'poma\.analytics\.consent\.v1'/);
  assert.match(source, /consent !== 'granted'/);
  assert.match(source, /data-poma-shift-ga4/);
  assert.match(source, /`ps_\$\{name\}`/);
  assert.match(source, /REMOTE_EVENTS/);
  assert.match(source, /PARAM_ALIASES/);
  assert.match(source, /\['level', 'level'\]/);
  assert.match(source, /\['reason', 'reason'\]/);
  assert.doesNotMatch(source, /\['email'|\['password'|\['answer'/i);
});

test('Poma Shift analytics config reuses the current Pomante GA4 property but remains overrideable', async () => {
  const source = await read('analytics-config.js');
  assert.match(source, /G-LVDEFW23S9/);
  assert.match(source, /\.\.\.existing/);
});

test('analytics provider and bridge are loaded at the current cache version and included in cache manifest', async () => {
  const [index, sw] = await Promise.all([read('index.html'), read('sw.js')]);
  assert.match(index, /analytics-config\.js\?v=53/);
  assert.match(index, /analytics-ga4-v1\.js\?v=53/);
  assert.match(index, /analytics-bridge\.js\?v=53/);
  assert.match(sw, /analytics-config\.js/);
  assert.match(sw, /analytics-ga4-v1\.js/);
  assert.match(sw, /analytics-bridge\.js/);
});
