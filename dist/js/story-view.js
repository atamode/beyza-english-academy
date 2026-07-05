import { speak, stopAudio, createSpeechHelper } from "./audio.js";
import { activeStudentStorage } from "./account-storage.js";
import { completeStoryQuiz, gradeStoryQuiz, loadStoryBundle, markStoryOpened, readStoryProgress, resolveStoryAsset, updateStoryScene } from "./story-engine.js";

const esc = value => String(value ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let storyRuntime = { bundle: null, slideIndex: 0, quizMode: false, quizAnswers: {}, quizResult: null, cleanup: null };
let speech = null;

export async function storiesListView(app, context) {
  const story = await ensureStory();
  const progress = readStoryProgress(activeStudentStorage(), story.storyId);
  const percent = progress.completed ? 100 : Math.round(((progress.lastScene || 0) + 1) / Math.max(1, story.slides.length) * 100);
  app.innerHTML = `<section class="stories-list" data-route-page="stories"><div class="page-head"><div><p class="eyebrow">EĞLENCE</p><h1>Poma Hikâyeleri</h1><p class="lead">Poma Kingdom'da İngilizce hikâyeleri keşfet.</p></div><button class="button secondary" data-route="games">Eğlence</button></div><article class="card story-card"><div class="story-card-layout"><img class="story-card-cover" src="assets/stories/story-001/story-001-kingdom-empty.png" alt="Poma Kingdom kale kapısı"><div><p class="eyebrow">DERS ${story.lessonNo} · ${esc(story.level)}</p><h2>${esc(story.title)}</h2><p class="lead">${esc(story.grammarTarget.primary)} · ${story.grammarTarget.items.map(esc).join(", ")}</p><div class="progress" aria-label="Hikaye ilerlemesi"><span style="width:${percent}%"></span></div><p class="meta">${progress.completed ? "Tamamlandı" : `İlerleme: %${percent}`}</p><div class="button-row"><button class="button primary" data-route="story/story-001">Hikâyeyi Aç</button></div></div></div></article></section>`;
  bindStoryRoutes(app);
}

export async function storyDetailView(app, context) {
  const story = await ensureStory();
  const role = context.account?.profile?.account_type || "student";
  if (role === "teacher") return teacherStoryView(app, context, story);
  if (role === "parent" || role === "both") return parentStoryView(app, context, story);
  return studentStoryView(app, context, story);
}

export function storyCenterCard({ home = false } = {}) {
  return `<section class="card game-center-card story-center-card ${home ? "home-game-card" : ""}" data-game-center="stories"><div class="game-card-layout"><img class="game-card-image" src="assets/stories/story-001/story-001-kingdom-empty.png" alt="Poma Kingdom kale kapısı"><div><p class="eyebrow">HİKÂYE</p><h2>Poma Hikâyeleri</h2><p class="lead">Poma Kingdom'da İngilizce hikâyeleri keşfet.</p><div class="button-row"><button class="button ${home ? "secondary" : "primary"}" data-route="stories">${home ? "Oku" : "Hikâyeleri Aç"}</button></div></div></div></section>`;
}

async function ensureStory() {
  if (!storyRuntime.bundle) storyRuntime.bundle = await loadStoryBundle();
  return storyRuntime.bundle;
}

function studentStoryView(app, context, story) {
  const storage = activeStudentStorage();
  markStoryOpened(storage, story);
  const saved = readStoryProgress(storage, story.storyId);
  if (!storyRuntime.quizMode && !storyRuntime.quizResult) storyRuntime.slideIndex = Math.min(saved.lastScene || 0, story.slides.length - 1);
  speech ||= createSpeechHelper({ muted: context.state.settings?.muted });
  const render = () => {
    storyRuntime.cleanup?.();
    storyRuntime.cleanup = null;
    if (storyRuntime.quizMode) return renderQuiz(app, context, story, render);
    const slide = story.slides[storyRuntime.slideIndex];
    updateStoryScene(storage, story, storyRuntime.slideIndex);
    const progress = Math.round((storyRuntime.slideIndex + 1) / story.slides.length * 100);
    speech.setMuted(context.state.settings?.muted);
    app.innerHTML = `<section class="story-shell" data-story-id="${esc(story.storyId)}"><div class="lesson-head"><button class="button secondary" data-route="stories">← Hikâyeler</button><div class="progress"><span style="width:${progress}%"></span></div><span>${storyRuntime.slideIndex + 1}/${story.slides.length}</span></div><article class="card story-player"><div class="story-media-wrap">${renderStoryMedia(story, slide, context)}</div><div class="story-copy"><p class="eyebrow">Ders ${story.lessonNo} · Subject Pronouns</p><h1>${esc(story.title)}</h1><div class="story-lines">${slide.text.map(line => `<p>${highlightTokens(line, slide.focusTokens || [])}</p>`).join("")}</div>${renderInteraction(slide)}<div class="button-row story-speech-controls"><button class="button secondary" data-action="story-listen">Dinle</button><button class="button secondary" data-action="story-repeat">Tekrar Dinle</button><button class="button secondary" data-action="story-stop">Durdur</button></div></div></article><div class="button-row story-nav"><button class="button secondary" data-action="story-prev" ${storyRuntime.slideIndex === 0 ? "disabled" : ""}>Önceki</button><button class="button primary" data-action="story-next">${storyRuntime.slideIndex === story.slides.length - 1 ? "Quize Geç" : "Sonraki"}</button></div></section>`;
    bindStoryRoutes(app);
    bindMedia(app);
    app.querySelector("[data-action='story-listen']")?.addEventListener("click", () => speech.speak(slide.narration || slide.text.join(" ")));
    app.querySelector("[data-action='story-repeat']")?.addEventListener("click", () => speech.speak(slide.narration || slide.text.join(" ")));
    app.querySelector("[data-action='story-stop']")?.addEventListener("click", () => speech.stop());
    app.querySelector("[data-action='story-prev']")?.addEventListener("click", () => { storyRuntime.slideIndex = Math.max(0, storyRuntime.slideIndex - 1); render(); });
    app.querySelector("[data-action='story-next']")?.addEventListener("click", () => {
      if (storyRuntime.slideIndex < story.slides.length - 1) storyRuntime.slideIndex++;
      else storyRuntime.quizMode = true;
      render();
    });
    app.querySelectorAll("[data-story-answer]").forEach(button => button.addEventListener("click", () => {
      const ok = button.dataset.storyAnswer === button.dataset.storyCorrect;
      app.querySelector("[data-story-feedback]").innerHTML = `<p class="feedback ${ok ? "correct" : "incorrect"}">${ok ? "Doğru seçim." : "Kısa ipucu: karaktere göre doğru özne zamirini seç."}</p>`;
    }));
    app.querySelectorAll("[data-story-card-speech]").forEach(button => button.addEventListener("click", () => {
      speech.setMuted(context.state.settings?.muted);
      speech.speak(button.dataset.storyCardSpeech);
      const ok = button.dataset.storyCardAnswer === button.dataset.storyCardCorrect;
      const feedback = app.querySelector("[data-story-feedback]");
      if (feedback) feedback.innerHTML = `<p class="feedback ${ok ? "correct" : "incorrect"}">${ok ? "Doğru kart." : "Bu kartı tekrar dinle ve zamiri düşün."}</p>`;
    }));
  };
  render();
}

function renderStoryMedia(story, slide, context = {}) {
  if (slide.interaction?.uiOverlay === "poma-plus-learner") return renderPomaPlusLearner(story, context);
  if (slide.type === "interactive") {
    const pairs = slide.interaction?.pairs || [];
    return `<div class="story-media-stage story-media-grid story-card-grid" role="group" aria-label="Karakter eşleştirme görselleri">${pairs.map(pair => {
      const asset = resolveStoryAsset(story, pair.mediaId);
      const sentence = cardSpeech(pair.pronoun);
      return `<button class="story-character-card" type="button" data-story-card-answer="${esc(pair.pronoun)}" data-story-card-correct="${esc(pair.pronoun)}" data-story-card-speech="${esc(sentence)}" aria-label="${esc(`${sentence} Dinle`)}"><img src="${esc(asset?.url || "")}" alt="${esc(mediaAlt(pair.mediaId))}" loading="eager"><span>${esc(pair.pronoun)}</span></button>`;
    }).join("")}</div>`;
  }
  const asset = resolveStoryAsset(story, slide.mediaId);
  const poster = slide.posterId ? resolveStoryAsset(story, slide.posterId) : null;
  if (slide.type === "video") {
    return `<div class="story-media-stage" data-story-video-stage><img class="story-media-poster is-visible" src="${esc(poster?.url || asset?.posterUrl || "")}" alt="${esc(mediaAlt(slide.posterId || slide.mediaId))}" loading="eager"><video class="story-media-video" src="${esc(asset?.url || "")}" poster="${esc(poster?.url || asset?.posterUrl || "")}" muted playsinline preload="metadata" aria-label="${esc(mediaAlt(slide.mediaId))}"></video></div>`;
  }
  return `<div class="story-media-stage"><img class="story-media-image is-visible" src="${esc(asset?.url || "")}" alt="${esc(mediaAlt(slide.mediaId))}" loading="eager"></div>`;
}

function renderPomaPlusLearner(story, context = {}) {
  const asset = resolveStoryAsset(story, "poma-welcome-poster");
  const profile = context.state?.profile || {};
  const rawName = String(profile.name || "").trim();
  const label = rawName ? rawName.slice(0, 1).toUpperCase() : "YOU";
  return `<div class="story-media-stage story-we-stage" aria-label="Poma + You: Poma ve öğrenci birlikte"><img class="story-media-image is-visible" src="${esc(asset?.url || "")}" alt="Poma öğrenciyle birlikte" loading="eager"><div class="learner-badge" aria-label="You öğrenci rozeti"><span>${esc(label)}</span><strong>YOU</strong></div></div>`;
}

function bindMedia(app) {
  const stage = app.querySelector("[data-story-video-stage]");
  const video = stage?.querySelector("video");
  const poster = stage?.querySelector("img");
  if (!video) return;
  const showPoster = () => { poster?.classList.add("is-visible"); video.classList.remove("is-visible"); };
  const showVideo = () => { poster?.classList.remove("is-visible"); video.classList.add("is-visible"); };
  const onCanPlay = () => {
    video.play?.().then(showVideo).catch(showPoster);
  };
  const onError = showPoster;
  video.addEventListener("canplay", onCanPlay, { once: true });
  video.addEventListener("error", onError);
  storyRuntime.cleanup = () => {
    video.pause?.();
    video.removeAttribute("src");
    video.load?.();
    video.removeEventListener("error", onError);
  };
}

function renderInteraction(slide) {
  const answer = slide.interaction?.answer;
  if (!answer) return `<div class="story-interaction"><p class="muted">Kelimeye veya görsele dokunup Dinle düğmesiyle tekrar et.</p><div data-story-feedback></div></div>`;
  const options = ["I", "you", "he", "she", "it", "we", "they"];
  return `<div class="story-interaction"><p class="muted">Doğru zamiri seç.</p><div class="story-pronoun-options">${options.map(x => `<button class="option" data-story-answer="${esc(x.toLowerCase())}" data-story-correct="${esc(String(answer).toLowerCase())}">${esc(x)}</button>`).join("")}</div><div data-story-feedback></div></div>`;
}

function renderQuiz(app, context, story, renderStory) {
  const storage = activeStudentStorage();
  const result = storyRuntime.quizResult;
  if (result) {
    const passed = result.score >= story.completion.passScore;
    app.innerHTML = `<section class="story-shell"><article class="card results-score"><div class="score-ring" style="--score:${Math.round(result.score / result.maxScore * 100)}"><strong>${result.score}/${result.maxScore}</strong></div><div><p class="eyebrow">HİKÂYE QUIZ SONUCU</p><h1>${passed ? "Hikâye tamamlandı" : "Kısa tekrar gerekiyor"}</h1><p>${passed ? "Başarı ölçütü karşılandı." : "Yanlış yapılan zamirleri tekrar edip yeniden dene."}</p><p>Zorlanılan zamirler: ${result.wrongPronouns.length ? result.wrongPronouns.map(esc).join(", ") : "yok"}</p><div class="button-row"><button class="button primary" data-action="story-retry">Yeniden dene</button><button class="button secondary" data-action="story-back">Hikâyeye dön</button></div></div></article></section>`;
    app.querySelector("[data-action='story-retry']").onclick = () => { storyRuntime.quizAnswers = {}; storyRuntime.quizResult = null; storyRuntime.quizMode = true; renderStory(); };
    app.querySelector("[data-action='story-back']").onclick = () => { storyRuntime.quizMode = false; storyRuntime.quizResult = null; storyRuntime.slideIndex = 0; renderStory(); };
    return;
  }
  const answered = Object.keys(storyRuntime.quizAnswers).length;
  const current = story.quiz[answered] || story.quiz[0];
  const media = resolveStoryAsset(story, current.mediaId);
  const quizMedia = current.uiOverlay === "poma-plus-learner" ? renderPomaPlusLearner(story, context) : `<div class="story-media-stage"><img class="story-media-image is-visible" src="${esc(media?.url || "")}" alt="${esc(mediaAlt(current.mediaId))}"></div>`;
  app.innerHTML = `<section class="story-shell story-quiz"><div class="lesson-head"><button class="button secondary" data-action="story-back-to-scenes">← Hikâyeye dön</button><div class="progress"><span style="width:${answered / story.quiz.length * 100}%"></span></div><span>${Math.min(answered + 1, story.quiz.length)}/${story.quiz.length}</span></div><article class="card story-player"><div class="story-media-wrap">${quizMedia}</div><div class="story-copy"><p class="eyebrow">Mini Quiz</p><h1>${esc(current.prompt)}</h1><div class="story-pronoun-options">${current.options.map(option => `<button class="option" data-quiz-answer="${esc(option)}">${esc(option)}</button>`).join("")}</div><div data-quiz-feedback aria-live="polite"></div><div class="button-row"><button class="button secondary" data-action="quiz-listen">Dinle</button></div></div></article></section>`;
  app.querySelector("[data-action='story-back-to-scenes']").onclick = () => { storyRuntime.quizMode = false; renderStory(); };
  app.querySelector("[data-action='quiz-listen']").onclick = () => speak(current.prompt, context.state.settings?.muted);
  app.querySelectorAll("[data-quiz-answer]").forEach(button => button.addEventListener("click", () => {
    const selected = button.dataset.quizAnswer;
    const ok = selected === current.answer;
    storyRuntime.quizAnswers[current.id] = selected;
    app.querySelectorAll("[data-quiz-answer]").forEach(b => { b.disabled = true; b.classList.toggle("selected", b === button); });
    app.querySelector("[data-quiz-feedback]").innerHTML = `<p class="feedback ${ok ? "correct" : "incorrect"}">${ok ? "Doğru." : esc(current.feedbackTr)}</p><button class="button primary" data-action="quiz-next">${Object.keys(storyRuntime.quizAnswers).length >= story.quiz.length ? "Sonucu Gör" : "Sonraki"}</button>`;
    app.querySelector("[data-action='quiz-next']").onclick = () => {
      if (Object.keys(storyRuntime.quizAnswers).length >= story.quiz.length) {
        completeStoryQuiz(storage, story, storyRuntime.quizAnswers);
        storyRuntime.quizResult = gradeStoryQuiz(story, storyRuntime.quizAnswers);
      }
      renderStory();
    };
  }));
}

function parentStoryView(app, context, story) {
  const progress = readStoryProgress(activeStudentStorage(), story.storyId);
  app.innerHTML = `<section class="story-report"><div class="page-head"><div><p class="eyebrow">VELİ · POMA HİKÂYELERİ</p><h1>${esc(story.displayTitleTr || story.title)}</h1><p class="lead">${esc(story.parentSummary.summaryTr)}</p></div><button class="button secondary" data-route="stories">Hikâyeler</button></div><div class="analysis-grid grid"><article class="card"><h2>Bugün öğrenilenler</h2><p>${story.parentSummary.pronouns.map(esc).join(", ")}</p><h3>Hedef kelimeler</h3><p>${story.targetWords.map(w => `${esc(w.word)} - ${esc(w.meaningTr)}`).join(", ")}</p></article><article class="card"><h2>Çocuk sonucu</h2><p>Quiz: ${progress.quizScore == null ? "henüz yok" : `${progress.quizScore}/${story.quiz.length}`}</p><p>Durum: ${progress.completed ? "Tamamlandı" : "Devam ediyor"}</p><p>Zorlanılan zamirler: ${(progress.wrongPronouns || []).length ? progress.wrongPronouns.map(esc).join(", ") : "yok"}</p><p>En çok karıştırılan yapı: ${(progress.wrongPronouns || [])[0] || "henüz veri yok"}</p></article><article class="card"><h2>Evde 3 dakikalık tekrar</h2><ul class="clean-list">${story.parentSummary.homePractice.map(x => `<li>${esc(x)}</li>`).join("")}</ul><p>${esc(story.parentSummary.commonMixup)}</p></article></div></section>`;
  bindStoryRoutes(app);
}

function teacherStoryView(app, context, story) {
  const guide = story.teacherGuide;
  app.innerHTML = `<section class="story-report teacher-story-guide"><div class="page-head"><div><p class="eyebrow">ÖĞRETMEN · HİKÂYE 001</p><h1>${esc(story.title)}</h1><p class="lead">${esc(guide.objective)}</p></div><button class="button secondary" data-action="print">Yazdır</button></div><div class="analysis-grid grid"><article class="card"><h2>Ders hedefi</h2><p>${esc(guide.objective)}</p><p>Tahmini süre: ${esc(guide.duration)}</p><p>Hedef kelimeler: ${story.targetWords.map(w => esc(w.word)).join(", ")}</p></article><article class="card"><h2>Akış</h2><p><strong>Isınma:</strong> ${esc(guide.warmup)}</p><p><strong>Hikâye:</strong> ${esc(guide.storyFlow)}</p><p><strong>Sınıf etkinliği:</strong> ${esc(guide.classActivity)}</p></article><article class="card"><h2>Materyal</h2><p>${esc(guide.worksheet)}</p><h3>Cevap anahtarı</h3><ul class="clean-list">${guide.answerKey.map(x => `<li>${esc(x)}</li>`).join("")}</ul></article><article class="card"><h2>Yanlış açıklamaları</h2><ul class="clean-list">${guide.wrongExplanations.map(x => `<li>${esc(x)}</li>`).join("")}</ul><p><strong>Farklılaştırma:</strong> ${esc(guide.differentiation)}</p><p><strong>Başarı ölçütü:</strong> ${esc(guide.successCriteria)}</p></article></div></section>`;
  app.querySelector("[data-action='print']")?.addEventListener("click", () => print());
}

function bindStoryRoutes(app) {
  app.querySelectorAll("[data-route]").forEach(button => button.onclick = () => { location.hash = `#/${button.dataset.route}`; });
}

function highlightTokens(line, tokens) {
  const set = new Set(tokens.map(x => String(x).toLowerCase()));
  return esc(line).split(/(\b[\w']+\b)/).map(part => set.has(part.toLowerCase()) ? `<mark>${part}</mark>` : part).join("");
}

function mediaAlt(id) {
  return ({
    "kingdom-empty": "Poma Kingdom kale kapısı",
    "poma-welcome-poster": "Poma kalede öğrenciyi karşılıyor",
    "poma-welcome-video": "Poma karşılama videosu",
    "poma-dahi-castle": "Poma Dahi kale önünde",
    "influencer-castle": "Influencer Poma kale önünde",
    "bozkurt-wolf-castle": "Bozkurt Poma ve yavru kurt kale önünde",
    "little-wolf": "Yavru kurt",
    "poma-group-lineup": "Poma karakterleri grup halinde"
  })[id] || "Poma hikaye sahnesi";
}

function cardSpeech(pronoun) {
  return ({ he: "He is Poma Dahi.", she: "She is Influencer Poma.", it: "It is a little wolf." })[String(pronoun).toLowerCase()] || "";
}

export function resetStoryRuntime() {
  storyRuntime.cleanup?.();
  stopAudio();
  storyRuntime = { ...storyRuntime, slideIndex: 0, quizMode: false, quizAnswers: {}, quizResult: null, cleanup: null };
}
