import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const nativeDir = path.resolve(here, '..');
const manifestPath = path.join(nativeDir, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

const SAMPLE_ADMOB_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const appId = process.env.POMA_ADMOB_ANDROID_APP_ID || SAMPLE_ADMOB_APP_ID;

let manifest = await readFile(manifestPath, 'utf8');

if (/com\.google\.android\.gms\.ads\.APPLICATION_ID/.test(manifest)) {
  manifest = manifest.replace(
    /(<meta-data\s+android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"\s+android:value=")[^"]+("\s*\/?>)/,
    `$1${appId}$2`,
  );
} else {
  const closingApplication = '</application>';
  if (!manifest.includes(closingApplication)) throw new Error('AndroidManifest.xml application node not found.');
  manifest = manifest.replace(
    closingApplication,
    `        <meta-data\n            android:name="com.google.android.gms.ads.APPLICATION_ID"\n            android:value="${appId}" />\n    ${closingApplication}`,
  );
}

await writeFile(manifestPath, manifest);
console.log(`Configured Android AdMob App ID: ${appId === SAMPLE_ADMOB_APP_ID ? 'Google sample ID' : 'environment ID'}`);
