import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const nativeDir = path.join(root, 'games', 'poma-shift', 'native');
const read = name => readFile(path.join(nativeDir, name), 'utf8');

test('native shell uses aligned Capacitor and AdMob majors', async () => {
  const pkg = JSON.parse(await read('package.json'));
  assert.equal(pkg.dependencies['@capacitor/core'], '8.4.2');
  assert.equal(pkg.dependencies['@capacitor/android'], '8.4.2');
  assert.equal(pkg.devDependencies['@capacitor/cli'], '8.4.2');
  assert.equal(pkg.dependencies['@capacitor-community/admob'], '8.0.0');
  assert.equal(pkg.devDependencies.esbuild, '0.28.1');
});

test('native shell has a stable candidate application id and local webDir', async () => {
  const config = JSON.parse(await read('capacitor.config.json'));
  assert.equal(config.appId, 'com.pomante.pomashift');
  assert.equal(config.appName, 'Poma Shift');
  assert.equal(config.webDir, 'www');
});

test('native web build injects AdMob before meta-system and rewrites Poma assets', async () => {
  const source = await read(path.join('scripts', 'build-web.mjs'));
  assert.match(source, /native-ads\.js/);
  assert.match(source, /meta-system\.js/);
  assert.match(source, /replaceAll\('\.\.\/\.\.\/assets\/brand\/poma-academy\//);
  assert.match(source, /poma-shift-character-sprite\.webp/);
});

test('native ads use safe Google demo IDs in test mode and env IDs in production', async () => {
  const source = await read(path.join('src', 'native-ads.ts'));
  assert.match(source, /5224354917/);
  assert.match(source, /1033173712/);
  assert.match(source, /1712485313/);
  assert.match(source, /4411468910/);
  assert.match(source, /prepareRewardVideoAd/);
  assert.match(source, /showRewardVideoAd/);
  assert.match(source, /prepareInterstitial/);
  assert.match(source, /showInterstitial/);
  assert.match(source, /requestConsentInfo/);
});
