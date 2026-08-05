import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');

const read = name => readFile(path.join(gameDir, name), 'utf8');

test('Poma Shift ships the milestone character sprite', async () => {
  await access(path.join(root, 'assets', 'brand', 'poma-academy', 'poma-shift-character-sprite.webp'));
});

test('character art maps the locked milestone identities', async () => {
  const source = await read('character-art.js');
  for (const [level, id] of [
    [10, 'poma'], [20, 'genius'], [30, 'influencer'], [40, 'archer'],
    [50, 'wolf'], [60, 'baby'], [70, 'elder'], [80, 'hero'],
  ]) {
    assert.match(source, new RegExp(`level: ${level}, id: '${id}'`));
  }
  assert.match(source, /min: 1, max: 10/);
  assert.match(source, /Atkısız Poma/);
});

test('index and PWA cache load character art', async () => {
  const [index, sw] = await Promise.all([read('index.html'), read('sw.js')]);
  assert.match(index, /character-art\.css/);
  assert.match(index, /character-art\.js/);
  assert.match(sw, /poma-shift-character-sprite\.webp/);
  assert.match(sw, /character-art\.css/);
  assert.match(sw, /character-art\.js/);
});
