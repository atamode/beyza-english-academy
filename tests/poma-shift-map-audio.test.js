import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');
const read = name => readFile(path.join(gameDir, name), 'utf8');

test('background music is restricted to visible map screens', async () => {
  const source = await read('audio-mix.js');
  assert.match(source, /function mapMusicVisible\(\)/);
  assert.match(source, /\.meta-modal:not\(\[hidden\]\) \.meta-map/);
  assert.match(source, /!mapMusicVisible\(\)/);
  assert.match(source, /document\.addEventListener\('click', syncMusic\)/);
  assert.match(source, /isMapMusicVisible: mapMusicVisible/);
});

test('gameplay sound effects remain wired while map music is paused', async () => {
  const source = await read('audio-mix.js');
  for (const event of [
    'piece_placed',
    'invalid_drop',
    'line_clear',
    'shift',
    'line_combo',
    'level_complete',
    'level_fail',
  ]) {
    assert.match(source, new RegExp(`name === '${event}'`));
  }
  assert.match(source, /const baseMetric = metric/);
  assert.match(source, /playEnhancedSfx\(name, payload\)/);
});
