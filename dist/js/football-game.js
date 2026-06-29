import {loadPomaManifest} from "./poma-assets.js";
import {availableFootballWords, createFootballSession, answerFootballQuestion, advanceFootball, summarizeFootball, safeRead, safeWrite, defaultFootballStats, defaultAchievements, FOOTBALL_KEYS, FOOTBALL_CONFIG, mergeMatchStats, unlockTrophies, recordFootballAnswer, shouldUseVideo, validateFootballQuestion} from "./football-engine.js";
import {createFootballAudio} from "./football-audio.js";

const esc = v => String(v ?? "").replace(/[&<>\"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let resolverPromise = null, session = null, cleanup = () => {}, audio = null, mediaToken = 0, lastSoundVisual = null, soundListenerBound = false;

export async function footballGameView(app, context) {
  cleanup();
  resolverPromise ||= loadPomaManifest();
  const resolver = await resolverPromise;
  if (!resolver) return unavailable(app);
  const words = availableFootballWords(context.vocabulary, context.state);
  if (!words.length) return empty(app);
  audio ||= createFootballAudio({ muted: context.state.settings?.muted });
  audio.setMuted(Boolean(context.state.settings?.muted));
  if (!soundListenerBound) {
    window.addEventListener("beyza-sound-change", e => audio?.setMuted(Boolean(e.detail?.muted)));
    soundListenerBound = true;
  }
  if (!session || session.phase === "MATCH_SUMMARY" || !validateFootballQuestion(session.currentQuestion)) session = createFootballSession(words, context.state);
  render(app, context, resolver, words);
}

function unavailable(app) {
  app.innerHTML = `<section class="card"><p class="eyebrow">OYUN MERKEZİ</p><h1>Futbol şu an yüklenemedi.</h1><p class="lead">Asset manifesti okunamadı. Dersler ve Kelime Kasası çalışmaya devam eder.</p><button class="button secondary" data-route="home">Ana ekran</button></section>`;
  bindRoutes(app);
}

function empty(app) {
  app.innerHTML = `<section class="card"><p class="eyebrow">FUTBOL</p><h1>Maç için kelime gerekiyor.</h1><p class="lead">Önce bir dersin Kelime Avı bölümünü çöz veya Kelime Kasası'ndan birkaç kelime çalış.</p><div class="button-row"><button class="button primary" data-route="vocabulary">Kelime Kasası'na git</button><button class="button secondary" data-route="home">Ana ekran</button></div></section>`;
  bindRoutes(app);
}

function render(app, context, resolver, words) {
  safeWrite(FOOTBALL_KEYS.session, { phase: session.phase, questionsAsked: session.questionsAsked, updatedAt: new Date().toISOString() });
  const media = resolver.result(session.visual) || resolver.state(session.visual);
  const stats = safeRead(FOOTBALL_KEYS.stats, defaultFootballStats());
  const achievements = safeRead(FOOTBALL_KEYS.achievements, defaultAchievements());
  const q = session.currentQuestion;
  const isQuestion = session.phase.endsWith("_QUESTION");
  const isSummary = session.phase === "MATCH_SUMMARY";
  app.innerHTML = `<section class="football-shell"><div class="lesson-head"><button class="button secondary" data-action="football-exit">← Oyun Merkezi</button><div class="progress"><span style="width:${Math.min(100, session.questionsAsked / session.maxQuestions * 100)}%"></span></div><span>${session.questionsAsked}/${session.maxQuestions}</span></div><article class="card football-card"><div class="football-score"><strong>Beyza ${session.goalsFor} - ${session.goalsAgainst} Rakip</strong><span>Doğru ${session.correct} · Yanlış ${session.wrong} · Kurtarış ${session.saves}</span></div><div class="football-media" aria-live="polite">${renderFootballMedia(media, resolver, session.visual)}</div>${isSummary ? summaryHtml(session, stats, achievements) : isQuestion ? questionHtml(q, session) : resultHtml(session)}</article></section>`;
  bindRoutes(app);
  app.querySelector("[data-action='football-exit']")?.addEventListener("click", () => { cleanup(); session = null; location.hash = "#/home"; });
  app.querySelector("[data-action='football-start']")?.addEventListener("click", () => { audio.unlock(); audio.startAmbient(); audio.playForVisual("MATCH_INTRO"); session = advanceFootball(session); render(app, context, resolver, words); });
  app.querySelector("[data-action='football-continue']")?.addEventListener("click", () => { session = advanceFootball(session); render(app, context, resolver, words); });
  app.querySelector("[data-action='football-again']")?.addEventListener("click", () => { session = createFootballSession(words, context.state); lastSoundVisual = null; render(app, context, resolver, words); });
  app.querySelectorAll("[data-football-answer]").forEach(button => button.addEventListener("click", () => {
    const before = session.currentQuestion;
    if (!validateFootballQuestion(before)) return;
    audio.unlock();
    audio.startAmbient();
    const selected = Number(button.dataset.footballAnswer);
    const correct = selected === before.correctIndex;
    context.updateState(x => recordFootballAnswer(x, before, correct));
    if (!correct) session.difficultWords[before.wordId] = (session.difficultWords[before.wordId] || 0) + 1;
    session = answerFootballQuestion(session, selected, words, context.state);
    lastSoundVisual = null;
    render(app, context, resolver, words);
  }));
  if (isSummary) persistSummary(context);
  else setupResultAdvance(app, context, resolver, words);
}

export function renderFootballMedia(media, resolver, event, reducedMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)")?.matches) {
  if (!media) return "";
  const video = shouldUseVideo(event, reducedMotion) ? resolver.video(event) : null;
  const poster = video?.posterUrl || media.posterUrl || media.fallbackUrl || media.url;
  const alt = esc(media.alt || "Futbol oyunu görseli");
  return `<div class="football-media-stage" data-video-event="${esc(event)}"><img class="football-media-poster is-visible" src="${esc(poster)}" alt="${alt}" loading="eager">${video ? `<video class="football-media-video" src="${esc(video.url)}" muted playsinline preload="metadata" aria-label="${alt}"></video>` : ""}</div>`;
}

function questionHtml(q, s) {
  if (!validateFootballQuestion(q)) return `<div class="football-panel"><h1>Soru hazırlanamadı</h1><p class="lead">Kelime Kasası'ndan yeni soru bekleniyor.</p></div>`;
  return `<div class="football-panel"><p class="eyebrow">${phaseTitle(s.phase)}</p><h1>${esc(q.prompt)}</h1><p class="lead">Doğru cevabı bul, atağa devam et!</p><div class="game-board">${q.options.map((x, i) => `<button class="game-door" data-football-answer="${i}">${esc(x)}</button>`).join("")}</div></div>`;
}

function resultHtml(s) {
  if (s.phase === "MATCH_INTRO") return `<div class="football-panel"><p class="eyebrow">FUTBOL V1</p><h1>Poma sahaya çıkıyor.</h1><p class="lead">10 Kelime Kasası sorusu ile mini maç oynanır.</p><button class="button primary" data-action="football-start">Maça başla →</button></div>`;
  return `<div class="football-panel"><p class="eyebrow">${s.lastResult?.correct ? "✓ Doğru hamle" : "↻ Geliştirilecek hamle"}</p><h1>${visualTitle(s.visual)}</h1><p class="lead">${esc(s.lastResult?.explanation || "Oyun akışı devam ediyor.")}</p><button class="button primary" data-action="football-continue" hidden>Devam →</button></div>`;
}

function summaryHtml(s, stats, achievements) {
  const summary = s.summary || summarizeFootball(s).summary;
  const trophies = Object.values(achievements.unlocked || {});
  return `<div class="football-panel"><p class="eyebrow">MAÇ ÖZETİ</p><h1>Skor: ${summary.score}</h1><div class="stats-grid grid"><article class="card stat"><span>Doğru / yanlış</span><strong>${summary.correct}/${summary.wrong}</strong></article><article class="card stat"><span>Başarı</span><strong>%${summary.percent}</strong></article><article class="card stat"><span>Atılan gol</span><strong>${summary.goalsFor}</strong></article><article class="card stat"><span>Kurtarış</span><strong>${summary.saves}</strong></article></div><p>Çalışılan kelime: ${summary.studiedWords}. En çok zorlanılan: ${summary.difficult.length ? summary.difficult.map(esc).join(", ") : "yok"}.</p><h2>Kupa Vitrini V1</h2><ul class="tag-list">${trophies.map(t => `<li class="tag">🏆 ${esc(t.title)}</li>`).join("") || "<li class='tag'>Kupalar maçlarla açılır.</li>"}<li class="tag">🔒 Zor Rakibi Yendin</li></ul><div class="button-row"><button class="button primary" data-action="football-again">Tekrar oyna</button><button class="button secondary" data-route="home">Oyun Merkezi'ne dön</button></div></div>`;
}

export function makeOnce(fn) {
  let called = false;
  return (...args) => {
    if (called) return false;
    called = true;
    fn?.(...args);
    return true;
  };
}

function setupResultAdvance(app, context, resolver, words) {
  const token = ++mediaToken;
  let timer = null, hardStop = null, readyTimer = null, minPosterTimer = null, posterReady = false, videoReady = false;
  const go = makeOnce(() => {
    if (token !== mediaToken) return;
    clearTimeout(timer); clearTimeout(hardStop); clearTimeout(readyTimer); clearTimeout(minPosterTimer);
    session = advanceFootball(session);
    render(app, context, resolver, words);
  });
  if (!session.phase.endsWith("_QUESTION") && session.phase !== "MATCH_INTRO" && lastSoundVisual !== session.visual) {
    audio.playForVisual(session.visual);
    lastSoundVisual = session.visual;
  }
  const video = app.querySelector(".football-media-video"), poster = app.querySelector(".football-media-poster");
  if (!video) {
    if (!session.phase.endsWith("_QUESTION") && session.phase !== "MATCH_INTRO") timer = setTimeout(go, FOOTBALL_CONFIG.resultDelayMs);
    return;
  }
  const showPoster = () => {
    if (token !== mediaToken) return;
    poster?.classList.add("is-visible");
    video.classList.remove("is-visible");
    video.pause?.();
  };
  const showVideo = () => {
    if (token !== mediaToken || !posterReady || !videoReady) return;
    poster?.classList.remove("is-visible");
    video.classList.add("is-visible");
    const play = video.play?.();
    if (play?.catch) play.catch(showPoster);
  };
  const ready = () => { videoReady = true; showVideo(); };
  const fail = () => { videoReady = false; showPoster(); };
  minPosterTimer = setTimeout(() => { posterReady = true; showVideo(); }, FOOTBALL_CONFIG.posterMinMs);
  readyTimer = setTimeout(fail, FOOTBALL_CONFIG.videoReadyTimeoutMs);
  video.addEventListener("loadeddata", ready, { once: true });
  video.addEventListener("canplay", ready, { once: true });
  video.addEventListener("ended", go, { once: true });
  video.addEventListener("error", fail, { once: true });
  video.addEventListener("stalled", fail, { once: true });
  video.muted = true;
  video.load?.();
  timer = setTimeout(() => app.querySelector("[data-action='football-continue']")?.removeAttribute("hidden"), FOOTBALL_CONFIG.continueDelayMs);
  hardStop = setTimeout(go, FOOTBALL_CONFIG.videoTimeoutMs);
  cleanup = () => {
    mediaToken++;
    clearTimeout(timer); clearTimeout(hardStop); clearTimeout(readyTimer); clearTimeout(minPosterTimer);
    try { video.pause?.(); video.currentTime = 0; } catch {}
    video.removeAttribute("src");
    video.load?.();
  };
}

function persistSummary(context) {
  const oldStats = safeRead(FOOTBALL_KEYS.stats, defaultFootballStats());
  if (oldStats.lastMatch?.completedAt === session.summary?.completedAt) return;
  session.summary ||= summarizeFootball(session).summary;
  session.summary.completedAt ||= new Date().toISOString();
  const stats = mergeMatchStats(oldStats, session, context.state.streak?.count || 0);
  const result = unlockTrophies(stats, safeRead(FOOTBALL_KEYS.achievements, defaultAchievements()));
  if (result.newlyUnlocked.length) audio.playForVisual("TROPHY");
  safeWrite(FOOTBALL_KEYS.stats, stats);
  safeWrite(FOOTBALL_KEYS.achievements, result.achievements);
}

function bindRoutes(app) { app.querySelectorAll("[data-route]").forEach(b => b.onclick = () => { location.hash = `#/${b.dataset.route}`; }); }
function phaseTitle(phase) { return ({ POSSESSION_QUESTION: "Top kimde?", GIVE_AND_GO_QUESTION: "Ver-kaç", SHOT_QUESTION: "Şut", OPPONENT_ATTACK_QUESTION: "Defans", OPPONENT_SHOT_QUESTION: "Kurtarış" })[phase] || "Futbol"; }
function visualTitle(visual) { return ({ PASS_SUCCESS: "Pas başarılı!", PASS_FAILED: "Top rakibe geçti.", GIVE_AND_GO_SUCCESS: "Ver-kaç tuttu!", GOAL_SCORED: "Gol!", GOAL_CELEBRATION: "Gol sevinci!", SHOT_MISSED_POST: "Direkten döndü.", DEFENCE_SUCCESS: "Savunma başarılı.", DEFENCE_FAILED: "Rakip geçti.", SAVE_SUCCESS: "Harika kurtarış!", GOAL_CONCEDED: "Gol yedik." })[visual] || "Devam"; }
