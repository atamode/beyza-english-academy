import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const nativeDir = path.resolve(here, '..');
const gameDir = path.resolve(nativeDir, '..');
const repoRoot = path.resolve(gameDir, '..', '..');
const www = path.join(nativeDir, 'www');

const excluded = new Set([
  'native',
  'GAME_SPEC.md',
  'META_SPEC.md',
  'META_TEST_PLAN.md',
  'README.md',
]);

await rm(www, { recursive: true, force: true });
await mkdir(www, { recursive: true });

for (const entry of await (await import('node:fs/promises')).readdir(gameDir, { withFileTypes: true })) {
  if (excluded.has(entry.name)) continue;
  const source = path.join(gameDir, entry.name);
  const target = path.join(www, entry.name);
  await cp(source, target, { recursive: true });
}

const brandSource = path.join(repoRoot, 'assets', 'brand', 'poma-academy');
const brandTarget = path.join(www, 'assets', 'brand', 'poma-academy');
await mkdir(brandTarget, { recursive: true });
for (const name of [
  'poma-main-wave.png',
  'poma-sad.png',
  'poma-genius.png',
  'poma-influencer.png',
  'poma-archer.png',
  'poma-wolf.png',
  'poma-baby.png',
  'poma-elder.png',
  'fire poma.png',
  'poma-hero.png',
  'poma-shift-character-sprite.webp',
  'sugar-cloud.png',
]) {
  await cp(path.join(brandSource, name), path.join(brandTarget, name));
}

const rewriteFiles = [
  'poma-brand.js',
  'character-art.css',
  'boss-ui.js',
  'sw.js',
];
for (const name of rewriteFiles) {
  const file = path.join(www, name);
  let text = await readFile(file, 'utf8');
  text = text.replaceAll('../../assets/brand/poma-academy/', './assets/brand/poma-academy/');
  await writeFile(file, text);
}

const indexFile = path.join(www, 'index.html');
let index = await readFile(indexFile, 'utf8');
index = index.replace(
  /(\s*<script src="\.\/meta-system\.js(?:\?[^\"]*)?" defer><\/script>)/,
  '\n  <script src="./native-ads.js"></script>$1',
);
index = index.replace(/\n  <script>\n    if \('serviceWorker'[\s\S]*?<\/script>/, '');
await writeFile(indexFile, index);

console.log(`Poma Shift native web assets prepared at ${www}`);
