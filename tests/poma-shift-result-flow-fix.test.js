import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');
const read = name => readFile(path.join(gameDir, name), 'utf8');

test('result screen normalizer keeps one state-aware Poma hero', async () => {
  const source = await read('result-flow-fix-v1.js');
  assert.match(source, /HAPPY_POMA_SRC/);
  assert.match(source, /SAD_POMA_SRC/);
  assert.match(source, /dataset\.pomaResultMain = '1'/);
  assert.match(source, /candidates\.forEach/);
  assert.match(source, /if \(node !== hero\) node\.remove\(\)/);
  assert.match(source, /failed \? SAD_POMA_SRC : HAPPY_POMA_SRC/);
  assert.match(source, /poma-scarfless-badge \.poma-character-portrait/);
});

test('fifth continue fail remains actionable and blocks the legacy observer loop', async () => {
  const source = await read('result-flow-fix-v1.js');
  assert.match(source, /MAX_CONTINUES = 5/);
  assert.match(source, /continueCount\(\) < MAX_CONTINUES/);
  assert.match(source, /ensureTerminalObserverSentinel/);
  assert.match(source, /dataset\.metaContinue = 'terminal-limit'/);
  assert.match(source, /dataset\.metaContinueSentinel = '1'/);
  assert.match(source, /button\[data-meta-continue\]/);
  assert.match(source, /button\.disabled = false/);
  assert.match(source, /modal\.hidden = false/);
  assert.match(source, /5\/5 reklam devamı kullanıldı/);
});

test('result map action routes to the real lobby and terminal retry restarts the level', async () => {
  const source = await read('result-flow-fix-v1.js');
  assert.match(source, /window\.PomaShiftLobby\.open\(\{ animate: false \}\)/);
  assert.match(source, /event\.target\.closest\('\[data-map\]'\)/);
  assert.match(source, /event\.target\.closest\('\[data-retry\]'\)/);
  assert.match(source, /setupLevel\(currentLevel\(\)\)/);
});

test('terminal guard observer registers before meta-system fail decoration', async () => {
  const index = await read('index.html');
  const pomaBrand = index.indexOf('poma-brand.js');
  const resultGuard = index.indexOf('result-flow-fix-v1.js');
  const metaSystem = index.indexOf('meta-system.js');
  const characterArt = index.indexOf('character-art.js');
  assert.ok(pomaBrand >= 0 && resultGuard > pomaBrand);
  assert.ok(metaSystem >= 0 && resultGuard < metaSystem);
  assert.ok(characterArt >= 0 && resultGuard < characterArt);
  assert.match(index, /result-flow-fix-v1\.js\?v=47/);
});
