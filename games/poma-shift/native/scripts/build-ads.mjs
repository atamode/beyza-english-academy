import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const nativeDir = path.resolve(here, '..');

const testing = process.env.POMA_ADS_TESTING !== 'false';
const config = {
  testing,
  androidRewarded: process.env.POMA_ADMOB_ANDROID_REWARDED || '',
  androidInterstitial: process.env.POMA_ADMOB_ANDROID_INTERSTITIAL || '',
  iosRewarded: process.env.POMA_ADMOB_IOS_REWARDED || '',
  iosInterstitial: process.env.POMA_ADMOB_IOS_INTERSTITIAL || '',
};

await build({
  entryPoints: [path.join(nativeDir, 'src', 'native-ads.ts')],
  outfile: path.join(nativeDir, 'www', 'native-ads.js'),
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  define: {
    __POMA_AD_CONFIG__: JSON.stringify(config),
  },
});

console.log(`Poma Shift native ad bridge built (${testing ? 'TEST' : 'PRODUCTION'} mode).`);
