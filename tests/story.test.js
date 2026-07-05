import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSpeechHelper } from "../js/audio.js";
import { completeStoryQuiz, defaultStoryProgress, gradeStoryQuiz, normalizeStory, readStoryProgress, resolveStoryAsset, safeReadStoryStore, STORY_PROGRESS_KEY, validateStory, writeStoryProgress } from "../js/story-engine.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const story = normalizeStory({
  ...JSON.parse(read("data/stories/story-001.json")),
  parentSummary: { summaryTr: "", pronouns: ["I", "you", "he", "she", "it", "we", "they"], homePractice: [] },
  teacherGuide: { objective: "", duration: "25-35 dakika" },
  assetManifest: JSON.parse(read("assets/stories/story-001/asset-manifest.json"))
});

function memoryStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
    dump() { return Object.fromEntries(map); }
  };
}

test("stories route and game hub expose Poma Hikayeleri", () => {
  const app = read("js/app.js");
  assert.match(app, /r==="stories"\|\|r\.startsWith\("story\/"\)/);
  assert.match(app, /storiesListView/);
  assert.match(app, /storyDetailView/);
  assert.match(app, /\$\{storyCenterCard\(\)\}/);
  assert.match(app, /Poma Hikâyeleri|storyCenterCard/);
});

test("story 001 schema contains required data-driven fields", () => {
  const result = validateStory(story);
  assert.equal(result.ok, true, result.reason);
  assert.equal(story.storyId, "story-001");
  assert.equal(story.lessonNo, 1);
  assert.equal(story.moduleNo, 1);
  assert.equal(story.slides.length, 10);
  assert.equal(story.quiz.length, 6);
  assert.equal(story.completion.passScore, 4);
});

test("asset manifest resolves every referenced path", () => {
  for (const [id, asset] of Object.entries(story.assetManifest.assets)) {
    const resolved = resolveStoryAsset(story, id);
    assert.ok(resolved.url.startsWith("assets/stories/story-001/"));
    assert.equal(fs.existsSync(path.join(root, resolved.url)), true, asset.file);
    if (asset.poster) assert.equal(fs.existsSync(path.join(root, "assets/stories/story-001", asset.poster)), true, asset.poster);
  }
});

test("video poster fallback uses one fixed media stage", () => {
  const view = read("js/story-view.js");
  assert.match(view, /data-story-video-stage/);
  assert.match(view, /story-media-poster is-visible/);
  assert.match(view, /<video class="story-media-video"/);
  assert.match(view, /muted playsinline preload="metadata"/);
  assert.match(view, /catch\(showPoster\)/);
  assert.match(view, /removeAttribute\("src"\)/);
  assert.equal((view.match(/story-media-poster/g) || []).length >= 1, true);
  assert.doesNotMatch(view, /<video[\s\S]*<\/video>[\s\S]*<img class="story-media-poster/);
});

test("ten scenes advance in order and navigation boundaries exist", () => {
  assert.deepEqual(story.slides.map(s => s.id), ["scene-01", "scene-02", "scene-03", "scene-04", "scene-05", "scene-06", "scene-07", "scene-08", "scene-09", "scene-10"]);
  const view = read("js/story-view.js");
  assert.match(view, /storyRuntime\.slideIndex === 0 \? "disabled"/);
  assert.match(view, /storyRuntime\.slideIndex < story\.slides\.length - 1/);
});

test("all subject pronouns appear in scenes and quiz does not assess be forms", () => {
  const text = story.slides.flatMap(s => [...(s.text || []), ...(s.focusTokens || [])]).join(" ").toLowerCase();
  for (const pronoun of ["i", "you", "he", "she", "it", "we", "they"]) assert.match(text, new RegExp(`\\b${pronoun}\\b`));
  for (const q of story.quiz) {
    assert.doesNotMatch(q.prompt.toLowerCase(), /\bam\b|\bis\b|\bare\b/);
    assert.doesNotMatch(q.answer.toLowerCase(), /am|is|are/);
  }
});

test("quiz answers are immutable, unique and Turkish feedback appears on wrong answer", () => {
  for (const q of story.quiz) {
    assert.equal(Object.isFrozen(q), true);
    assert.equal(Object.isFrozen(q.options), true);
    assert.equal(new Set(q.options).size, q.options.length);
    assert.equal(q.options.filter(x => x === q.answer).length, 1);
    assert.match(q.feedbackTr, /[çğıİöşü]/);
  }
  const result = gradeStoryQuiz(story, Object.fromEntries(story.quiz.map(q => [q.id, "__wrong__"])));
  assert.equal(result.score, 0);
  assert.equal(result.wrongPronouns.length, 6);
});

test("shared speech helper reads story text, respects mute and recovers from failures", () => {
  const spoken = [];
  let cancelCount = 0;
  const helper = createSpeechHelper({ synthesis: { cancel() { cancelCount++; }, speak(u) { spoken.push(u.text); } }, Utterance: class { constructor(text) { this.text = text; } } });
  assert.equal(helper.speak("Hello! I am Poma."), true);
  assert.deepEqual(spoken, ["Hello! I am Poma."]);
  assert.equal(helper.speak("He is Poma Dahi."), true);
  assert.equal(cancelCount, 2);
  helper.setMuted(true);
  assert.equal(helper.speak("Muted"), false);
  const broken = createSpeechHelper({ synthesis: { cancel() { throw new Error("no voice"); } }, Utterance: class {} });
  assert.equal(broken.speak("Still works"), false);
  assert.equal(broken.state.failures, 1);
});

test("story card speech maps each character once and cancels the prior utterance", () => {
  const spoken = [];
  let cancelCount = 0;
  const helper = createSpeechHelper({ synthesis: { cancel() { cancelCount++; }, speak(u) { spoken.push(u.text); } }, Utterance: class { constructor(text) { this.text = text; } } });
  for (const sentence of ["He is Poma Dahi.", "She is Influencer Poma.", "It is a little wolf."]) {
    assert.equal(helper.speak(sentence), true);
  }
  assert.deepEqual(spoken, ["He is Poma Dahi.", "She is Influencer Poma.", "It is a little wolf."]);
  assert.equal(cancelCount, 3);
});

test("scene 9 character cards speak the mapped sentence and use buttons", () => {
  const view = read("js/story-view.js");
  assert.match(view, /<button class="story-character-card" type="button"/);
  assert.match(view, /data-story-card-speech/);
  assert.match(view, /He is Poma Dahi\./);
  assert.match(view, /She is Influencer Poma\./);
  assert.match(view, /It is a little wolf\./);
  assert.match(view, /aria-label="\$\{esc\(`\$\{sentence\} Dinle`\)\}"/);
  assert.doesNotMatch(view, /keydown|keypress|keyup/);
});

test("little wolf card uses the single wolf asset without Bozkurt Poma", () => {
  const manifest = story.assetManifest.assets;
  const scene9 = story.slides.find(s => s.id === "scene-09");
  const itPair = scene9.interaction.pairs.find(pair => pair.pronoun === "it");
  assert.equal(itPair.mediaId, "little-wolf");
  assert.equal(story.quiz.find(q => q.id === "q4").mediaId, "little-wolf");
  assert.equal(manifest["little-wolf"].file, "story-001-little-wolf.png");
  assert.equal(fs.existsSync(path.join(root, "assets/stories/story-001/story-001-little-wolf.png")), true);
  assert.notEqual(itPair.mediaId, "bozkurt-wolf-castle");
});

test("scene 7 and quiz 5 reuse the Poma plus learner visual", () => {
  const view = read("js/story-view.js");
  const scene7 = story.slides.find(s => s.id === "scene-07");
  const quiz5 = story.quiz.find(q => q.id === "q5");
  assert.equal(scene7.interaction.uiOverlay, "poma-plus-learner");
  assert.equal(quiz5.uiOverlay, "poma-plus-learner");
  assert.equal(quiz5.answer, "we");
  assert.match(view, /function renderPomaPlusLearner/);
  assert.match(view, /Poma \+ You/);
  assert.match(view, /class="learner-badge"/);
});

test("quiz 6 keeps the group visual and they answer", () => {
  const quiz6 = story.quiz.find(q => q.id === "q6");
  assert.equal(quiz6.mediaId, "poma-group-lineup");
  assert.equal(quiz6.answer, "they");
  assert.equal(quiz6.prompt, "Look at the Poma group. Choose the pronoun.");
});

test("story card speech respects global mute", () => {
  const spoken = [];
  const helper = createSpeechHelper({ muted: true, synthesis: { cancel() {}, speak(u) { spoken.push(u.text); } }, Utterance: class { constructor(text) { this.text = text; } } });
  assert.equal(helper.speak("It is a little wolf."), false);
  assert.deepEqual(spoken, []);
});

test("no story MP3 or external TTS dependency is introduced", () => {
  const files = ["js/story-view.js", "js/story-engine.js", "js/audio.js", "package.json"].map(read).join("\n");
  assert.doesNotMatch(files, /tts|apiKey|api-key|openai|elevenlabs|google.*speech/i);
  assert.equal(fs.readdirSync(path.join(root, "assets/stories/story-001")).some(name => name.endsWith(".mp3")), false);
});

test("story progress is isolated per active student storage and broken records recover", () => {
  const childA = memoryStorage();
  const childB = memoryStorage();
  writeStoryProgress(childA, "story-001", p => ({ ...p, opened: true, lastScene: 4 }));
  writeStoryProgress(childB, "story-001", p => ({ ...p, opened: true, lastScene: 1 }));
  assert.equal(readStoryProgress(childA, "story-001").lastScene, 4);
  assert.equal(readStoryProgress(childB, "story-001").lastScene, 1);
  assert.deepEqual(safeReadStoryStore(memoryStorage({ [STORY_PROGRESS_KEY]: "not-json" })), { schemaVersion: 1, stories: {} });
});

test("4 of 6 completes story and reward is granted only once", () => {
  const storage = memoryStorage();
  const answers = Object.fromEntries(story.quiz.map((q, index) => [q.id, index < 4 ? q.answer : "__wrong__"]));
  const first = completeStoryQuiz(storage, story, answers);
  assert.equal(first.completed, true);
  assert.equal(first.quizScore, 4);
  assert.equal(first.rewardGranted, true);
  const second = completeStoryQuiz(storage, story, answers);
  assert.equal(second.rewardGranted, true);
  assert.equal(second.completedAt, first.completedAt);
});

test("students cannot see parent or teacher story material and parent without child is guarded", () => {
  const app = read("js/app.js");
  const view = read("js/story-view.js");
  assert.match(app, /\["student","parent","both"\]\.includes\(acctType\)&&!getActiveStudentId/);
  assert.match(app, /acctType==="teacher"/);
  assert.match(app, /canUseTeacherTools/);
  assert.match(view, /if \(role === "teacher"\) return teacherStoryView/);
  assert.match(view, /if \(role === "parent" \|\| role === "both"\) return parentStoryView/);
});

test("parent and approved teacher outputs include required story fields", () => {
  const view = read("js/story-view.js");
  assert.match(view, /summaryTr/);
  assert.match(view, /homePractice/);
  assert.match(view, /quizScore/);
  assert.match(view, /wrongPronouns/);
  assert.match(view, /duration/);
  assert.match(view, /answerKey/);
  assert.match(view, /successCriteria/);
});

test("responsive story CSS keeps one 16:9 media box and large touch targets", () => {
  const css = read("css/story.css");
  assert.match(css, /\.story-media-stage\{[^}]*aspect-ratio:16\/9/);
  assert.match(css, /\.story-pronoun-options \.option\{[^}]*min-height:48px/);
  assert.match(css, /@media\(max-width:900px\)/);
  assert.match(css, /@media\(max-width:520px\)/);
  assert.match(css, /@media\(min-width:1500px\)/);
});

test("build and service worker include story data and assets", () => {
  const build = read("scripts/build.js");
  assert.match(build, /storyAssets=walk\("assets\/stories"\)/);
  assert.match(build, /"css\/story\.css"/);
  assert.match(build, /"js\/story-engine\.js"/);
  assert.match(build, /"js\/story-view\.js"/);
  assert.match(build, /"data\/stories\/story-001\.json"/);
});
