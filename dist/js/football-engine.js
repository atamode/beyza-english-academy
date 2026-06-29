import {recordWordAnswer} from "./vocabulary-engine.js";

export const FOOTBALL_KEYS = {
  stats: "beyzaAcademy.games.football.v1.stats",
  achievements: "beyzaAcademy.games.football.v1.achievements",
  session: "beyzaAcademy.games.football.v1.session"
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

export function safeRead(key, fallback, storage = localStorage) {
  try {
    const raw = storage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

export function safeWrite(key, value, storage = localStorage) {
  storage.setItem(key, JSON.stringify(value));
  return value;
}

export const defaultFootballStats = () => ({ version: 1, matches: 0, wins: 0, goalsFor: 0, goalsAgainst: 0, saves: 0, bestStreak: 0, studiedWords: {}, recoveredDifficult: 0, lastMatch: null, studyStreak: 0 });
export const defaultAchievements = () => ({ version: 1, unlocked: {}, locked: { "hard-opponent": true } });

export function createFootballSession(words, state, rng = () => 0.37) {
  const question = selectWordQuestion(words, state, [], rng);
  return {
    phase: "MATCH_INTRO",
    visual: "MATCH_INTRO",
    questionsAsked: 0,
    maxQuestions: FOOTBALL_CONFIG.maxQuestions,
    goalsFor: 0,
    goalsAgainst: 0,
    saves: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    recentWordIds: [],
    difficultWords: {},
    currentQuestion: question,
    summary: null,
    lastResult: null
  };
}

export function availableFootballWords(vocabulary, state) {
  const progress = state?.vocabularyProgress || {};
  const touched = vocabulary.filter(w => progress[w.id]?.lastSeen || progress[w.id]?.correct || progress[w.id]?.wrong);
  return touched.length ? touched : vocabulary.slice(0, Math.min(vocabulary.length, 24));
}

export function selectWordQuestion(words, state = {}, recentWordIds = [], rng = () => 0.37) {
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
  const distractors = footballDistractors(word, words);
  const options = rotateOptions([word.meaningTr, ...distractors], recentWordIds.length);
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
    mastery: progress[word.id]?.box || 0,
    wrongCount: progress[word.id]?.wrong || 0,
    lastSeen: progress[word.id]?.lastSeen || null
  };
  return validateFootballQuestion(question) ? freezeQuestion(question) : null;
}

function rotateOptions(options, offset) {
  const unique = [...new Set(options.map(x => String(x ?? "").trim()).filter(Boolean))].slice(0, 4);
  while (unique.length < 4) unique.push(`güvenli seçenek ${unique.length + 1}`);
  const correct = unique[0], rest = unique.slice(1);
  const out = [...rest];
  out.splice(offset % (rest.length + 1), 0, correct);
  return out;
}

export function footballDistractors(word, words) {
  const correct = String(word?.meaningTr ?? "").trim();
  const sameTheme = words.filter(w => w.id !== word.id && w.theme && w.theme === word.theme).map(w => w.meaningTr);
  const sameLesson = words.filter(w => w.id !== word.id && w.lessonId === word.lessonId).map(w => w.meaningTr);
  const all = words.filter(w => w.id !== word.id).map(w => w.meaningTr);
  const safe = ["kitapçı", "sınıf", "müze", "film", "resim", "oyun", "takım", "antrenman", "saha", "şehir"];
  return [...new Set([...sameTheme, ...sameLesson, ...all, ...safe].map(x => String(x ?? "").trim()).filter(x => x && x !== correct))].slice(0, 3);
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
  result.recentWordIds = [...session.recentWordIds, word.id].slice(-FOOTBALL_CONFIG.recentWindow);
  result.currentQuestion = selectWordQuestion(words, academyState, result.recentWordIds, rng);
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
      difficult: Object.entries(session.difficultWords || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id)
    }
  };
}

export function recordFootballAnswer(academyState, question, correct) {
  recordWordAnswer(academyState, question.word, correct);
  return academyState;
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
