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
  assert.match(app, /r==="game\/volleyball"\)return volleyballGameView/);
  assert.doesNotMatch(app, /!state\.onboardingComplete&&r==="games"/);
  assert.doesNotMatch(app, /!state\.onboardingComplete&&r==="game\/football"/);
  assert.doesNotMatch(app, /!state\.onboardingComplete&&r==="game\/volleyball"/);
  assert.match(app, /Poma ile Vakit Geçir/);
  assert.match(index, /class="icon-button games-button" data-route="games"/);
});

test("signed-out home keeps auth controls first and shows public entertainment", () => {
  const app = read("js/app.js");
  const authLanding = app.match(/function authLanding\(\)\{([\s\S]*?)\nfunction loginPage/);
  assert.ok(authLanding, "auth landing renderer must exist");
  assert.match(authLanding[1], /authLandingView\(\)/);
  assert.match(authLanding[1], /gamesHubContent\(\{embedded:true\}\)/);
  assert.ok(authLanding[1].indexOf("authLandingView()") < authLanding[1].indexOf("gamesHubContent({embedded:true})"), "auth controls should render above entertainment");
  assert.match(app, /function gamesHubContent\(\{embedded=false\}=\{\}\)/);
  assert.match(app, /data-route-page="\$\{embedded\?"public-home-games":"games"\}"/);
  assert.match(app, /data-route="\$\{embedded\?"games":"home"\}"/);
  assert.match(app, /r==="games"\)return gamesHub\(\)/);
  assert.match(app, /if\(account\.status!=="signed-in"\)return authLanding\(\)/);
});

test("welcome Poma ile Vakit Gecir opens the same games hub as the header", () => {
  const app = read("js/app.js");
  const index = read("index.html");
  const welcome = app.match(/function welcome\(\)\{([\s\S]*?)\nfunction home\(\)/);
  assert.ok(welcome, "welcome renderer must exist");
  assert.match(welcome[1], /Poma ile Vakit Ge(?:Ã§|ç)ir/);
  assert.match(welcome[1], /data-action="quick-games"/);
  assert.match(welcome[1], /querySelector\("\[data-action='quick-games'\]"\)\?\.addEventListener\("click",\(\)=>navigate\("games"\)\)/);
  assert.doesNotMatch(welcome[1], /navigate\("game\/football"\)/);
  assert.doesNotMatch(welcome[1], /beyzaFootballReturnRoute/);
  assert.match(index, /class="icon-button games-button" data-route="games"/);
  assert.doesNotMatch(app, /data-action="quick-football"/);
});

test("games hub keeps football volleyball and stories cards with direct routes unchanged", () => {
  const app = read("js/app.js");
  const gamesHub = app.match(/function gamesHubContent\(\{embedded=false\}=\{\}\)\{([\s\S]*?)`\}/);
  assert.ok(gamesHub, "gamesHub renderer must exist");
  assert.match(gamesHub[1], /\$\{storyCenterCard\(\)\}/);
  assert.match(gamesHub[1], /\$\{gameCenterCard\(\)\}/);
  assert.match(gamesHub[1], /\$\{volleyballGameCard\(\)\}/);
  assert.match(app, /r==="game\/football"\)return footballGameView/);
  assert.match(app, /r==="game\/volleyball"\)return volleyballGameView/);
  assert.match(app, /r==="stories"\|\|r\.startsWith\("story\/"\)\)return storyRoute\(r\)/);
  assert.match(read("js/story-view.js"), /data-route="stories"/);
});

test("home renders student dashboard before curriculum", () => {
  const app = read("js/app.js");
  const heroIndex = app.indexOf("POMA ACADEMY");
  const lessonIndex = app.indexOf("data-home-block=\"today-lesson\"");
  const vocabIndex = app.indexOf("data-home-block=\"vocabulary\"");
  const reinforceIndex = app.indexOf("data-home-block=\"reinforce-games\"");
  const progressIndex = app.indexOf("data-home-block=\"progress\"");
  const curriculumIndex = app.indexOf("<section class=\"module-list\"><h2>Müfredat</h2>");
  assert.ok(heroIndex > -1, "Poma Academy brand should be visible on home");
  assert.ok(lessonIndex > -1, "today lesson block exists");
  assert.ok(vocabIndex > -1, "vocabulary block exists");
  assert.ok(reinforceIndex > -1, "reinforcement games block exists");
  assert.ok(curriculumIndex > -1, "curriculum exists");
  assert.ok(heroIndex < lessonIndex && lessonIndex < vocabIndex && vocabIndex < reinforceIndex && reinforceIndex < progressIndex, "home order should be brand, lesson, vocabulary, games, progress");
  assert.ok(reinforceIndex < curriculumIndex, "reinforcement games should sit above curriculum");
  assert.equal(app.includes("football-actions"), false, "old bottom football card should not be appended after curriculum");
});

test("home presents games as vocabulary reinforcement, not a single football banner", () => {
  const app = read("js/app.js");
  const home = app.match(/function home\(\)\{([\s\S]*?)`;bindRoutes\(\)\}/);
  assert.ok(home, "home renderer must exist");
  assert.match(home[1], /Poma Academy|POMA ACADEMY/);
  assert.match(home[1], /Bugün öğrenmeye devam edelim/);
  assert.match(home[1], /assets\/brand\/poma-academy\/poma-main-wave\.png/);
  assert.match(home[1], /assets\/brand\/poma-academy\/pomante-kingdom-wide\.jpg/);
  assert.match(home[1], /assets\/brand\/poma-academy\/poma-character-lineup\.png/);
  assert.match(home[1], /data-home-block="reinforce-games"/);
  assert.match(home[1], /\$\{gameCenterCard\(\{home:true\}\)\}/);
  assert.match(home[1], /\$\{volleyballGameCard\(\{home:true\}\)\}/);
  assert.match(home[1], /data-route="games"/);
  assert.doesNotMatch(home[1], /gameCenterCard\(\{compact:true\}\)/);
});

test("games route renders football and volleyball game center cards, not the home curriculum", () => {
  const app = read("js/app.js");
  const match = app.match(/function gamesHubContent\(\{embedded=false\}=\{\}\)\{([\s\S]*?)`\}/);
  const footballCard = app.match(/function gameCenterCard[\s\S]*?\{([\s\S]*?)`\}/);
  const volleyballCard = app.match(/function volleyballGameCard[\s\S]*?\{([\s\S]*?)`\}/);
  assert.ok(match, "gamesHub renderer must exist");
  assert.ok(footballCard, "football game card renderer must exist");
  assert.ok(volleyballCard, "volleyball game card renderer must exist");
  const html = match[1];
  assert.match(html, /data-route-page="\$\{embedded\?"public-home-games":"games"\}"/);
  assert.match(html, /<h1>Poma ile Vakit Geçir<\/h1>/);
  assert.match(html, /Oyna, oku, dinle ve Poma ile İngilizce öğren\./);
  assert.match(html, /\$\{gameCenterCard\(\)\}/);
  assert.match(html, /\$\{volleyballGameCard\(\)\}/);
  assert.match(footballCard[1], /Sporty Poma Futbol V1/);
  assert.match(footballCard[1], /data-route="game\/football">/);
  assert.match(volleyballCard[1], /Poma Voleybol V1/);
  assert.match(volleyballCard[1], /data-route="game\/volleyball">/);
  assert.doesNotMatch(html, /BUGÜNÜN PLANI/);
  assert.doesNotMatch(html, /Müfredat/);
  assert.doesNotMatch(app, /Voleybol mini oyunu hazır olduğunda burada açılacak/);
});

test("football return route preserves the previous screen", () => {
  const app = read("js/app.js");
  const football = read("js/football-game.js");
  assert.match(app, /beyzaFootballReturnRoute/);
  assert.match(app, /if\(b\.dataset\.route==="game\/football"\)sessionStorage\.setItem\("beyzaFootballReturnRoute",getRoute\(\)\|\|"home"\)/);
  assert.match(football, /beyzaFootballReturnRoute/);
  assert.match(football, /location\.hash = `#\/\$\{back\}`/);
});

test("tablet navigation and dashboard cards keep touch targets visible", () => {
  const css = read("css/app.css");
  const index = read("index.html");
  const app = read("js/app.js");
  assert.match(index, /icon-button games-button/);
  assert.match(index, /<strong>Poma<\/strong><small>Academy<\/small>/);
  assert.match(app, /setActiveRoute\(r\)/);
  assert.match(app, /r==="games"\|\|r\.startsWith\("game\/"\)/);
  assert.match(css, /\.games-button\{[^}]*min-height:48px/);
  assert.match(css, /\.games-button\.active/);
  assert.match(css, /\.game-center-card \.button\.primary\{[^}]*min-height:56px/);
  assert.match(css, /\.game-card-layout/);
  assert.match(css, /\.dashboard-priority-grid/);
  assert.match(css, /\.home-games-grid/);
  assert.match(css, /\.poma-hero-art img/);
  assert.match(css, /\.poma-world-strip img/);
  assert.match(css, /\.poma-lineup/);
  assert.match(css, /@media\(max-width:850px\)[\s\S]*\.game-center-card/);
  assert.match(css, /@media\(max-width:920px\)[\s\S]*\.home-games-grid/);
  assert.match(css, /@media\(max-width:520px\)[\s\S]*\.top-actions/);
});

test("global sound toggle syncs visible state and dispatches live mute changes", () => {
  const app = read("js/app.js");
  assert.match(app, /const soundButton=document\.querySelector\("#sound-toggle"\),syncSoundButton=/);
  assert.match(app, /soundButton\.setAttribute\("aria-pressed",String\(Boolean\(state\.settings\.muted\)\)\)/);
  assert.match(app, /soundButton\.childNodes\[0\]\.nodeValue=state\.settings\.muted\?"🔇":"🔊"/);
  assert.match(app, /window\.dispatchEvent\(new CustomEvent\("beyza-sound-change",\{detail:\{muted:state\.settings\.muted\}\}\)\)/);
  assert.match(app, /if\(state\.settings\.muted\)stopAudio\(\)/);
});

test("service worker update flow supports new cache activation", () => {
  const build = read("scripts/build.js");
  const sw = fs.existsSync(path.join(root, "service-worker.js")) ? read("service-worker.js") : "";
  assert.match(build, /SKIP_WAITING/);
  assert.match(build, /caches\.delete/);
  assert.match(build, /clients\.claim/);
  assert.match(build, /brandAssets=walk\("assets\/brand"\)/);
  assert.doesNotMatch(build, /assets\/video/);
  const app = read("js/app.js");
  assert.match(app, /controllerchange/);
  assert.match(app, /let refreshing=false/);
  assert.match(app, /if\(refreshing\)return/);
  if (sw) {
    assert.match(sw, /const CACHE="beyza-english-/);
    assert.match(sw, /caches\.delete/);
  }
});
