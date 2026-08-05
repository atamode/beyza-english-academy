import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');
const read = name => readFile(path.join(gameDir, name), 'utf8');

test('analytics bridge preserves local telemetry and supports a remote provider', async () => {
  const source = await read('analytics-bridge.js');
  assert.match(source, /baseMetric\(name, payload\)/);
  assert.match(source, /PomaShiftAnalytics/);
  assert.match(source, /provider\.track/);
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

test('analytics bridge is loaded and cached', async () => {
  const [index, sw] = await Promise.all([read('index.html'), read('sw.js')]);
  assert.match(index, /analytics-bridge\.js/);
  assert.match(sw, /analytics-bridge\.js/);
});
