import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');
const readGame = name => readFile(path.join(gameDir, name), 'utf8');

test('Sugar Cloud V3 locks every level to a 7x9 board without physical resize', async () => {
  const source = await readGame('sugar-cloud-core-v3.js');
  assert.doesNotThrow(() => new Function(source), 'sugar-cloud-core-v3.js should parse');
  assert.match(source, /const BOARD_COLS = 7/);
  assert.match(source, /const BOARD_ROWS = 9/);
  assert.match(source, /currentStage = function sugarCloudCurrentStage/);
  assert.match(source, /return \{ cols: BOARD_COLS, rows: BOARD_ROWS \}/);
  assert.doesNotMatch(source, /leftAdd|rightAdd|extraCols/);
});

test('Sugar Cloud grows by locking rows while the grid stays 7x9', async () => {
  const source = await readGame('sugar-cloud-core-v3.js');
  assert.match(source, /state\.cloudRows = rows \+ 1/);
  assert.match(source, /state\.stageIndex = state\.cloudRows/);
  assert.match(source, /state\.grid = makeGrid\(BOARD_COLS, BOARD_ROWS\)/);
  assert.match(source, /touchesCloud/);
  assert.match(source, /Şeker Bulutu 1 satır büyüdü/);
});

test('Sugar Cloud has warning, critical and lightning feedback', async () => {
  const source = await readGame('sugar-cloud-core-v3.js');
  const css = await readGame('sugar-cloud-core-v3.css');
  assert.match(source, /dangerGap/);
  assert.match(source, /is-warning/);
  assert.match(source, /is-critical/);
  assert.match(css, /cloud-lightning/);
  assert.match(css, /is-critical/);
  assert.match(css, /cloudDrop/);
});

test('new token family keeps six distinct visual identities', async () => {
  const source = await readGame('sugar-cloud-core-v3.js');
  for (const token of ['star', 'drop', 'leaf', 'heart', 'crystal', 'energy']) {
    assert.match(source, new RegExp(`'${token}'`));
  }
  assert.match(source, /drawTokenSymbol/);
});

test('Dahi computer is a one-advance Sugar Cloud shield instead of ten move freeze', async () => {
  const source = await readGame('sugar-cloud-meta-v3.js');
  const character = await readGame('character-gameplay-v1.js');
  assert.doesNotThrow(() => new Function(source), 'sugar-cloud-meta-v3.js should parse');
  assert.match(source, /let shieldCharges = 0/);
  assert.match(source, /shieldCharges = 1/);
  assert.match(source, /cloud_shield_block/);
  assert.match(source, /bir sonraki ilerlemesini/);
  assert.match(character, /Güvenlik Kalkanı/);
  assert.doesNotMatch(character, /10 hamle boyunca durdurur/);
});

test('RUSH uses the moving cloud edge and includes input recovery', async () => {
  const source = await readGame('rush-cloud-v3.js');
  assert.doesNotThrow(() => new Function(source), 'rush-cloud-v3.js should parse');
  assert.match(source, /const start = cloud\.cloudRows\(\)/);
  assert.match(source, /offset < 2/);
  assert.match(source, /recoverRushInput/);
  assert.match(source, /pointerEvents = 'auto'/);
  assert.match(source, /Şeker Bulutu.*2 tehlike satırı/);
});

test('gameplay character bands remain complete and Dahi targets the cloud edge', async () => {
  const source = await readGame('character-gameplay-v1.js');
  assert.doesNotThrow(() => new Function(source), 'character-gameplay-v1.js should parse');
  assert.match(source, /min: 10, max: 19, id: 'genius'/);
  assert.match(source, /min: 20, max: 29, id: 'influencer'/);
  assert.match(source, /min: 30, max: 39, id: 'archer'/);
  assert.match(source, /min: 60, max: 69, id: 'elder'/);
  assert.match(source, /min: 70, max: 79, id: 'fire'/);
  assert.match(source, /min: 80, max: Infinity, id: 'hero'/);
  assert.match(source, /power === 'computer'/);
  assert.match(source, /playProjectile/);
});

test('index loads Sugar Cloud core early and cloud meta before RUSH', async () => {
  const index = await readGame('index.html');
  assert.match(index, /sugar-cloud-core-v3\.css\?v=60/);
  assert.match(index, /sugar-cloud-core-v3\.js\?v=60/);
  assert.match(index, /sugar-cloud-meta-v3\.js\?v=60/);
  assert.match(index, /rush-cloud-v3\.js\?v=60/);
  assert.match(index, />BULUT</);
  assert.match(index, />7×9</);
  assert.doesNotMatch(index, /loft-core-v2\.js/);
  assert.ok(index.indexOf('game.js?v=40') < index.indexOf('sugar-cloud-core-v3.js?v=60'));
  assert.ok(index.indexOf('meta-system.js?v=40') < index.indexOf('sugar-cloud-meta-v3.js?v=60'));
  assert.ok(index.indexOf('sugar-cloud-meta-v3.js?v=60') < index.indexOf('rush-mode.js?v=60'));
  assert.ok(index.indexOf('rush-mode.js?v=60') < index.indexOf('rush-cloud-v3.js?v=60'));
});