import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');
const read = name => readFile(path.join(gameDir, name), 'utf8');

test('rewarded continue gives Rush players three moves plus ten seconds', async () => {
  const source = await read('rush-continue.js');
  assert.match(source, /CONTINUE_BONUS_MS = 10_000/);
  assert.match(source, /detail\.name === 'continue_rewarded'/);
  assert.match(source, /startContinuation\(lastFailureRemainingMs\)/);
  assert.match(source, /\+3 Hamle \+10 sn/);
  assert.match(source, /RUSH devamı: \+3 hamle · \+10 sn/);
});

test('Rush continuation preserves remaining time, survives visibility pause, and can time out', async () => {
  const source = await read('rush-continue.js');
  assert.match(source, /lastFailureRemainingMs = continuationMode/);
  assert.match(source, /bonusBase \+ CONTINUE_BONUS_MS/);
  assert.match(source, /document\.addEventListener\('visibilitychange'/);
  assert.match(source, /window\.lose\('RUSH süresi bitti\.', 'rush_timeout'\)/);
  assert.match(source, /rush\.remainingMs = function rushRemainingWithContinue/);
});

test('fifth rewarded continue ends in an actionable fail screen without disturbing the terminal sentinel', async () => {
  const source = await read('rush-continue.js');
  assert.match(source, /MAX_CONTINUES = 5/);
  assert.match(source, /continueCount\(\) < MAX_CONTINUES/);
  assert.match(source, /button\[data-meta-continue\]/);
  assert.doesNotMatch(source, /fail\.querySelector\('\[data-meta-continue\]'\)\?\.remove\(\)/);
  assert.match(source, /sharedTerminalNote/);
  assert.match(source, /existingRushNote\?\.remove\(\)/);
  assert.match(source, /note\.textContent !== noteText/);
  assert.match(source, /5\/5 reklam devamı kullanıldı/);
  assert.match(source, /button\.disabled = false/);
  assert.match(source, /modal\.hidden = false/);
});

test('Rush copy patch only mutates real continue buttons, not hidden result-flow guards', async () => {
  const source = await read('rush-continue.js');
  assert.match(source, /querySelectorAll\?\.\('button\[data-meta-continue\]'\)/);
  assert.match(source, /button\.textContent !== next/);
});

test('Rush continuation controller loads after Rush mode with the current cache version', async () => {
  const [index, sw] = await Promise.all([read('index.html'), read('sw.js')]);
  const rushIndex = index.indexOf('rush-mode.js');
  const continueIndex = index.indexOf('rush-continue.js');
  assert.ok(rushIndex >= 0 && continueIndex > rushIndex);
  assert.match(index, /rush-continue\.js\?v=48/);
  assert.match(sw, /rush-continue\.js/);
});
