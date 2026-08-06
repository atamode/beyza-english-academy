import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const nativeDir = path.join(root, 'games', 'poma-shift', 'native');
const read = name => readFile(path.join(nativeDir, name), 'utf8');
const readRoot = name => readFile(path.join(root, name), 'utf8');

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

test('automatic Android workflow builds both debug APK and release AAB', async () => {
  const workflow = await readRoot(path.join('.github', 'workflows', 'poma-shift-android.yml'));
  assert.match(workflow, /assembleDebug bundleRelease/);
  assert.match(workflow, /poma-shift-android-debug/);
  assert.match(workflow, /app-debug\.apk/);
  assert.match(workflow, /poma-shift-android-release-unsigned/);
  assert.match(workflow, /app-release\.aab/);
});

test('manual production workflow keeps AdMob and signing credentials in GitHub Secrets', async () => {
  const workflow = await readRoot(path.join('.github', 'workflows', 'poma-shift-android-release.yml'));
  for (const secret of [
    'POMA_ADMOB_ANDROID_APP_ID',
    'POMA_ANDROID_REWARDED_AD_UNIT_ID',
    'POMA_ANDROID_INTERSTITIAL_AD_UNIT_ID',
    'POMA_ANDROID_KEYSTORE_B64',
    'POMA_ANDROID_KEYSTORE_PASSWORD',
    'POMA_ANDROID_KEY_ALIAS',
    'POMA_ANDROID_KEY_PASSWORD',
  ]) {
    assert.match(workflow, new RegExp(`secrets\\.${secret}`));
  }
  assert.match(workflow, /POMA_ADS_TESTING: 'false'/);
  assert.match(workflow, /bundleRelease/);
  assert.match(workflow, /android\.injected\.signing\.store\.file/);
  assert.match(workflow, /jarsigner -verify/);
  assert.match(workflow, /poma-shift-android-release-signed/);
});
