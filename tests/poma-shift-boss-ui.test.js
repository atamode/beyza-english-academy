import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');
const read = name => readFile(path.join(gameDir, name), 'utf8');

test('Sugar Cloud boss HUD is restricted to level 90 gameplay and uses real art', async () => {
  const source = await read('boss-ui.js');
  assert.match(source, /Number\(window\.state\?\.level\) === 90/);
  assert.match(source, /state\?\.status === 'playing'/);
  assert.match(source, /sugar_cloud_fill/);
  assert.match(source, /Yapışkan Şeker Bulutu/);
  assert.match(source, /sugar-cloud\.png/);
  assert.match(source, /decorateBossMap/);
  assert.match(source, /decorateBossResult/);
});

test('Sugar Cloud artwork exists and boss assets are loaded and cached', async () => {
  await access(path.join(root, 'assets', 'brand', 'poma-academy', 'sugar-cloud.png'));
  const [index, sw] = await Promise.all([read('index.html'), read('sw.js')]);
  assert.match(index, /boss-ui\.css/);
  assert.match(index, /boss-ui\.js/);
  assert.match(sw, /boss-ui\.css/);
  assert.match(sw, /boss-ui\.js/);
  assert.match(sw, /sugar-cloud\.png/);
});
