import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');
const readGame = name => readFile(path.join(gameDir, name), 'utf8');

test('character progression starts powers at level 10 and keeps PomaHero strongest at 80', async () => {
  const source = await readGame('character-progression-v2.js');
  assert.match(source, /level: 1, id: 'poma', name: 'Poma'/);
  assert.match(source, /level: 10, id: 'genius', name: 'Poma Dahi'/);
  assert.match(source, /level: 60, id: 'elder', name: 'Dede Poma'/);
  assert.match(source, /level: 70, id: 'fire', name: 'Fire Poma'/);
  assert.match(source, /level: 80, id: 'hero', name: 'PomaHero'/);
  assert.doesNotMatch(source, /Atkısız Poma/);
  assert.match(source, /Alev Dalgası/);
  assert.match(source, /ilk 2 satırı tamamen yakar/);
});

test('Fire Poma burns the top two rows and has a visible flame-to-ash effect', async () => {
  const progression = await readGame('character-progression-v2.js');
  const art = await readGame('character-art.css');
  assert.match(progression, /slice\(0, 2\)/);
  assert.match(progression, /row < Math\.min\(2, state\.grid\.length\)/);
  assert.match(progression, /fire-wave-overlay/);
  assert.match(art, /@keyframes fireSweep/);
  assert.match(art, /@keyframes ashScatter/);
  assert.match(art, /fire%20poma\.png/);
});

test('mobile release uses a three-slot loadout, one-screen fit, stronger danger and boss source feedback', async () => {
  const source = await readGame('mobile-release-v2.js');
  const css = await readGame('mobile-release-v2.css');
  assert.match(source, /slice\(0, 3\)/);
  assert.match(source, /data-loadout-slot="0"/);
  assert.match(source, /data-loadout-slot="1"/);
  assert.match(source, /data-loadout-slot="2"/);
  assert.match(source, /Haritaya geri dön/);
  assert.match(source, /ZOR BÖLÜM · BOSS/);
  assert.match(source, /morphNotice/);
  assert.match(source, /sugarCast/);
  assert.match(css, /body\.poma-mobile-fit/);
  assert.match(css, /body\.danger-armed \.game-card/);
  assert.match(css, /board-morph-notice/);
  assert.match(css, /sugar-shot/);
});

test('map lobby is the launch surface and preserves the locked power-card contract', async () => {
  const source = await readGame('lobby-v1.js');
  const css = await readGame('lobby-v1.css');
  const index = await readGame('index.html');

  assert.doesNotThrow(() => new Function(source), 'lobby-v1.js should parse');
  assert.match(index, /class="poma-lobby-boot"/);
  assert.match(index, /lobby-v1\.css\?v=42/);
  assert.match(index, /lobby-v1\.js\?v=42/);
  assert.match(source, /openLobby\(\{ animate: true, syncLevel: true \}\)/);
  assert.match(source, /openLobby\(\{ animate: false, syncLevel: false \}\)/);
  assert.match(source, /scrollIntoView\(\{ behavior: 'smooth', block: 'center' \}\)/);
  assert.match(source, /poma-map-node/);
  assert.match(source, /poma-lobby-node-character/);
  assert.match(source, /data-lobby-slots/);
  assert.match(source, /data-lobby-powers/);
  assert.match(source, /label: `🔒 Lv\$\{power\.level\}`/);
  assert.match(source, /label: `×\$\{qty\}`/);
  assert.match(source, /label: `\$\{power\.price\} 🪙`/);
  assert.match(source, /Oyundan çıkmak istediğine emin misin\?/);
  assert.match(source, /data-detail-slot/);
  assert.match(source, /data-detail-buy/);
  assert.match(css, /html\.poma-lobby-boot \.app-shell/);
  assert.match(css, /@keyframes pomaNodeLive/);
  assert.match(css, /\.poma-power-mini/);
});

test('Android bundle includes every milestone character image including Fire Poma and rewrites lobby art paths', async () => {
  const build = await readFile(path.join(gameDir, 'native', 'scripts', 'build-web.mjs'), 'utf8');
  for (const asset of [
    'poma-genius.png',
    'poma-influencer.png',
    'poma-archer.png',
    'poma-wolf.png',
    'poma-baby.png',
    'poma-elder.png',
    'fire poma.png',
    'poma-hero.png',
    'sugar-cloud.png',
  ]) assert.match(build, new RegExp(asset.replace('.', '\\.')));
  assert.match(build, /'lobby-v1\.css'/);
});

test('release overlay scripts parse and are loaded by the game page', async () => {
  const index = await readGame('index.html');
  for (const file of ['character-progression-v2.js', 'fire-compat.js', 'mobile-release-v2.js', 'lobby-v1.js']) {
    const source = await readGame(file);
    assert.doesNotThrow(() => new Function(source), `${file} should parse`);
    assert.match(index, new RegExp(file.replace('.', '\\.')));
  }
  assert.match(index, /mobile-release-v2\.css/);
  assert.match(index, /lobby-v1\.css/);
});
