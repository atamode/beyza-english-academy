import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');
const read = name => readFile(path.join(gameDir, name), 'utf8');

test('full-level Rush blocks modal exploits but keeps owned powers usable', async () => {
  const source = await read('timed-level-guard.js');
  assert.match(source, /PomaShiftRush\?\.isRushLevel/);
  assert.match(source, /n === 11 \|\| n % 5 === 0/);
  assert.match(source, /boss = n >= 90/);
  assert.match(source, /data-action=\\?"map\\?"/);
  assert.match(source, /data-meta-shop/);
  assert.match(source, /data-meta-lives/);
  assert.match(source, /data-meta-gift/);
  assert.match(source, /data-use-power/);
  assert.match(source, /quantity > 0/);
});

test('Rush mode uses a pre-start card and times the whole level, not the tray', async () => {
  const [rush, disabled] = await Promise.all([read('rush-mode.js'), read('rush-disable.js')]);
  assert.match(rush, /rush-intro/);
  assert.match(rush, /data-rush-start/);
  assert.match(rush, /60_000/);
  assert.match(rush, /50_000/);
  assert.match(rush, /45_000/);
  assert.match(rush, /40_000/);
  assert.match(rush, /dangerRowsForLevel/);
  assert.match(rush, /return isRushLevel\(level\) \? 2 : 1/);
  assert.match(rush, /RUSH süresi bitti/);
  assert.match(rush, /rush_timeout/);
  assert.match(rush, /document\.hidden/);
  assert.match(disabled, /handler\.name === 'updateTrayTimer'/);
});

test('Rush ceiling check happens before line-clear gravity can create a fake safe row', async () => {
  const rush = await read('rush-mode.js');
  assert.match(rush, /const fullRows = \[\]/);
  assert.match(rush, /state\.grid\[row\]\.every\(Boolean\)/);
  assert.match(rush, /morph_crush_danger_zone/);
  assert.match(rush, /!fullRows\.includes\(row\)/);
  assert.match(rush, /freezeMoves <= 0/);
});

test('timed guard and Rush controller are loaded and cached', async () => {
  const [index, sw] = await Promise.all([read('index.html'), read('sw.js')]);
  assert.match(index, /timed-level-guard\.js/);
  assert.match(index, /rush-mode\.js/);
  assert.match(sw, /timed-level-guard\.js/);
  assert.match(sw, /rush-mode\.js/);
  assert.match(sw, /RUSH_RULES\.md/);
});
