import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');
const read = name => readFile(path.join(gameDir, name), 'utf8');

test('dev panel is production-inert unless localhost or ?dev is used', async () => {
  const source = await read('dev-panel.js');
  assert.match(source, /location\.hostname === 'localhost'/);
  assert.match(source, /params\.has\('dev'\)/);
  assert.match(source, /if \(!enabled\) return/);
});

test('dev panel exposes high-level and economy smoke shortcuts', async () => {
  const source = await read('dev-panel.js');
  for (const level of [20, 80, 90, 120, 1000, 10000]) {
    assert.match(source, new RegExp(String(level)));
  }
  assert.match(source, /setCoins\(10000\)/);
  assert.match(source, /setLives\(3\)/);
  assert.match(source, /PomaShiftAnalyticsBridge/);
});

test('dev panel is loaded and cached', async () => {
  const [index, sw] = await Promise.all([read('index.html'), read('sw.js')]);
  assert.match(index, /dev-panel\.css/);
  assert.match(index, /dev-panel\.js/);
  assert.match(sw, /dev-panel\.css/);
  assert.match(sw, /dev-panel\.js/);
});
