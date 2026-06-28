const DAY_MS = 24 * 60 * 60 * 1000;
export const REVIEW_STEPS = [1, 3, 7, 14, 30];

export function normalizeVocabulary(raw) {
  const items = Array.isArray(raw?.items) ? raw.items : [];
  return items.map((item, index) => ({
    id: item.id || `${item.lessonId || raw.lessonId || "lesson"}-${item.word || index}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    lessonId: item.lessonId || raw.lessonId,
    word: item.word,
    meaningTr: item.meaningTr,
    example: item.example,
    sentenceTr: item.sentenceTr || item.exampleTr || "",
    audioText: item.audioText || item.word,
    sourceLessonTitle: item.sourceLessonTitle || item.lessonTitle || item.lessonId || raw.lessonId,
    theme: item.theme || "general"
  }));
}

export function ensureVocabularyState(state) {
  state.vocabularyProgress ||= {};
  state.vocabularyTournament ||= {};
  return state;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function recordWordAnswer(state, word, correct, now = new Date()) {
  ensureVocabularyState(state);
  const old = state.vocabularyProgress[word.id] || { box: 0, correct: 0, wrong: 0, status: "learning", lessonId: word.lessonId };
  if (correct) {
    const nextBox = Math.min(REVIEW_STEPS.length, (old.box || 0) + 1);
    state.vocabularyProgress[word.id] = {
      ...old,
      lessonId: word.lessonId,
      correct: (old.correct || 0) + 1,
      box: nextBox,
      status: nextBox >= 3 ? "learned" : "learning",
      lastSeen: now.toISOString(),
      dueAt: addDays(now, REVIEW_STEPS[nextBox - 1] || 30)
    };
  } else {
    state.vocabularyProgress[word.id] = {
      ...old,
      lessonId: word.lessonId,
      wrong: (old.wrong || 0) + 1,
      box: 0,
      status: "difficult",
      lastSeen: now.toISOString(),
      dueAt: addDays(now, 1)
    };
  }
  return state.vocabularyProgress[word.id];
}

export function vocabularyStats(items, state, now = new Date()) {
  ensureVocabularyState(state);
  const dueLimit = now.getTime();
  const progress = state.vocabularyProgress || {};
  const enriched = items.map(item => ({ ...item, progress: progress[item.id] || null }));
  return {
    total: items.length,
    learned: enriched.filter(x => x.progress?.status === "learned"),
    learning: enriched.filter(x => !x.progress || x.progress.status === "learning"),
    difficult: enriched.filter(x => x.progress?.status === "difficult"),
    due: enriched.filter(x => x.progress?.dueAt && new Date(x.progress.dueAt).getTime() <= dueLimit),
    byLesson: groupByLesson(enriched)
  };
}

export function groupByLesson(items) {
  return items.reduce((acc, item) => {
    (acc[item.lessonId] ||= []).push(item);
    return acc;
  }, {});
}

export function weeklyWords(items, state, now = new Date()) {
  const cutoff = now.getTime() - 7 * DAY_MS;
  const progress = state.vocabularyProgress || {};
  const seen = items.filter(item => progress[item.id]?.lastSeen && new Date(progress[item.id].lastSeen).getTime() >= cutoff);
  return seen.length >= 6 ? seen : items.slice(0, Math.min(items.length, 24));
}

export function createWordRounds(words, mode = "daily") {
  const pool = [...words].slice(0, mode === "tournament" ? 12 : 8);
  const allMeanings = [...new Set(words.map(w => w.meaningTr))];
  return pool.map((word, index) => {
    const type = ["match", "listen", "missing", "unscramble", "sentence"][index % 5];
    const options = shuffled([word.meaningTr, ...allMeanings.filter(x => x !== word.meaningTr).slice(0, 3)]).slice(0, 4);
    const prompt = type === "listen" ? "Sesi dinle ve kelimeyi seç." :
      type === "missing" ? `Eksik harfi tamamla: ${word.word.replace(/[aeiou]/i, "_")}` :
      type === "unscramble" ? `Karışık harfleri düzelt: ${shuffled(word.word.split("")).join("")}` :
      type === "sentence" ? `Cümleye uygun kelime: ${word.example.replace(new RegExp(word.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "___")}` :
      `${word.word} ne demek?`;
    const answerText = type === "missing" || type === "unscramble" || type === "sentence" ? word.word : word.meaningTr;
    const textOptions = type === "match" || type === "listen" ? options : shuffled([word.word, ...words.filter(w => w.id !== word.id).map(w => w.word).slice(0, 3)]).slice(0, 4);
    return {
      id: `${mode}-${word.id}-${index}`,
      wordId: word.id,
      word,
      type,
      prompt,
      audioText: word.audioText || word.word,
      options: textOptions,
      correctIndex: textOptions.findIndex(x => x === answerText)
    };
  });
}

export function createTournament(words) {
  return { mode: "tournament", lives: 3, streak: 0, bonus: 0, index: 0, finalRound: false, rounds: createWordRounds(words, "tournament"), answers: [] };
}

export function shuffled(array) {
  return [...array].sort((a, b) => String(a).localeCompare(String(b), "tr"));
}
