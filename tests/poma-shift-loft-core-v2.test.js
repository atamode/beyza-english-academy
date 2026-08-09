import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');
const readGame = name => readFile(path.join(gameDir, name), 'utf8');

test('LOFT V2 removes side growth from the runtime shift implementation', async () => {
  const source = await readGame('loft-core-v2.js');
  assert.doesNotThrow(() => new Function(source), 'loft-core-v2.js should parse');
  assert.match(source, /state\.loftFixedCols/);
  assert.match(source, /state\.grid = state\.grid\.slice\(removedRows\)/);
  assert.match(source, /LOFT 1 satır indi/);
  assert.doesNotMatch(source, /leftAdd|rightAdd|extraCols/);
});

test('LOFT V2 keeps the level start width while rows descend', async () => {
  const source = await readGame('loft-core-v2.js');
  assert.match(source, /cols: Number\(state\.loftFixedCols/);
  assert.match(source, /const descendedRows = Math\.max\(0, startRows - stage\.rows\)/);
  assert.match(source, /const y = baseY \+ descendedRows \* cell/);
});

test('new token family has six distinct visual identities', async () => {
  const source = await readGame('loft-core-v2.js');
  for (const token of ['star', 'drop', 'leaf', 'heart', 'crystal', 'energy']) {
    assert.match(source, new RegExp(`'${token}'`));
  }
  assert.match(source, /drawTokenSymbol/);
});

test('gameplay character bands cover each milestone range and cast powers from the active character layer', async () => {
  const source = await readGame('character-gameplay-v1.js');
  assert.doesNotThrow(() => new Function(source), 'character-gameplay-v1.js should parse');
  assert.match(source, /min: 10, max: 19, id: 'genius'/);
  assert.match(source, /min: 20, max: 29, id: 'influencer'/);
  assert.match(source, /min: 30, max: 39, id: 'archer'/);
  assert.match(source, /min: 60, max: 69, id: 'elder'/);
  assert.match(source, /min: 70, max: 79, id: 'fire'/);
  assert.match(source, /min: 80, max: Infinity, id: 'hero'/);
  assert.match(source, /playProjectile/);
  assert.match(source, /is-signature-cast/);
});

test('index loads LOFT core immediately after game.js and gameplay character layer after meta/runtime overlays', async () => {
  const index = await readGame('index.html');
  assert.match(index, /loft-core-v2\.css\?v=54/);
  assert.match(index, /character-gameplay-v1\.css\?v=54/);
  assert.match(index, /loft-core-v2\.js\?v=54/);
  assert.match(index, /character-gameplay-v1\.js\?v=54/);
  assert.ok(index.indexOf('game.js?v=40') < index.indexOf('loft-core-v2.js?v=54'));
  assert.ok(index.indexOf('loft-core-v2.js?v=54') < index.indexOf('game-feel.js?v=40'));
  assert.ok(index.indexOf('mobile-release-v2.js?v=51') < index.indexOf('character-gameplay-v1.js?v=54'));
});
