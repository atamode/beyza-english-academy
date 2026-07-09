import { flattenLessons } from "./catalog.js";
import { activeStudentStorage } from "./account-storage.js";

const e = value => String(value ?? "").replace(/[&<>"]/g, char => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
}[char]));

function readJson(storage, key, fallback = {}) {
  try {
    return JSON.parse(storage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
}

export function buildParentReport(state, vocabulary = []) {
  const progress = state.vocabularyProgress || {};
  const words = vocabulary.map(word => ({ ...word, progress: progress[word.id] }));
  const seen = words.filter(word => word.progress);
  const learned = seen.filter(word => word.progress?.status === "learned");
  const difficult = seen.filter(word => word.progress?.status === "difficult");
  const topicRows = [
    ...(state.diagnostic?.skillGroups || []),
    ...Object.values(state.moduleReviews || {}).flatMap(review => review?.topics || [])
  ].filter(topic => Number.isFinite(Number(topic.percent)));
  const sortedTopics = [...topicRows].sort((a, b) => Number(b.percent) - Number(a.percent));
  const storage = activeStudentStorage();
  const football = readJson(storage, "beyzaAcademy.games.football.v1.stats");
  const volleyball = readJson(storage, "beyzaAcademy.games.volleyball.v1.stats");
  const sportMatches = Number(football.matches || 0) + Number(volleyball.matches || 0);
  const lastMatches = [football.lastMatch, volleyball.lastMatch].filter(Boolean);
  const correct = lastMatches.reduce((sum, match) => sum + Number(match.correct || 0), 0);
  const wrong = lastMatches.reduce((sum, match) => sum + Number(match.wrong || 0), 0);
  return {
    studentName: state.profile?.name || "Öğrenci",
    seenWords: seen.length,
    learnedWords: learned.length,
    difficultWords: difficult.length,
    completedLessons: Object.values(state.lessonProgress || {}).filter(item => item?.completed).length,
    strongestTopic: sortedTopics[0] || null,
    weakestTopic: sortedTopics.length > 1 ? sortedTopics.at(-1) : null,
    sportMatches,
    sportPercent: correct + wrong ? Math.round(correct / (correct + wrong) * 100) : null
  };
}

export function parentReportShareText(report) {
  const lines = [
    `${report.studentName} - Poma Academy Gelişim Özeti`,
    `Görülen kelime: ${report.seenWords}`,
    `Öğrenilen kelime: ${report.learnedWords}`,
    `Zorlanılan kelime: ${report.difficultWords}`,
    `Tamamlanan ders: ${report.completedLessons}`
  ];
  if (report.strongestTopic) lines.push(`En güçlü konu: ${report.strongestTopic.label} (%${report.strongestTopic.percent})`);
  if (report.weakestTopic) lines.push(`Tekrar önerilen konu: ${report.weakestTopic.label} (%${report.weakestTopic.percent})`);
  if (report.sportMatches) lines.push(`Spor oyunu: ${report.sportMatches} maç${report.sportPercent == null ? "" : `, son başarı %${report.sportPercent}`}`);
  return lines.join("\n");
}

export function parentView(state, lesson, curriculum, lessonMap = new Map(), vocabulary = []) {
  const lessonProgress = state.lessonProgress[lesson.id] || {};
  const rows = flattenLessons(curriculum).filter(item => item.status === "published");
  const currentModuleId = rows.find(item => item.id === lesson.id)?.moduleId;
  const moduleNumber = String(currentModuleId || "module-1").replace("module-", "");
  const moduleRows = rows.filter(item => item.moduleId === currentModuleId);
  const review = state.moduleReviews?.[currentModuleId];
  const reviewPool = [];
  const vocabularyProgress = state.vocabularyProgress || {};
  const words = vocabulary.map(word => ({ ...word, progress: vocabularyProgress[word.id] }));
  const learned = words.filter(word => word.progress?.status === "learned");
  const difficult = words.filter(word => word.progress?.status === "difficult");
  const due = words.filter(word => word.progress?.dueAt && new Date(word.progress.dueAt) <= new Date());
  const mostWrong = [...words]
    .filter(word => word.progress?.wrong)
    .sort((a, b) => (b.progress.wrong || 0) - (a.progress.wrong || 0))
    .slice(0, 5);
  const tournament = state.vocabularyTournament;
  const report = buildParentReport(state, vocabulary);

  for (const [lessonId, progress] of Object.entries(state.lessonProgress || {})) {
    const source = lessonMap.get(lessonId);
    for (const screenId of progress.reviewScreens || []) {
      const screen = source?.screens.find(item => item.id === screenId);
      if (screen) reviewPool.push({ lessonTitle: source.title, screenTitle: screen.title });
    }
  }

  const worksheet = lesson.parentGuide.worksheet;
  const strongText = report.strongestTopic
    ? `${e(report.strongestTopic.label)} · %${Number(report.strongestTopic.percent)}`
    : "Veri biriktikçe gösterilecek";
  const weakText = report.weakestTopic
    ? `${e(report.weakestTopic.label)} · %${Number(report.weakestTopic.percent)}`
    : "Henüz yeterli ölçüm yok";

  return `<section data-parent-report>
    <div class="page-head">
      <div>
        <p class="eyebrow">VELİ PANELİ</p>
        <h1>${e(report.studentName)} gelişim raporu</h1>
        <p class="lead">Seçili ders, modül tekrarı, kelime takibi ve tekrar havuzu tek yerde.</p>
      </div>
      <button class="button secondary" data-route="home">Öğrenci moduna dön</button>
    </div>
    <article class="card parent-proof-card">
      <div class="section-title-row">
        <div>
          <p class="eyebrow">ÖLÇÜLEBİLİR GELİŞİM</p>
          <h2>${e(report.studentName)} gerçekten ne öğrendi?</h2>
          <p class="lead">Bu özet yalnız kaydedilmiş ders, kelime ve oyun sonuçlarından hazırlanır.</p>
        </div>
        <button class="button primary" data-action="share-parent-report">WhatsApp'ta paylaş</button>
      </div>
      <div class="stats-grid grid">
        <article class="card stat"><span>Görülen kelime</span><strong>${report.seenWords}</strong></article>
        <article class="card stat"><span>Öğrenilen kelime</span><strong>${report.learnedWords}</strong></article>
        <article class="card stat"><span>Zorlanılan kelime</span><strong>${report.difficultWords}</strong></article>
        <article class="card stat"><span>Tamamlanan ders</span><strong>${report.completedLessons}</strong></article>
      </div>
      <div class="parent-report-insights">
        <p><strong>En güçlü konu:</strong> ${strongText}</p>
        <p><strong>Tekrar önerilen konu:</strong> ${weakText}</p>
        <p><strong>Spor oyunları:</strong> ${report.sportMatches ? `${report.sportMatches} maç${report.sportPercent == null ? "" : ` · son başarı %${report.sportPercent}`}` : "Henüz tamamlanan maç yok"}</p>
      </div>
    </article>
    <div class="stats-grid grid">
      <article class="card stat"><span>Seçili derste en iyi puan</span><strong>${lessonProgress.bestPoints || 0}</strong></article>
      <article class="card stat"><span>Öğrenilen kelime</span><strong>${learned.length}</strong></article>
      <article class="card stat"><span>Zor kelime</span><strong>${difficult.length}</strong></article>
      <article class="card stat"><span>Tekrar zamanı</span><strong>${due.length}</strong></article>
    </div>
    <article class="card">
      <h2>Kelime takibi</h2>
      <p>Haftalık turnuva: ${tournament?.completedAt ? `${tournament.correct}/${tournament.total} doğru · bonus ${tournament.bonus || 0}` : "Henüz oynanmadı"}</p>
      <h3>En çok yanlış yapılanlar</h3>
      <ul class="clean-list">${mostWrong.length ? mostWrong.map(word => `<li>${e(word.word)} — ${e(word.meaningTr)} (${word.progress.wrong} yanlış)</li>`).join("") : "<li>Henüz yanlış kaydı yok.</li>"}</ul>
      <h3>Tekrar zamanı gelenler</h3>
      <ul class="clean-list">${due.length ? due.slice(0, 8).map(word => `<li>${e(word.word)} — ${e(word.sourceLessonTitle)}</li>`).join("") : "<li>Bugün bekleyen kelime yok.</li>"}</ul>
    </article>
    <article class="card">
      <h2>Modül ilerlemesi</h2>
      ${moduleRows.map(item => {
        const progress = state.lessonProgress[item.id] || {};
        return `<div class="analysis-row"><span>${e(item.title)}</span><strong>${progress.completed ? `${progress.bestStars || 0} ★ · ${progress.bestPercent || 0}%` : "Henüz tamamlanmadı"}</strong><div class="progress"><span style="width:${progress.bestPercent || 0}%"></span></div></div>`;
      }).join("")}
    </article>
    ${review ? `<article class="card"><h2>Modül ${e(moduleNumber)} Genel Tekrar</h2><p><strong>${review.correct}/${review.total} doğru · %${review.percent}</strong></p>${review.topics.map(topic => `<div class="analysis-row"><span>${e(topic.label)}</span><strong>${topic.correct}/${topic.total}</strong><div class="progress"><span style="width:${topic.percent}%"></span></div></div>`).join("")}</article>` : ""}
    ${reviewPool.length ? `<article class="card"><h2>Yanlış tekrar ayrıntıları</h2><ul class="clean-list">${reviewPool.map(item => `<li><strong>${e(item.lessonTitle)}</strong> — ${e(item.screenTitle)}</li>`).join("")}</ul><button class="button secondary" data-route="review-mistakes">Yanlışları çalış</button></article>` : ""}
    <div class="parent-sections">
      <article class="card"><h2>Bugünün hedefi</h2><p>${e(lesson.parentGuide.todayGoal)}</p><h3>Konunun mantığı</h3><p>${e(lesson.parentGuide.summaryTr)}</p></article>
      <article class="card"><h2>Anlatım notları</h2><ul class="clean-list">${lesson.parentGuide.teachingTips.map(item => `<li>${e(item)}</li>`).join("")}</ul></article>
      <article class="card"><h2>${e(report.studentName)}'a sorulacaklar</h2><ul class="clean-list">${lesson.parentGuide.questionsToAsk.map(item => `<li>${e(item)}</li>`).join("")}</ul></article>
      <article class="card"><h2>Dinleme ve konuşma</h2><p>${e(lesson.parentGuide.listeningScripts[0])}</p><ul class="clean-list">${lesson.parentGuide.speakingRubric.map(item => `<li>${e(item)}</li>`).join("")}</ul></article>
      <article class="card"><h2>${e(worksheet.title)}</h2><p>${e(worksheet.instructionTr)}</p><p>${worksheet.questions.length} soru · en az üç etkinlik türü</p><button class="button primary" data-route="worksheet/${lesson.id}">Öğrenci sayfasını aç</button><details><summary>Veli cevap anahtarını aç</summary><ol class="clean-list">${worksheet.answerKey.map(item => `<li>${e(item)}</li>`).join("")}</ol></details></article>
      <article class="card"><h2>Ders seç</h2><div class="button-row">${rows.map(item => `<button class="button secondary" data-route="parent/${item.id}">${e(item.title)}</button>`).join("")}</div></article>
    </div>
    <div class="button-row"><button class="button danger" data-action="reset">Tüm ilerlemeyi sıfırla</button></div>
  </section>`;
}
