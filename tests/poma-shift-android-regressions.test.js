import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const gameDir = path.join(root, 'games', 'poma-shift');
const readGame = name => readFile(path.join(gameDir, name), 'utf8');
const readNative = name => readFile(path.join(gameDir, 'native', name), 'utf8');

test('legacy per-tray RUSH interval is permanently blocked', async () => {
  const source = await readGame('rush-disable.js');
  assert.match(source, /handler\.name === 'updateTrayTimer'/);
  assert.match(source, /trayTimerEndsAt/);
  assert.match(source, /expireTray\(\)/);
  assert.match(source, /PomaShiftLegacyTrayRushDisabled = true/);
});

test('authoritative RUSH UI guard is loaded after rush-mode', async () => {
  const index = await readGame('index.html');
  const rushMode = index.indexOf('rush-mode.js');
  const guard = index.indexOf('rush-runtime-guard.js');
  assert.ok(rushMode >= 0);
  assert.ok(guard > rushMode);

  const source = await readGame('rush-runtime-guard.js');
  assert.match(source, /rushDurationForLevel/);
  assert.match(source, /isRushLevel/);
  assert.match(source, /SERBEST/);
});

test('native package includes all milestone, result and boss artwork', async () => {
  const source = await readNative(path.join('scripts', 'build-web.mjs'));
  for (const file of [
    'poma-main-wave.png', 'poma-sad.png', 'poma-genius.png', 'poma-influencer.png',
    'poma-archer.png', 'poma-wolf.png', 'poma-baby.png', 'poma-elder.png',
    'fire poma.png', 'poma-hero.png', 'sugar-cloud.png',
  ]) {
    assert.match(source, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(source, /boss-ui\.js/);
  assert.match(source, /replaceAll\('\.\.\/\.\.\/assets\/brand\/poma-academy\//);
});

test('native build injects AdMob bridge even when meta-system has cache query string', async () => {
  const source = await readNative(path.join('scripts', 'build-web.mjs'));
  assert.match(source, /meta-system\\\.js\(\?:\\\?\[\^\\\"\]\*\)\?/);
  assert.match(source, /native-ads\.js/);
});

test('DEV controls stay hidden in native builds unless explicitly requested', async () => {
  const source = await readGame('dev-panel.js');
  assert.match(source, /Capacitor\?\.isNativePlatform/);
  assert.match(source, /params\.has\('dev'\)/);
  assert.match(source, /localBrowser && !nativeApp/);
});
