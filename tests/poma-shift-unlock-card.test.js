import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');
const read = name => readFile(path.join(gameDir, name), 'utf8');

test('milestone unlock cards map every launch power level to the lobby product', async () => {
  const source = await read('unlock-card-v1.js');
  for (const [level, id] of [
    [10, 'computer'], [20, 'phone'], [30, 'arrow'], [40, 'claw'],
    [50, 'pacifier'], [60, 'staff'], [70, 'firewave'], [80, 'leaf'],
  ]) {
    assert.match(source, new RegExp(`${level}: \\{ id: '${id}'`));
  }
});

test('first-clear unlock card exposes one explicit gift/shop CTA into the living lobby', async () => {
  const source = await read('unlock-card-v1.js');
  assert.match(source, /YENİ GÜÇ AÇILDI/);
  assert.match(source, /İLK KULLANIM ×1 HEDİYE/);
  assert.match(source, /MAĞAZADA GÖR/);
  assert.match(source, /data-unlock-shop/);
  assert.match(source, /window\.PomaShiftLobby\.open\(\{ animate: false \}\)/);
  assert.match(source, /data-lobby-power/);
  assert.match(source, /button\.click\(\)/);
});

test('loadout picker is constrained to active level preparation and cannot cover a result screen', async () => {
  const source = await read('mobile-release-v2.js');
  assert.match(source, /function showPicker\(level = state\.level/);
  assert.match(source, /if \(state\.status !== 'playing'\) return;/);
});

test('unlock card runtime and style are loaded with the current cache version', async () => {
  const index = await read('index.html');
  assert.match(index, /unlock-card-v1\.css\?v=49/);
  assert.match(index, /unlock-card-v1\.js\?v=61/);
  assert.ok(index.indexOf('unlock-card-v1.js') > index.indexOf('mobile-release-v2.js'));
});