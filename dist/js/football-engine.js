import { recordWordAnswer } from "./vocabulary-engine.js";

export const FOOTBALL_KEYS = {
  stats: "beyzaAcademy.games.football.v1.stats",
  achievements: "beyzaAcademy.games.football.v1.achievements",
  session: "beyzaAcademy.games.football.v1.session",
  league: "beyzaAcademy.games.football.v2.wordLeague"
};

export const FOOTBALL_CONFIG = {
  maxQuestions: 10,
  resultDelayMs: 1100,
  continueDelayMs: 1500,
  videoTimeoutMs: 12000,
  posterMinMs: 900,
  videoReadyTimeoutMs: 2000,
  recentWindow: 3,
  hardWordWeightCap: 3
};

export const FOOTBALL_LEAGUES = [
  { id: "starter", label: "Başlangıç Ligi", maxLesson: 12, minSeen: 20, minMastered: 5 },
  { id: "bronze", label: "Bronz Lig", maxLesson: 25, minSeen: 20, minMastered: 7 },
  { id: "silver", label: "Gümüş Lig", maxLesson: 40, minSeen: 20, minMastered: 9 },
  { id: "gold", label: "Altın Lig", maxLesson: 55, minSeen: 20, minMastered: 11 },
  { id: "champion", label: "Şampiyonlar Ligi", maxLesson: 99, minSeen: 20, minMastered: 12 }
];

export const PHASES = {
  MATCH_INTRO: { visual: "MATCH_INTRO", next: "POSSESSION_QUESTION" },
  POSSESSION_QUESTION: { visual: "POSSESSION_POMA", question: "Top kimde?", correct: "PASS_RESULT", wrong: "PASS_RESULT" },
  PASS_RESULT: { correctVisual: "PASS_SUCCESS", wrongVisual: "PASS_FAILED", correctNext: "GIVE_AND_GO_QUESTION", wrongNext: "OPPONENT_ATTACK_QUESTION" },
  GIVE_AND_GO_QUESTION: { visual: "POSSESSION_POMA", question: "Pas / ver-kaç", correct: "GIVE_AND_GO_RESULT", wrong: "GIVE_AND_GO_RESULT" },
  GIVE_AND_GO_RESULT: { correctVisual: "GIVE_AND_GO_SUCCESS", wrongVisual: "PASS_FAILED", correctNext: "SHOT_QUESTION", wrongNext: "OPPONENT_ATTACK_QUESTION" },
  SHOT_QUESTION: { visual: "SHOT_PREPARE", question: "Şut", correct: "SHOT_RESULT", wrong: "SHOT_RESULT" },
  SHOT_RESULT: { correctVisual: "GOAL_SCORED", wrongVisual: "SHOT_MISSED_POST", correctNext: "GOAL_CELEBRATION", wrongNext: "OPPONENT_ATTACK_QUESTION", correctGoal: 1 },
  OPPONENT_ATTACK_QUESTION: { visual: "OPPONENT_ATTACK", question: "Defans", correct: "DEFENCE_RESULT", wrong: "DEFENCE_RESULT" },
  DEFENCE_RESULT: { correctVisual: "DEFENCE_SUCCESS", wrongVisual: "DEFENCE_FAILED", correctNext: "POSSESSION_QUESTION", wrongNext: "OPPONENT_SHOT_QUESTION" },
  OPPONENT_SHOT_QUESTION: { visual: "OPPONENT_SHOT_PREPARE", question: "Kurtarış", correct: "KEEPER_RESULT", wrong: "KEEPER_RESULT" },
  KEEPER_RESULT: { correctVisual: "SAVE_SUCCESS", wrongVisual: "GOAL_CONCEDED", correctNext: "POSSESSION_QUESTION", wrongNext: "ROUND_RESET", correctSave: 1, wrongConcede: 1 },
  GOAL_CELEBRATION: { visual: "GOAL_CELEBRATION", next: "ROUND_RESET" },
  ROUND_RESET: { visual: "MATCH_INTRO", next: "POSSESSION_QUESTION" },
  MATCH_SUMMARY: { visual: "MATCH_INTRO" }
};

export const TROPHIES = [
  { id: "first-win", title: "İlk Galibiyet Kupası", test: s => s.lastMatch?.goalsFor > s.lastMatch?.goalsAgainst },
  { id: "three-wins", title: "3 Maç Kazandın", test: s => (s.wins || 0) >= 3 },
  { id: "ten-goals", title: "10 Gol / 10 Sayı", test: s => (s.goalsFor || 0) >= 10 },
  { id: "five-saves", title: "5 Kurtarış", test: s => (s.saves || 0) >= 5 },
  { id: "word-master", title: "Kelime Ustası", test: s => (s.lastMatch?.correct || 0) >= 8 && (s.recoveredDifficult || 0) >= 3 },
  { id: "hard-opponent", title: "Zor Rakibi Yendin", locked: true },
  { id: "streak-three", title: "Günlük Seri: 3 Gün", test: s => (s.studyStreak || 0) >= 3 }
];

const memoryStorage = { data: {}, getItem(k) { return this.data[k] || null; }, setItem(k, v) { this.data[k] = String(v); } };
const defaultStorage = () => globalThis.localStorage || memoryStorage;

export function safeRead(key, fallback, storage = defaultStorage()) {
  try {
    const raw = storage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

export function safeWrite(key, value, storage = defaultStorage()) {
  storage.setItem(key, JSON.stringify(value));
  return value;
}

export const defaultFootballStats = () => ({ version: 1, matches: 0, wins: 0, goalsFor: 0, goalsAgainst: 0, saves: 0, bestStreak: 0, studiedWords: {}, recoveredDifficult: 0, lastMatch: null, studyStreak: 0 });
export const defaultAchievements = () => ({ version: 1, unlocked: {}, locked: { "hard-opponent": true } });
export const defaultFootballLeagueProgress = () => ({ version: 2, currentLeague: "starter", seenWordIds: [], recentMatchWordIds: [], words: {}, matchesPlayed: 0, lastMatchSignature: "" });

export function footballLeagueLabel(id) {
  return FOOTBALL_LEAGUES.find(l => l.id === id)?.label || FOOTBALL_LEAGUES[0].label;
}

function leagueIndex(id) { return Math.max(0, FOOTBALL_LEAGUES.findIndex(l => l.id === id)); }
function lessonNumber(word) { return Number(String(word?.lessonId || "").match(/^\d+/)?.[0] || 0); }

function wordCategory(word) {
  const text = `${word?.theme || ""} ${word?.category || ""} ${word?.lessonId || ""} ${word?.word || ""}`.toLowerCase();
  if (/football|volley|sport|team|practice|ball|goal|save/.test(text)) return "sport";
  if (/music|song|singer|guitar|concert/.test(text)) return "music";
  if (/city|shop|museum|library|school|place|street|travel|hotel|room/.test(text)) return "place";
  if (/routine|daily|frequency|time|weekend|morning/.test(text)) return "routine";
  if (/adjective|feel|comparative|personality|happy|busy|tired/.test(text)) return "adjective";
  if (/verb|past|future|perfect|condition|phrasal|get |turn |put |take /.test(text)) return "verb";
  return "general";
}

export function enrichFootballWords(vocabulary = []) {
  return vocabulary.filter(w => w?.id && w?.word && w?.meaningTr).map(w => {
    const no = lessonNumber(w);
    const league = FOOTBALL_LEAGUES.find(l => no <= l.maxLesson)?.id || "champion";
    return { ...w, footballLeague: w.footballLeague || league, footballCategory: w.footballCategory || wordCategory(w) };
  });
}

export function migrateFootballLeagueProgress(raw = null) {
  const base = defaultFootballLeagueProgress();
  if (!raw || typeof raw !== "object") return base;
  const next = { ...base, ...raw, version: 2, words: { ...(raw.words || {}) } };
  if (!FOOTBALL_LEAGUES.some(l => l.id === next.currentLeague)) next.currentLeague = "starter";
  next.seenWordIds = [...new Set([...(raw.seenWordIds || []), ...Object.keys(next.words)])];
  next.recentMatchWordIds = Array.isArray(raw.recentMatchWordIds) ? raw.recentMatchWordIds.slice(-2).map(x => Array.isArray(x) ? x : []) : [];
  return next;
}

export function readFootballLeagueProgress(storage = defaultStorage()) {
  return migrateFootballLeagueProgress(safeRead(FOOTBALL_KEYS.league, defaultFootballLeagueProgress(), storage));
}

export function writeFootballLeagueProgress(progress, storage = defaultStorage()) {
  return safeWrite(FOOTBALL_KEYS.league, migrateFootballLeagueProgress(progress), storage);
}

export function availableFootballWords(vocabulary) {
  return enrichFootballWords(vocabulary);
}

function academyBoost(word, academyState = {}) {
  const p = academyState.vocabularyProgress?.[word.id] || {};
  return (p.status === "difficult" ? 2 : 0) + Math.min(2, p.wrong || 0) + (p.lastSeen ? 1 : 0);
}

function dueForReview(wordProgress, now = Date.now()) {
  return Boolean(wordProgress?.wrong) || (wordProgress?.nextReviewAt && Date.parse(wordProgress.nextReviewAt) <= now);
}

function weightedPick(pool, rng = Math.random) {
  if (!pool.length) return null;
  const total = pool.reduce((sum, row) => sum + Math.max(1, row.weight || 1), 0);
  let mark = rng() * total;
  for (const row of pool) {
    mark -= Math.max(1, row.weight || 1);
    if (mark <= 0) return row.word || row;
  }
  return pool[pool.length - 1].word || pool[pool.length - 1];
}

function shuffleOptions(options, rng = Math.random, salt = 0) {
  const unique = [...new Set(options.map(x => String(x ?? "").trim()).filter(Boolean))].slice(0, 4);
  const safe = ["kitapçı", "sınıf", "müze", "oyun", "şehir", "antrenman"];
  for (const item of safe) if (unique.length < 4 && !unique.includes(item)) unique.push(item);
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(((rng() + salt * 0.137) % 1) * (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }
  if (!unique.includes(options[0])) unique[0] = options[0];
  return unique;
}

function makeQuestionForWord(word, allWords, index, rng = Math.random) {
  const distractors = footballDistractors(word, allWords);
  const options = shuffleOptions([word.meaningTr, ...distractors], rng, index);
  const question = {
    wordId: word.id,
    word,
    prompt: `"${word.word}" kelimesinin Türkçe anlamı nedir?`,
    options,
    correctAnswer: word.meaningTr,
    correctIndex: options.indexOf(word.meaningTr),
    TurkishExplanation: `"${word.word}" kelimesi "${word.meaningTr}" anlamına gelir. Örnek: ${word.example}`,
    moduleId: word.moduleId || null,
    lessonId: word.lessonId,
    league: word.footballLeague,
    category: word.footballCategory
  };
  return validateFootballQuestion(question) ? freezeQuestion(question) : null;
}

export function createFootballMatchQuestions(words, academyState = {}, progress = defaultFootballLeagueProgress(), rng = Math.random) {
  const allWords = enrichFootballWords(words);
  const currentIdx = leagueIndex(progress.currentLeague);
  const recentBlocked = new Set((progress.recentMatchWordIds || []).slice(-2).flat());
  const selected = [];
  const selectedIds = new Set();
  const now = Date.now();
  const addFrom = (pool, count) => {
    let guard = 0;
    while (selected.length < FOOTBALL_CONFIG.maxQuestions && count > 0 && guard++ < 300) {
      const candidates = pool.filter(w => !selectedIds.has(w.id));
      if (!candidates.length) break;
      const word = weightedPick(candidates.map(w => ({ word: w, weight: 1 + academyBoost(w, academyState) + (progress.words[w.id]?.wrong || 0) })), rng);
      if (!word) break;
      selected.push(word);
      selectedIds.add(word.id);
      count--;
    }
  };
  const currentNew = allWords.filter(w => leagueIndex(w.footballLeague) === currentIdx && !progress.seenWordIds.includes(w.id) && !recentBlocked.has(w.id));
  const review = allWords.filter(w => dueForReview(progress.words[w.id], now) || academyBoost(w, academyState) > 1);
  const oldLearned = allWords.filter(w => {
    const p = progress.words[w.id] || {};
    if (recentBlocked.has(w.id) && !dueForReview(p, now)) return false;
    if (p.mastered && !dueForReview(p, now)) return false;
    return leagueIndex(w.footballLeague) < currentIdx || p.mastered || (p.correct || 0) > 0;
  });
  addFrom(currentNew, 6);
  addFrom(review, 2);
  addFrom(oldLearned, 2);
  addFrom(allWords.filter(w => leagueIndex(w.footballLeague) <= currentIdx && !recentBlocked.has(w.id)), FOOTBALL_CONFIG.maxQuestions - selected.length);
  addFrom(allWords.filter(w => !recentBlocked.has(w.id)), FOOTBALL_CONFIG.maxQuestions - selected.length);
  addFrom(allWords, FOOTBALL_CONFIG.maxQuestions - selected.length);
  if (selected.map(w => w.id).join("|") === progress.lastMatchSignature && selected.length > 1) selected.push(selected.shift());
  return selected.slice(0, FOOTBALL_CONFIG.maxQuestions).map((word, i) => makeQuestionForWord(word, allWords, i, rng)).filter(Boolean);
}

export function createFootballSession(words, state, rng = Math.random, storage = defaultStorage()) {
  const leagueProgress = readFootballLeagueProgress(storage);
  const matchQuestions = createFootballMatchQuestions(words, state, leagueProgress, rng);
  const matchId = `m-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    phase: "MATCH_INTRO",
    visual: "MATCH_INTRO",
    questionsAsked: 0,
    maxQuestions: matchQuestions.length || FOOTBALL_CONFIG.maxQuestions,
    matchId,
    league: leagueProgress.currentLeague,
    leagueLabel: footballLeagueLabel(leagueProgress.currentLeague),
    matchQuestions,
    goalsFor: 0,
    goalsAgainst: 0,
    saves: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    recentWordIds: [],
    matchWordIds: matchQuestions.map(q => q.wordId),
    newWordIds: matchQuestions.filter(q => !leagueProgress.seenWordIds.includes(q.wordId)).map(q => q.wordId),
    masteredThisMatch: [],
    reviewWordIds: matchQuestions.filter(q => dueForReview(leagueProgress.words[q.wordId])).map(q => q.wordId),
    difficultWords: {},
    currentQuestion: matchQuestions[0] || null,
    summary: null,
    lastResult: null
  };
}

export function selectWordQuestion(words, state = {}, recentWordIds = [], rng = () => 0.37) {
  words = enrichFootballWords(words);
  const candidates = words.filter(w => !recentWordIds.slice(-FOOTBALL_CONFIG.recentWindow).includes(w.id));
  const pool = candidates.length ? candidates : words;
  if (!pool.length) return null;
  const progress = state.vocabularyProgress || {};
  const weighted = pool.flatMap(word => {
    const p = progress[word.id] || {};
    const weight = Math.min(FOOTBALL_CONFIG.hardWordWeightCap, 1 + (p.wrong || 0) + (p.status === "difficult" ? 1 : 0) - Math.min(1, p.correct || 0));
    return Array(Math.max(1, weight)).fill(word);
  });
  const word = weighted[Math.floor(rng() * weighted.length) % weighted.length];
  return makeQuestionForWord(word, words, recentWordIds.length, rng);
}

export function footballDistractors(word, words) {
  words = enrichFootballWords(words);
  const correct = String(word?.meaningTr ?? "").trim();
  const sameCategory = words.filter(w => w.id !== word.id && w.footballCategory === word.footballCategory && w.footballLeague === word.footballLeague).map(w => w.meaningTr);
  const sameTheme = words.filter(w => w.id !== word.id && w.theme && w.theme === word.theme).map(w => w.meaningTr);
  const sameLesson = words.filter(w => w.id !== word.id && w.lessonId === word.lessonId).map(w => w.meaningTr);
  const all = words.filter(w => w.id !== word.id).map(w => w.meaningTr);
  const safe = ["kitapçı", "sınıf", "müze", "film", "resim", "oyun", "takım", "antrenman", "saha", "şehir", "okul"];
  return [...new Set([...sameCategory, ...sameTheme, ...sameLesson, ...all, ...safe].map(x => String(x ?? "").trim()).filter(x => x && x !== correct))].slice(0, 3);
}

export function validateFootballQuestion(question) {
  if (!question || !question.wordId || !question.prompt || !question.correctAnswer) return false;
  if (!Array.isArray(question.options) || question.options.length !== 4) return false;
  if (question.options.some(x => !String(x ?? "").trim() || x === "undefined")) return false;
  if (new Set(question.options).size !== question.options.length) return false;
  if (question.options.filter(x => x === question.correctAnswer).length !== 1) return false;
  return question.correctIndex >= 0 && question.options[question.correctIndex] === question.correctAnswer;
}

export function freezeQuestion(question) {
  return Object.freeze({ ...question, options: Object.freeze([...question.options]) });
}

export function answerFootballQuestion(session, selectedIndex, words, academyState, rng = () => 0.37) {
  if (!session.currentQuestion || session.phase === "MATCH_SUMMARY") return session;
  const correct = Number(selectedIndex) === session.currentQuestion.correctIndex;
  const phase = PHASES[session.phase];
  const resultPhase = phase?.[correct ? "correct" : "wrong"] || session.phase;
  const result = applyResult({ ...session }, resultPhase, correct);
  const word = session.currentQuestion.word;
  result.recentWordIds = [...session.recentWordIds, word.id].slice(-FOOTBALL_CONFIG.maxQuestions);
  if (!correct) {
    const repeatAt = result.questionsAsked + 3;
    if (repeatAt < result.matchQuestions.length && !result.matchQuestions.slice(result.questionsAsked).some(q => q.wordId === word.id)) {
      result.matchQuestions = [...result.matchQuestions];
      result.matchQuestions[repeatAt] = makeQuestionForWord(word, words, repeatAt, rng) || result.matchQuestions[repeatAt];
      result.matchWordIds = result.matchQuestions.map(q => q.wordId);
    }
  }
  result.currentQuestion = result.matchQuestions[result.questionsAsked] || null;
  result.lastResult = { correct, wordId: word.id, explanation: session.currentQuestion.TurkishExplanation };
  return result;
}

export function applyResult(session, resultPhase, correct) {
  const cfg = PHASES[resultPhase];
  const visual = correct ? cfg.correctVisual : cfg.wrongVisual;
  session.phase = resultPhase;
  session.visual = visual;
  session.pendingNext = correct ? cfg.correctNext : cfg.wrongNext;
  session.questionsAsked += 1;
  session.correct += correct ? 1 : 0;
  session.wrong += correct ? 0 : 1;
  session.streak = correct ? session.streak + 1 : 0;
  if (cfg.correctGoal && correct) session.goalsFor += 1;
  if (cfg.correctSave && correct) session.saves += 1;
  if (cfg.wrongConcede && !correct) session.goalsAgainst += 1;
  return session;
}

export function advanceFootball(session) {
  if (session.phase === "MATCH_INTRO") return { ...session, phase: "POSSESSION_QUESTION", visual: "POSSESSION_POMA" };
  if (session.questionsAsked >= session.maxQuestions && !["GOAL_CELEBRATION"].includes(session.phase)) return summarizeFootball(session);
  const next = session.pendingNext || PHASES[session.phase]?.next || "POSSESSION_QUESTION";
  if (next === "ROUND_RESET") {
    if (session.questionsAsked >= session.maxQuestions) return summarizeFootball(session);
    return { ...session, phase: "POSSESSION_QUESTION", visual: "POSSESSION_POMA", pendingNext: null };
  }
  if (next === "GOAL_CELEBRATION") return { ...session, phase: "GOAL_CELEBRATION", visual: "GOAL_CELEBRATION", pendingNext: "ROUND_RESET" };
  return { ...session, phase: next, visual: PHASES[next]?.visual || "POSSESSION_POMA", pendingNext: null };
}

export function summarizeFootball(session) {
  const studied = new Set(session.recentWordIds).size;
  return {
    ...session,
    phase: "MATCH_SUMMARY",
    visual: "MATCH_INTRO",
    summary: {
      score: `${session.goalsFor}-${session.goalsAgainst}`,
      correct: session.correct,
      wrong: session.wrong,
      percent: Math.round(session.correct / Math.max(1, session.questionsAsked) * 100),
      goalsFor: session.goalsFor,
      goalsAgainst: session.goalsAgainst,
      saves: session.saves,
      studiedWords: studied,
      newWords: new Set(session.newWordIds || []).size,
      learnedWords: new Set(session.masteredThisMatch || []).size,
      reviewWords: new Set([...(session.reviewWordIds || []), ...Object.keys(session.difficultWords || {})]).size,
      league: session.league,
      leagueLabel: session.leagueLabel || footballLeagueLabel(session.league),
      difficult: Object.entries(session.difficultWords || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id)
    }
  };
}

export function recordFootballAnswer(academyState, question, correct) {
  recordWordAnswer(academyState, question.word, correct);
  return academyState;
}

export function recordFootballLeagueAnswer(question, correct, matchId, storage = defaultStorage(), now = new Date()) {
  const progress = readFootballLeagueProgress(storage);
  const id = question.wordId;
  const old = progress.words[id] || { correct: 0, wrong: 0, correctMatchIds: [], mastered: false };
  const correctMatchIds = [...new Set([...(old.correctMatchIds || []), ...(correct ? [matchId] : [])])].slice(-10);
  const next = {
    ...old,
    league: question.league || question.word?.footballLeague || "starter",
    category: question.category || question.word?.footballCategory || "general",
    correct: (old.correct || 0) + (correct ? 1 : 0),
    wrong: (old.wrong || 0) + (correct ? 0 : 1),
    correctMatchIds,
    mastered: old.mastered || correctMatchIds.length >= 3,
    lastAskedAt: now.toISOString(),
    nextReviewAt: new Date(now.getTime() + (correct ? (old.mastered ? 14 : 3) : 1) * 86400000).toISOString()
  };
  progress.words[id] = next;
  progress.seenWordIds = [...new Set([...(progress.seenWordIds || []), id])];
  writeFootballLeagueProgress(progress, storage);
  return next;
}

export function leagueProgressPercent(progress = defaultFootballLeagueProgress()) {
  progress = migrateFootballLeagueProgress(progress);
  const current = FOOTBALL_LEAGUES[leagueIndex(progress.currentLeague)];
  const mastered = Object.values(progress.words || {}).filter(w => w.league === current.id && w.mastered).length;
  const seen = (progress.seenWordIds || []).filter(id => (progress.words[id]?.league || current.id) === current.id).length;
  return Math.min(100, Math.round((seen / current.minSeen) * 50 + (mastered / current.minMastered) * 50));
}

export function finalizeFootballLeagueMatch(session, storage = defaultStorage()) {
  const progress = readFootballLeagueProgress(storage);
  const unique = [...new Set(session.matchWordIds || session.recentWordIds || [])];
  progress.recentMatchWordIds = [...(progress.recentMatchWordIds || []), unique].slice(-2);
  progress.matchesPlayed = (progress.matchesPlayed || 0) + 1;
  progress.lastMatchSignature = unique.join("|");
  const current = FOOTBALL_LEAGUES[leagueIndex(progress.currentLeague)];
  const mastered = Object.values(progress.words || {}).filter(w => w.league === current.id && w.mastered).length;
  const seen = (progress.seenWordIds || []).filter(id => (progress.words[id]?.league || current.id) === current.id).length;
  const percent = Math.round((session.correct || 0) / Math.max(1, session.questionsAsked || session.maxQuestions) * 100);
  if (leagueIndex(progress.currentLeague) < FOOTBALL_LEAGUES.length - 1 && seen >= current.minSeen && mastered >= current.minMastered && percent >= 80) {
    progress.currentLeague = FOOTBALL_LEAGUES[leagueIndex(progress.currentLeague) + 1].id;
  }
  writeFootballLeagueProgress(progress, storage);
  return progress;
}

export function mergeMatchStats(stats, session, studyStreak = 0) {
  const summary = session.summary || summarizeFootball(session).summary;
  const next = { ...defaultFootballStats(), ...stats };
  next.matches += 1;
  next.wins += summary.goalsFor > summary.goalsAgainst ? 1 : 0;
  next.goalsFor += summary.goalsFor;
  next.goalsAgainst += summary.goalsAgainst;
  next.saves += summary.saves;
  next.bestStreak = Math.max(next.bestStreak || 0, session.streak || 0);
  next.studyStreak = studyStreak;
  next.lastMatch = summary;
  for (const id of session.recentWordIds) next.studiedWords[id] = (next.studiedWords[id] || 0) + 1;
  return next;
}

export function unlockTrophies(stats, achievements = defaultAchievements()) {
  const next = { ...defaultAchievements(), ...achievements, unlocked: { ...(achievements.unlocked || {}) }, locked: { ...(achievements.locked || {}), "hard-opponent": true } };
  const newlyUnlocked = [];
  for (const trophy of TROPHIES) {
    if (trophy.locked || next.unlocked[trophy.id]) continue;
    if (trophy.test?.(stats)) {
      next.unlocked[trophy.id] = { title: trophy.title, unlockedAt: new Date().toISOString() };
      newlyUnlocked.push(trophy);
    }
  }
  return { achievements: next, newlyUnlocked };
}

export function shouldUseVideo(event, reducedMotion = false) {
  return !reducedMotion && ["GOAL_SCORED", "SHOT_MISSED_POST", "SAVE_SUCCESS", "GOAL_CONCEDED"].includes(event);
}
