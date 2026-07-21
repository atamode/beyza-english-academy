import { loadVolleyballManifest } from "./volleyball-assets.js";
import { renderSportMedia } from "./sport-media.js";
import { createFootballAudio } from "./football-audio.js";
import { leagueProgressPercent, readFootballLeagueProgress } from "./football-engine.js";
import {recordSportAnswer,recordSportGameCompletion} from "./football-engine.js";
import {getActiveStudentId} from "./account-storage.js";
import {
  availableVolleyballWords,
  createVolleyballSession,
  answerVolleyballQuestion,
  advanceVolleyball,
  summarizeVolleyball,
  safeRead,
  safeWrite,
  defaultVolleyballStats,
  defaultVolleyballAchievements,
  VOLLEYBALL_KEYS,
  VOLLEYBALL_CONFIG,
  mergeVolleyballStats,
  unlockVolleyballTrophies,
  recordFootballLeagueAnswer,
  finalizeFootballLeagueMatch,
  shouldUseVolleyballVideo,
  validateVolleyballQuestion
} from "./volleyball-engine.js";

const esc = v => String(v ?? "").replace(/[&<>\"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let resolverPromise = null, session = null, cleanup = () => {}, audio = null, mediaToken = 0, lastSoundVisual = null, soundListenerBound = false;
export const VOLLEYBALL_AUTO_ADVANCE = {
  correctPosterMs: 1300,
  wrongPosterMs: 2800,
  videoSkipButtonMs: 1500
};

export async function volleyballGameView(app, context) {
  cleanup();
  resolverPromise ||= loadVolleyballManifest();
  const resolver = await resolverPromise;
  if (!resolver) return unavailable(app);
  const words = availableVolleyballWords(context.vocabulary, context.state);
  if (!words.length) return empty(app);
  audio ||= createFootballAudio({ muted: context.state.settings?.muted });
  audio.setMuted(Boolean(context.state.settings?.muted));
  if (!soundListenerBound) {
    window.addEventListener("beyza-sound-change", e => audio?.setMuted(Boolean(e.detail?.muted)));
    soundListenerBound = true;
  }
  if (!session || session.phase === "MATCH_SUMMARY" || !validateVolleyballQuestion(session.currentQuestion)) session = createVolleyballSession(words, context.state);
  render(app, context, resolver, words);
}

function unavailable(app) {
  app.innerHTML = `<section class="card"><p class="eyebrow">OYUN MERKEZİ</p><h1>Voleybol şu an yüklenemedi.</h1><p class="lead">Asset manifesti okunamadı. Dersler ve Kelime Kasası çalışmaya devam eder.</p><button class="button secondary" data-route="games">Oyun Merkezi</button></section>`;
  bindRoutes(app);
}

function empty(app) {
  app.innerHTML = `<section class="card"><p class="eyebrow">VOLEYBOL</p><h1>Set için kelime gerekiyor.</h1><p class="lead">Kelime listesi yüklenemedi. Kelime Kasası açılıyorsa oyunu tekrar deneyebilirsin.</p><div class="button-row"><button class="button primary" data-route="vocabulary">Kelime Kasası'na git</button><button class="button secondary" data-route="games">Oyun Merkezi</button></div></section>`;
  bindRoutes(app);
}

function render(app, context, resolver, words) {
  cleanup();
  cleanup = () => {};
  safeWrite(VOLLEYBALL_KEYS.session, { phase: session.phase, questionsAsked: session.questionsAsked, updatedAt: new Date().toISOString() });
  const media = resolver.result(session.visual) || resolver.state(session.visual);
  const stats = safeRead(VOLLEYBALL_KEYS.stats, defaultVolleyballStats());
  const achievements = safeRead(VOLLEYBALL_KEYS.achievements, defaultVolleyballAchievements());
  const q = session.currentQuestion;
  const isQuestion = session.phase.endsWith("_QUESTION");
  const isSummary = session.phase === "MATCH_SUMMARY";
  app.innerHTML = `<section class="football-shell volleyball-shell"><div class="lesson-head"><button class="button secondary" data-action="volleyball-exit">← Oyun Merkezi</button><div class="progress"><span style="width:${Math.min(100, session.questionsAsked / Math.max(1, session.maxQuestions) * 100)}%"></span></div><span>${session.questionsAsked}/${session.maxQuestions}</span></div><article class="card football-card volleyball-card"><div class="football-score"><strong>Beyza ${session.pointsFor} - ${session.pointsAgainst} Rakip</strong><span>${esc(session.leagueLabel || "Başlangıç Ligi")} · Doğru ${session.correct} · Yanlış ${session.wrong} · Blok ${session.blocks} · Kurtarış ${session.saves}</span></div><div class="football-media" aria-live="polite">${renderVolleyballMedia(media, resolver, session.visual)}</div>${isSummary ? summaryHtml(session, stats, achievements) : isQuestion ? questionHtml(q, session) : resultHtml(session)}</article></section>`;
  bindRoutes(app);
  app.querySelector("[data-action='volleyball-exit']")?.addEventListener("click", () => { cleanup(); audio.stopAmbient?.(); session = null; location.hash = "#/games"; });
  app.querySelector("[data-action='volleyball-start']")?.addEventListener("click", () => { audio.unlock(); audio.startAmbient(); audio.playForVisual("MATCH_INTRO"); session = advanceVolleyball(session); render(app, context, resolver, words); });
  app.querySelector("[data-action='volleyball-again']")?.addEventListener("click", () => { session = createVolleyballSession(words, context.state); lastSoundVisual = null; render(app, context, resolver, words); });
  app.querySelectorAll("[data-volleyball-answer]").forEach(button => button.addEventListener("click", () => {
    const before = session.currentQuestion;
    if (!validateVolleyballQuestion(before)) return;
    audio.unlock();
    audio.startAmbient();
    const selected = Number(button.dataset.volleyballAnswer);
    const correct = selected === before.correctIndex;
    if(getActiveStudentId())context.updateState(x => recordSportAnswer(x,before,correct,{sport:"volleyball",matchId:session.matchId,index:session.questionsAsked}));
    const leagueRecord = recordFootballLeagueAnswer(before, correct, session.matchId);
    if (leagueRecord.mastered && correct) session.masteredThisMatch = [...new Set([...(session.masteredThisMatch || []), before.wordId])];
    if (!correct) session.difficultWords[before.wordId] = (session.difficultWords[before.wordId] || 0) + 1;
    session = answerVolleyballQuestion(session, selected, words, context.state);
    lastSoundVisual = null;
    render(app, context, resolver, words);
  }));
  if (isSummary) persistSummary(context);
  else setupResultAdvance(app, context, resolver, words);
}

export function renderVolleyballMedia(media, resolver, event, reducedMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)")?.matches) {
  return renderSportMedia(media, resolver, event, { useVideo: shouldUseVolleyballVideo(event, reducedMotion), alt: "Voleybol oyunu görseli" });
}

function questionHtml(q, s) {
  if (!validateVolleyballQuestion(q)) return `<div class="football-panel"><h1>Soru hazırlanamadı</h1><p class="lead">Kelime Ligi yeni soru hazırlıyor.</p></div>`;
  return `<div class="football-panel"><p class="eyebrow">${phaseTitle(s.phase)} · ${esc(s.leagueLabel)}</p><h1>${esc(q.prompt)}</h1><p class="lead">Doğru cevabı bul, sayıya yaklaş!</p><div class="game-board">${q.options.map((x, i) => `<button class="game-door" data-volleyball-answer="${i}">${esc(x)}</button>`).join("")}</div></div>`;
}

function resultHtml(s) {
  if (s.phase === "MATCH_INTRO") return `<div class="football-panel"><p class="eyebrow">VOLEYBOL V1 · ${esc(s.leagueLabel || "Başlangıç Ligi")}</p><h1>Poma sete çıkıyor.</h1><p class="lead">Kelime Ligi bu set için ${s.maxQuestions} soru hazırladı. Futbolda öğrendiğin kelime ilerlemesi burada da devam eder.</p><button class="button primary" data-action="volleyball-start">Sete başla →</button></div>`;
  return `<div class="football-panel"><p class="eyebrow">${s.lastResult?.correct ? "✓ Doğru hamle" : "↻ Geliştirilecek hamle"}</p><h1>${visualTitle(s.visual)}</h1><p class="lead">${esc(s.lastResult?.explanation || "Oyun akışı devam ediyor.")}</p><button class="button primary" data-action="volleyball-continue" hidden>Hemen Devam Et →</button></div>`;
}

function summaryHtml(s, stats, achievements) {
  const summary = s.summary || summarizeVolleyball(s).summary;
  const progress = leagueProgressPercent(readFootballLeagueProgress());
  const trophies = Object.values(achievements.unlocked || {});
  const difficultWords = Object.entries(s.difficultWords || {}).map(([id]) => s.matchQuestions.find(q => q.wordId === id)?.word?.word).filter(Boolean);
  return `<div class="football-panel"><p class="eyebrow">SET ÖZETİ · ${esc(summary.leagueLabel || s.leagueLabel || "Başlangıç Ligi")}</p><h1>Skor: ${summary.score}</h1><div class="stats-grid grid"><article class="card stat"><span>Doğru / yanlış</span><strong>${summary.correct}/${summary.wrong}</strong></article><article class="card stat"><span>Başarı</span><strong>%${summary.percent}</strong></article><article class="card stat"><span>Yeni kelime</span><strong>${summary.newWords}</strong></article><article class="card stat"><span>Blok / kurtarış</span><strong>${summary.blocks || 0}/${summary.saves || 0}</strong></article></div><p>Öğrenilen kelime: ${summary.learnedWords}. Tekrar edilmesi gereken kelime: ${summary.reviewWords}. Sonraki lige ilerleme: %${progress}. Zorlanılan: ${difficultWords.length ? difficultWords.map(esc).join(", ") : "yok"}.</p><h2>Kupa Vitrini V1</h2><ul class="tag-list">${trophies.map(t => `<li class="tag">🏆 ${esc(t.title)}</li>`).join("") || "<li class='tag'>Kupalar setlerle açılır.</li>"}</ul><div class="button-row"><button class="button primary" data-action="volleyball-again">Tekrar oyna</button><button class="button secondary" data-route="games">Oyun Merkezi'ne dön</button></div></div>`;
}

function makeOnce(fn) {
  let called = false;
  return (...args) => {
    if (called) return false;
    called = true;
    fn?.(...args);
    return true;
  };
}

export function volleyballResultDelayMs(s) {
  if (s?.visual === "lose" || s?.lastResult?.correct === false) return VOLLEYBALL_AUTO_ADVANCE.wrongPosterMs;
  return VOLLEYBALL_AUTO_ADVANCE.correctPosterMs;
}

function setupResultAdvance(app, context, resolver, words) {
  const token = ++mediaToken;
  let timer = null, hardStop = null, readyTimer = null, minPosterTimer = null, skipButtonTimer = null, posterReady = false, videoReady = false, videoStarted = false, metadataSeen = false;
  const autoDelay = volleyballResultDelayMs(session);
  const continueButton = app.querySelector("[data-action='volleyball-continue']");
  const go = makeOnce(() => {
    if (token !== mediaToken) return;
    clearTimeout(timer); clearTimeout(hardStop); clearTimeout(readyTimer); clearTimeout(minPosterTimer); clearTimeout(skipButtonTimer);
    audio.restoreAfterVideo?.({ resume: session.phase !== "FINAL_VIDEO" });
    session = advanceVolleyball(session);
    render(app, context, resolver, words);
  });
  continueButton?.addEventListener("click", go);
  const video = app.querySelector(".football-media-video"), poster = app.querySelector(".football-media-poster");
  if (!video) {
    if (!session.phase.endsWith("_QUESTION") && session.phase !== "MATCH_INTRO" && session.phase !== "FINAL_VIDEO" && lastSoundVisual !== session.visual) {
      audio.playForVisual(session.visual);
      lastSoundVisual = session.visual;
    }
    if (!session.phase.endsWith("_QUESTION") && session.phase !== "MATCH_INTRO") {
      continueButton?.removeAttribute("hidden");
      timer = setTimeout(go, autoDelay);
    }
    cleanup = () => {
      mediaToken++;
      clearTimeout(timer);
    };
    return;
  }
  const finalVideo = session.phase === "FINAL_VIDEO";
  const readyTimeoutMs = finalVideo ? 15000 : VOLLEYBALL_CONFIG.videoReadyTimeoutMs;
  const hardStopMs = finalVideo ? 15000 : VOLLEYBALL_CONFIG.videoTimeoutMs;
  const detachVideo = audio.attachVideo?.(video) || (() => {});
  const syncVideoMute = e => { video.muted = Boolean(e.detail?.muted); };
  window.addEventListener("beyza-sound-change", syncVideoMute);
  const showPoster = () => {
    if (token !== mediaToken) return;
    poster?.classList.add("is-visible");
    video.classList.remove("is-visible");
    video.pause?.();
  };
  const showVideo = () => {
    if (token !== mediaToken || !posterReady || !videoReady) return;
    clearTimeout(readyTimer);
    poster?.classList.remove("is-visible");
    video.classList.add("is-visible");
    audio.duckForVideo?.(video, { resume: !finalVideo });
    const play = video.play?.();
    if (!finalVideo && !skipButtonTimer) skipButtonTimer = setTimeout(() => continueButton?.removeAttribute("hidden"), VOLLEYBALL_AUTO_ADVANCE.videoSkipButtonMs);
    if (play?.catch) play.catch(() => {
      try {
        video.muted = true;
        const retry = video.play?.();
        if (retry?.catch) retry.catch(fail);
      } catch { fail(); }
    });
  };
  const ready = () => { videoReady = true; showVideo(); };
  const playing = () => { videoStarted = true; clearTimeout(readyTimer); };
  const metadata = () => {
    if (!finalVideo || token !== mediaToken) return;
    metadataSeen = true;
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration * 1000 + 3000 : 15000;
    clearTimeout(hardStop);
    hardStop = setTimeout(go, Math.max(15000, duration));
  };
  const fail = () => {
    videoReady = false;
    showPoster();
    audio.restoreAfterVideo?.({ resume: !finalVideo });
    clearTimeout(readyTimer); clearTimeout(hardStop); clearTimeout(skipButtonTimer);
    continueButton?.removeAttribute("hidden");
    if (!timer) timer = setTimeout(go, autoDelay);
  };
  minPosterTimer = setTimeout(() => { posterReady = true; showVideo(); }, VOLLEYBALL_CONFIG.posterMinMs);
  readyTimer = setTimeout(fail, readyTimeoutMs);
  video.addEventListener("loadedmetadata", metadata, { once: true });
  video.addEventListener("loadeddata", ready, { once: true });
  video.addEventListener("canplay", ready, { once: true });
  video.addEventListener("playing", playing, { once: true });
  video.addEventListener("ended", go, { once: true });
  video.addEventListener("error", fail, { once: true });
  video.load?.();
  hardStop = setTimeout(() => {
    if (videoStarted && !video.ended && !video.error) return;
    go();
  }, hardStopMs);
  cleanup = () => {
    mediaToken++;
    clearTimeout(timer); clearTimeout(hardStop); clearTimeout(readyTimer); clearTimeout(minPosterTimer); clearTimeout(skipButtonTimer);
    audio.restoreAfterVideo?.({ resume: !finalVideo });
    window.removeEventListener("beyza-sound-change", syncVideoMute);
    video.removeEventListener("loadedmetadata", metadata);
    video.removeEventListener("loadeddata", ready);
    video.removeEventListener("canplay", ready);
    video.removeEventListener("playing", playing);
    video.removeEventListener("ended", go);
    video.removeEventListener("error", fail);
    detachVideo();
    try { video.pause?.(); video.currentTime = 0; } catch {}
    video.removeAttribute("src");
    video.load?.();
  };
}

function persistSummary(context) {
  const oldStats = safeRead(VOLLEYBALL_KEYS.stats, defaultVolleyballStats());
  if (oldStats.lastMatch?.completedAt && oldStats.lastMatch.completedAt === session.summary?.completedAt) return;
  session.summary ||= summarizeVolleyball(session).summary;
  session.summary.completedAt ||= new Date().toISOString();
  if(getActiveStudentId())context.updateState(state=>recordSportGameCompletion(state,session,"volleyball"));
  const stats = mergeVolleyballStats(oldStats, session, context.state.streak?.count || 0);
  finalizeFootballLeagueMatch(session);
  const result = unlockVolleyballTrophies(stats, safeRead(VOLLEYBALL_KEYS.achievements, defaultVolleyballAchievements()));
  if (result.newlyUnlocked.length) audio.playForVisual("TROPHY");
  safeWrite(VOLLEYBALL_KEYS.stats, stats);
  safeWrite(VOLLEYBALL_KEYS.achievements, result.achievements);
}

function bindRoutes(app) { app.querySelectorAll("[data-route]").forEach(b => b.onclick = () => { location.hash = `#/${b.dataset.route}`; }); }
function phaseTitle(phase) { return ({ POSSESSION_QUESTION: "Servis kimde?", PASS_QUESTION: "Manşet", SPIKE_QUESTION: "Smaç", RECEIVE_QUESTION: "Karşılama", OPPONENT_SPIKE_QUESTION: "Blok / kurtarış" })[phase] || "Voleybol"; }
function visualTitle(visual) { return ({ passSuccess: "Manşet başarılı!", shotSuccess: "Sayı!", shotMissed: "Bloklandı / sayı olmadı.", saveSuccess: "Top kurtarıldı!", defenceSuccess: "Blok başarılı!", conceded: "Rakip sayı aldı.", win: "Seti kazandın!", lose: "Bu set olmadı." })[visual] || "Devam"; }
