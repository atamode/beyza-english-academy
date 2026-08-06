import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');
const assetDir = path.join(root, 'assets', 'brand', 'poma-academy');

const read = name => readFile(path.join(gameDir, name), 'utf8');

test('Poma Shift ships milestone artwork including Fire Poma', async () => {
  for (const file of [
    'poma-main-wave.png',
    'poma-genius.png',
    'poma-influencer.png',
    'poma-archer.png',
    'poma-wolf.png',
    'poma-baby.png',
    'poma-elder.png',
    'fire poma.png',
    'poma-hero.png',
    'poma-sad.png',
  ]) {
    await access(path.join(assetDir, file));
  }
});

test('character art maps the revised milestone identities and goal copy', async () => {
  const source = await read('character-art.js');
  for (const [level, id] of [
    [1, 'poma'], [10, 'genius'], [20, 'influencer'], [30, 'archer'],
    [40, 'wolf'], [50, 'baby'], [60, 'elder'], [70, 'fire'], [80, 'hero'],
  ]) {
    assert.match(source, new RegExp(`level: ${level}, id: '${id}'`));
  }
  assert.match(source, /min: 1, max: 9/);
  assert.match(source, /name: 'Poma'/);
  assert.match(source, /name: 'Fire Poma'/);
  assert.match(source, /name: 'PomaHero'/);
  assert.doesNotMatch(source, /Atkısız Poma/);
  assert.match(source, /decorateRushMilestone/);
  assert.match(source, /rush-character-art/);
  assert.match(source, /poma-character-goal/);
  assert.match(source, /BU LEVELDE AÇILIR/);
  assert.match(source, /SONRAKİ KARAKTER HEDEFİ/);
  assert.match(source, /Level \$\{character\.level\} tamamlanınca açılır/);
});

test('character CSS uses Fire Poma artwork and keeps PomaHero leaf artwork separate', async () => {
  const css = await read('character-art.css');
  for (const file of [
    'poma-main-wave.png', 'poma-genius.png', 'poma-influencer.png', 'poma-archer.png',
    'poma-wolf.png', 'poma-baby.png', 'poma-elder.png', 'poma-hero.png',
  ]) {
    assert.match(css, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(css, /fire%20poma\.png/);
  assert.match(css, /\.fire-wave-overlay/);
  assert.match(css, /@keyframes fireSweep/);
  assert.match(css, /@keyframes ashScatter/);
  assert.match(css, /\.poma-next-goal/);
  assert.match(css, /\.poma-character-goal/);
});

test('index and cache load current milestone progression and Fire Poma assets', async () => {
  const [index, sw] = await Promise.all([read('index.html'), read('sw.js')]);
  assert.match(index, /character-art\.css/);
  assert.match(index, /character-progression-v2\.js/);
  assert.match(index, /character-art\.js/);
  for (const file of [
    'poma-genius.png', 'poma-influencer.png', 'poma-archer.png', 'poma-wolf.png',
    'poma-baby.png', 'poma-elder.png', 'fire poma.png', 'poma-hero.png',
  ]) {
    assert.match(sw, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(sw, /character-progression-v2\.js/);
  assert.match(sw, /character-art\.css/);
  assert.match(sw, /character-art\.js/);
});
