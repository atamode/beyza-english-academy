import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');
const read = name => readFile(path.join(gameDir, name), 'utf8');

test('timed levels block meta modals that would let timers drift', async () => {
  const source = await read('timed-level-guard.js');
  assert.match(source, /level === 11 \|\| level % 5 === 0/);
  assert.match(source, /data-meta-shop/);
  assert.match(source, /data-meta-lives/);
  assert.match(source, /data-meta-gift/);
  assert.match(source, /data-use-power/);
  assert.match(source, /quantity > 0/);
});

test('timed guard is loaded and cached', async () => {
  const [index, sw] = await Promise.all([read('index.html'), read('sw.js')]);
  assert.match(index, /timed-level-guard\.js/);
  assert.match(sw, /timed-level-guard\.js/);
});
