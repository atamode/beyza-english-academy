import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');
const read = name => readFile(path.join(gameDir, name), 'utf8');

test('dev panel is production-inert unless localhost, ?dev, or native QA test mode is used', async () => {
  const source = await read('dev-panel.js');
  assert.match(source, /location\.hostname === 'localhost'/);
  assert.match(source, /params\.has\('dev'\)/);
  assert.match(source, /PomaShiftAds\?\.testMode/);
  assert.match(source, /nativeQaBuild/);
  assert.match(source, /if \(!enabled\) return/);
});

test('QA panel exposes milestone, Rush, boss and economy smoke shortcuts', async () => {
  const source = await read('dev-panel.js');
  for (const level of [1, 10, 11, 20, 30, 40, 50, 60, 70, 80, 90, 120, 10000]) {
    assert.match(source, new RegExp(`\\b${level}\\b`));
  }
  assert.match(source, /qaSetCoins\(10000\)/);
  assert.match(source, /qaSetLives\(3\)/);
  assert.match(source, /qaUnlockThrough\(80\)/);
  assert.match(source, /PomaShiftAnalyticsBridge/);
});

test('dev panel is loaded and cached', async () => {
  const [index, sw] = await Promise.all([read('index.html'), read('sw.js')]);
  assert.match(index, /dev-panel\.css/);
  assert.match(index, /dev-panel\.js/);
  assert.match(sw, /dev-panel\.css/);
  assert.match(sw, /dev-panel\.js/);
});
