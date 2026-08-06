import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const gameDir = path.join(root, 'games', 'poma-shift');

async function read(name) {
  return readFile(path.join(gameDir, name), 'utf8');
}

test('Poma Shift core + meta files are wired into index', async () => {
  const index = await read('index.html');
  assert.match(index, /meta-system\.css/);
  assert.match(index, /meta-system\.js/);
  assert.match(index, /character-progression-v2\.js/);
  assert.match(index, /game\.js/);
});

test('Poma Shift revised character milestone order is locked', async () => {
  const progression = await read('character-progression-v2.js');
  const expected = [
    [1, 'poma'],
    [10, 'genius'],
    [20, 'influencer'],
    [30, 'archer'],
    [40, 'wolf'],
    [50, 'baby'],
    [60, 'elder'],
    [70, 'fire'],
    [80, 'hero'],
  ];

  for (const [level, id] of expected) {
    assert.match(progression, new RegExp(`level: ${level}, id: '${id}'`));
  }
  assert.match(progression, /name: 'Poma'/);
  assert.match(progression, /name: 'Fire Poma'/);
  assert.match(progression, /name: 'PomaHero'/);

  const meta = await read('meta-system.js');
  assert.match(meta, /FIRST_BOSS_LEVEL = 90/);
  assert.match(meta, /BOSS_STEP = 30/);
});

test('revised booster unlock levels start at level 10 and keep PomaHero strongest at 80', async () => {
  const progression = await read('character-progression-v2.js');
  for (const [id, level] of [
    ['computer', 10], ['phone', 20], ['arrow', 30], ['claw', 40],
    ['pacifier', 50], ['staff', 60], ['leaf', 80],
  ]) {
    assert.match(progression, new RegExp(`boosters\\.${id}[\\s\\S]{0,80}?unlockLevel: ${level}`));
  }
  assert.match(progression, /FIRE_LEVEL = 70/);
  assert.match(progression, /FIRE_PRICE = 1800/);
  assert.match(progression, /LOFT bölgesindeki ilk 2 satırı tamamen yakar\./);
  assert.match(progression, /state\.grid\[row\]\.fill\(null\)/);
});

test('Poma Shift locked booster prices are preserved', async () => {
  const meta = await read('meta-system.js');
  const prices = {
    pacifier: 100,
    claw: 300,
    phone: 500,
    arrow: 700,
    computer: 1100,
    staff: 1600,
    leaf: 2000,
  };

  for (const [id, price] of Object.entries(prices)) {
    const block = new RegExp(`${id}: \\{[\\s\\S]{0,220}?price: ${price}`);
    assert.match(meta, block);
  }
  assert.match(meta, /PACK_PRICE = 3500/);
});

test('Poma Shift life, continue and return-gift contracts are locked', async () => {
  const meta = await read('meta-system.js');
  assert.match(meta, /MAX_LIVES = 3/);
  assert.match(meta, /MAX_CONTINUE_ADS_PER_LEVEL = 5/);
  assert.match(meta, /RETURN_GIFT_MS = 12 \* 60 \* 60 \* 1000/);
  assert.match(meta, /state\.moves = Math\.max\(0, state\.moves - 3\)/);
  assert.match(meta, /meta\.coins \+= 100/);
  assert.match(meta, /if \(meta\.depletionCountToday <= 1\) return 60 \* 1000/);
  assert.match(meta, /if \(meta\.depletionCountToday === 2\) return 15 \* 60 \* 1000/);
  assert.match(meta, /return 30 \* 60 \* 1000/);
});

test('rewarded continue remains in the same life attempt', async () => {
  const meta = await read('meta-system.js');
  assert.match(meta, /lifeChargedForAttempt: false/);
  assert.match(meta, /if \(!runtime\.lifeChargedForAttempt\)/);
  assert.match(meta, /runtime\.lifeChargedForAttempt = true/);
  assert.match(meta, /runtime\.lifeChargedForAttempt = false/);
  assert.match(meta, /continued_attempt_failed/);
});

test('Poma Shift Sugar Cloud first boss contract is locked', async () => {
  const meta = await read('meta-system.js');
  assert.match(meta, /SUGAR_INTERVAL_MS = 3000/);
  assert.match(meta, /level === FIRST_BOSS_LEVEL/);
  assert.match(meta, /setInterval\(dropSugarCell, SUGAR_INTERVAL_MS\)/);
  assert.match(meta, /sugar_ceiling/);
});

test('Poma Shift meta spec documents the same commercial rules', async () => {
  const spec = await read('META_SPEC.md');
  assert.match(spec, /normal level: \*\*5 Coin\*\*/);
  assert.match(spec, /zor \/ RUSH level: \*\*10 Coin\*\*/);
  assert.match(spec, /boss \/ challenge: \*\*20 Coin\*\*/);
  assert.match(spec, /1 can = \*\*100 Coin\*\*/);
  assert.match(spec, /3 can = \*\*250 Coin\*\*/);
  assert.match(spec, /1 rewarded reklam = \*\*\+3 hamle\*\*/);
  assert.match(spec, /maksimum \*\*5 continue reklamı\*\*/);
  assert.match(spec, /\*\*Level 90 — Yapışkan Şeker Bulutu\*\*/);
});

test('PWA cache includes current meta and character progression files', async () => {
  const sw = await read('sw.js');
  assert.match(sw, /meta-system\.css/);
  assert.match(sw, /meta-system\.js/);
  assert.match(sw, /character-progression-v2\.js/);
  assert.match(sw, /META_SPEC\.md/);
});
