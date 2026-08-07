import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');
const read = name => readFile(path.join(gameDir, name), 'utf8');

test('Sugar Cloud boss HUD is restricted to level 90 gameplay and reads the live lexical game state', async () => {
  const source = await read('boss-ui.js');
  assert.match(source, /BOSS_LEVEL = 90/);
  assert.match(source, /function currentGameState\(\)/);
  assert.match(source, /typeof state !== 'undefined' \? state : null/);
  assert.match(source, /Number\(gameState\?\.level\) === BOSS_LEVEL/);
  assert.match(source, /gameState\?\.status === 'playing'/);
  assert.doesNotMatch(source, /Number\(window\.state\?\.level\)/);
  assert.match(source, /sugar_cloud_fill/);
  assert.match(source, /Yapışkan Şeker Bulutu/);
  assert.match(source, /sugar-cloud\.png/);
});

test('Sugar Cloud is represented in the living lobby, boss preparation, and results', async () => {
  const source = await read('boss-ui.js');
  assert.match(source, /poma-map-node\[data-lobby-level="90"\]/);
  assert.match(source, /poma-boss-node-label/);
  assert.match(source, /boss-prep-identity/);
  assert.match(source, /LEVEL 90 · İLK BOSS/);
  assert.match(source, /boss-result-opponent/);
  assert.match(source, /Şeker Bulutu dağıldı!/);
  assert.match(source, /Şeker Bulutu hâlâ burada/);
});

test('boss result keeps Poma as the main result hero and removes the legacy duplicate boss portrait', async () => {
  const source = await read('boss-ui.js');
  assert.match(source, /querySelectorAll\(':scope > \.sugar-cloud-result-art'\)/);
  assert.match(source, /boss-complete-badge/);
  assert.match(source, /boss-result-opponent-art/);
  assert.doesNotMatch(source, /view\.prepend\(art\)/);
});

test('Sugar Cloud artwork exists and boss assets load at the current cache version', async () => {
  await access(path.join(root, 'assets', 'brand', 'poma-academy', 'sugar-cloud.png'));
  const [index, sw] = await Promise.all([read('index.html'), read('sw.js')]);
  assert.match(index, /boss-ui\.css\?v=50/);
  assert.match(index, /boss-ui\.js\?v=50/);
  assert.match(sw, /boss-ui\.css/);
  assert.match(sw, /boss-ui\.js/);
  assert.match(sw, /sugar-cloud\.png/);
});
