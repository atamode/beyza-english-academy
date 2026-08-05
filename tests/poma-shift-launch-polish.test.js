import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');
const read = name => readFile(path.join(gameDir, name), 'utf8');

test('public Poma Shift no longer presents itself as a prototype', async () => {
  const [index, manifest] = await Promise.all([read('index.html'), read('manifest.webmanifest')]);
  assert.match(index, /<title>Poma Shift<\/title>/);
  assert.doesNotMatch(index, /Prototype/i);
  assert.doesNotMatch(manifest, /prototip/i);
});

test('booster dock is hidden until the player unlocks a character power', async () => {
  const polish = await read('launch-polish.js');
  assert.match(polish, /Object\.values\(unlocked\)\.some\(Boolean\)/);
  assert.match(polish, /dock\.hidden = !/);
});

test('launch polish is wired into page and PWA cache', async () => {
  const [index, sw] = await Promise.all([read('index.html'), read('sw.js')]);
  assert.match(index, /launch-polish\.js/);
  assert.match(sw, /launch-polish\.js/);
});
