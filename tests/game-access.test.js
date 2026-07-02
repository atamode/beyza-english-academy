import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("game center is reachable before onboarding and from top navigation", () => {
  const app = read("js/app.js");
  const index = read("index.html");
  assert.match(app, /r==="games"\)return gamesHub\(\)/);
  assert.match(app, /r==="game\/football"\)return footballGameView/);
  assert.doesNotMatch(app, /!state\.onboardingComplete&&r==="games"/);
  assert.doesNotMatch(app, /!state\.onboardingComplete&&r==="game\/football"/);
  assert.match(app, /Şimdilik Futbol Oyna/);
  assert.match(index, /class="icon-button games-button" data-route="games"/);
});

test("home renders game center before curriculum", () => {
  const app = read("js/app.js");
  const gameIndex = app.indexOf("${gameCenterCard({compact:true})}<div class=\"stats-grid grid\">");
  const curriculumIndex = app.indexOf("<section class=\"module-list\"><h2>Müfredat</h2>");
  assert.ok(gameIndex > -1, "home should inject game center near top");
  assert.ok(curriculumIndex > -1, "curriculum exists");
  assert.ok(gameIndex < curriculumIndex, "game center must appear before curriculum");
  assert.equal(app.includes("football-actions"), false, "old bottom football card should not be appended after curriculum");
});

test("games route renders a real game center, not the home curriculum", () => {
  const app = read("js/app.js");
  const match = app.match(/function gamesHub\(\)\{([\s\S]*?)`;bindRoutes\(\)\}/);
  const cardMatch = app.match(/function gameCenterCard[\s\S]*?\{([\s\S]*?)`\}/);
  assert.ok(match, "gamesHub renderer must exist");
  assert.ok(cardMatch, "football game card renderer must exist");
  const html = match[1];
  const cardHtml = cardMatch[1];
  assert.match(html, /data-route-page="games"/);
  assert.match(html, /<h1>Oyun Merkezi<\/h1>/);
  assert.match(html, /Kelime Kasası ile oynarken İngilizce öğren/);
  assert.match(html, /\$\{gameCenterCard\(\)\}/);
  assert.match(cardHtml, /Sporty Poma Futbol V1/);
  assert.match(cardHtml, /game-card-image/);
  assert.match(cardHtml, /data-route="game\/football">Futbol Oyna/);
  assert.match(html, /Voleybol/);
  assert.match(html, /Yakında/);
  assert.doesNotMatch(html, /BUGÜNÜN PLANI/);
  assert.doesNotMatch(html, /Müfredat/);
  assert.doesNotMatch(html, /data-route="game\/volleyball"/);
});

test("football return route preserves the previous screen", () => {
  const app = read("js/app.js");
  const football = read("js/football-game.js");
  assert.match(app, /beyzaFootballReturnRoute/);
  assert.match(app, /if\(b\.dataset\.route==="game\/football"\)sessionStorage\.setItem\("beyzaFootballReturnRoute",getRoute\(\)\|\|"home"\)/);
  assert.match(football, /beyzaFootballReturnRoute/);
  assert.match(football, /location\.hash = `#\/\$\{back\}`/);
});

test("tablet navigation and game card keep touch targets visible", () => {
  const css = read("css/app.css");
  const index = read("index.html");
  const app = read("js/app.js");
  assert.match(index, /icon-button games-button/);
  assert.match(app, /setActiveRoute\(r\)/);
  assert.match(app, /r==="games"\|\|r\.startsWith\("game\/"\)/);
  assert.match(css, /\.games-button\{[^}]*min-height:48px/);
  assert.match(css, /\.games-button\.active/);
  assert.match(css, /\.game-center-card \.button\.primary\{[^}]*min-height:56px/);
  assert.match(css, /\.game-card-layout/);
  assert.match(css, /@media\(max-width:850px\)[\s\S]*\.game-center-card/);
  assert.match(css, /@media\(max-width:520px\)[\s\S]*\.top-actions/);
});

test("service worker update flow supports new cache activation", () => {
  const build = read("scripts/build.js");
  const sw = fs.existsSync(path.join(root, "service-worker.js")) ? read("service-worker.js") : "";
  assert.match(build, /SKIP_WAITING/);
  assert.match(build, /caches\.delete/);
  assert.match(build, /clients\.claim/);
  if (sw) {
    assert.match(sw, /const CACHE="beyza-english-/);
    assert.match(sw, /caches\.delete/);
  }
});
