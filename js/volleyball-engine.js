import {
  FOOTBALL_CONFIG,
  FOOTBALL_KEYS,
  availableFootballWords,
  createFootballMatchQuestions,
  defaultAchievements,
  defaultFootballLeagueProgress,
  finalizeFootballLeagueMatch,
  footballLeagueLabel,
  makeQuestionForWord,
  recordFootballAnswer,
  recordFootballLeagueAnswer,
  readFootballLeagueProgress,
  safeRead,
  safeWrite,
  summarizeFootball,
} from "./football-engine.js";

export const VOLLEYBALL_KEYS = {
  stats: "beyzaAcademy.games.volleyball.v1.stats",
  achievements: "beyzaAcademy.games.volleyball.v1.achievements",
  session: "beyzaAcademy.games.volleyball.v1.session",
  league: FOOTBALL_KEYS.league
};

export const VOLLEYBALL_CONFIG = { ...FOOTBALL_CONFIG };

export const VOLLEYBALL_PHASES = {
  MATCH_INTRO: { visual: "MATCH_INTRO", next: "POSSESSION_QUESTION" },
  POSSESSION_QUESTION: { visual: "possession", question: "Servis kimde?", correct: "PASS_RESULT", wrong: "RECEIVE_QUESTION" },
  PASS_RESULT: { correctVisual: "passSuccess", wrongVisual: "shotMissed", correctNext: "SPIKE_QUESTION", wrongNext: "RECEIVE_QUESTION" },
  SPIKE_QUESTION: { visual: "shot", question: "Smaç", correct: "SPIKE_RESULT", wrong: "SPIKE_RESULT" },
  SPIKE_RESULT: { correctVisual: "shotSuccess", wrongVisual: "shotMissed", correctNext: "ROUND_RESET", wrongNext: "ROUND_RESET", correctPoint: 1, wrongBlock: 1 },
  RECEIVE_QUESTION: { visual: "pass", question: "Karşılama", correct: "RECEIVE_RESULT", wrong: "OPPONENT_SPIKE_QUESTION" },
  RECEIVE_RESULT: { correctVisual: "saveSuccess", wrongVisual: "conceded", correctNext: "POSSESSION_QUESTION", wrongNext: "OPPONENT_SPIKE_QUESTION", correctSave: 1 },
  OPPONENT_SPIKE_QUESTION: { visual: "defence", question: "Blok / kurtarış", correct: "OPPONENT_SPIKE_RESULT", wrong: "OPPONENT_SPIKE_RESULT" },
  OPPONENT_SPIKE_RESULT: { correctVisual: "defenceSuccess", wrongVisual: "conceded", correctNext: "POSSESSION_QUESTION", wrongNext: "ROUND_RESET", correctBlock: 1, wrongConcede: 1 },
  ROUND_RESET: { visual: "MATCH_INTRO", next: "POSSESSION_QUESTION" },
  MATCH_SUMMARY: { visual: "MATCH_INTRO" }
};

export const VOLLEYBALL_TROPHIES = [
  { id: "first-set-win", title: "İlk Set Kupası", test: s => s.lastMatch?.pointsFor > s.lastMatch?.pointsAgainst },
  { id: "three-set-wins", title: "3 Set Kazandın", test: s => (s.wins || 0) >= 3 },
  { id: "ten-points", title: "10 Sayı", test: s => (s.pointsFor || 0) >= 10 },
  { id: "five-blocks", title: "5 Blok / Kurtarış", test: s => ((s.blocks || 0) + (s.saves || 0)) >= 5 },
  { id: "volley-word-master", title: "Voleybol Kelime Ustası", test: s => (s.lastMatch?.correct || 0) >= 8 }
];

export const defaultVolleyballStats = () => ({ version: 1, matches: 0, wins: 0, pointsFor: 0, pointsAgainst: 0, blocks: 0, saves: 0, bestStreak: 0, studiedWords: {}, lastMatch: null, studyStreak: 0 });
export const defaultVolleyballAchievements = () => ({ version: 1, unlocked: {}, locked: {} });

export function availableVolleyballWords(vocabulary, state) {
  return availableFootballWords(vocabulary, state);
}

export function createVolleyballSession(words, state, rng = Math.random, storage) {
  const progress = readFootballLeagueProgress(storage);
  const matchQuestions = createFootballMatchQuestions(words, state, progress, rng);
  const matchId = `v-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    phase: "MATCH_INTRO",
    visual: "MATCH_INTRO",
    questionsAsked: 0,
    maxQuestions: matchQuestions.length || VOLLEYBALL_CONFIG.maxQuestions,
    matchId,
    sport: "volleyball",
    league: progress.currentLeague || defaultFootballLeagueProgress().currentLeague,
    leagueLabel: footballLeagueLabel(progress.currentLeague || "starter"),
    matchQuestions,
    pointsFor: 0,
    pointsAgainst: 0,
    blocks: 0,
    saves: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    recentWordIds: [],
    matchWordIds: matchQuestions.map(q => q.wordId),
    newWordIds: matchQuestions.filter(q => !(progress.seenWordIds || []).includes(q.wordId)).map(q => q.wordId),
    masteredThisMatch: [],
    reviewWordIds: matchQuestions.filter(q => progress.words?.[q.wordId]?.nextReviewAt && new Date(progress.words[q.wordId].nextReviewAt).getTime() <= Date.now()).map(q => q.wordId),
    difficultWords: {},
    currentQuestion: matchQuestions[0] || null,
    summary: null,
    lastResult: null
  };
}

export function validateVolleyballQuestion(question) {
  return Boolean(question?.wordId && question?.prompt && Array.isArray(question.options) && question.options.length === 4 && new Set(question.options).size === 4 && question.options.filter(x => x === question.correctAnswer).length === 1);
}

export function answerVolleyballQuestion(session, selectedIndex, words, academyState, rng = () => 0.37) {
  if (!session.currentQuestion || session.phase === "MATCH_SUMMARY") return session;
  const correct = Number(selectedIndex) === session.currentQuestion.correctIndex;
  const phase = VOLLEYBALL_PHASES[session.phase];
  const resultPhase = phase?.[correct ? "correct" : "wrong"] || session.phase;
  const result = applyVolleyballResult({ ...session }, resultPhase, correct);
  const word = session.currentQuestion.word;
  result.recentWordIds = [...session.recentWordIds, word.id].slice(-VOLLEYBALL_CONFIG.maxQuestions);
  if (!correct) {
    const repeatAt = result.questionsAsked + 3;
    if (repeatAt < result.matchQuestions.length && !result.matchQuestions.slice(result.questionsAsked).some(q => q.wordId === word.id)) {
      result.matchQuestions = [...result.matchQuestions];
      result.matchQuestions[repeatAt] = makeQuestionForWord(word, words, repeatAt, rng) || result.matchQuestions[repeatAt];
      result.matchWordIds = result.matchQuestions.map(q => q.wordId);
    }
  }
  result.currentQuestion = result.matchQuestions[result.questionsAsked] || null;
  result.lastResult = { correct, wordId: word.id, word: word.word, meaningTr: word.meaningTr, explanation: session.currentQuestion.TurkishExplanation };
  return result;
}

export function applyVolleyballResult(session, resultPhase, correct) {
  const cfg = VOLLEYBALL_PHASES[resultPhase];
  session.phase = resultPhase;
  session.visual = (correct ? cfg.correctVisual : cfg.wrongVisual) || cfg.visual || "possession";
  session.pendingNext = correct ? cfg.correctNext : cfg.wrongNext;
  session.questionsAsked += 1;
  session.correct += correct ? 1 : 0;
  session.wrong += correct ? 0 : 1;
  session.streak = correct ? session.streak + 1 : 0;
  if (cfg.correctPoint && correct) session.pointsFor += 1;
  if (cfg.correctBlock && correct) session.blocks += 1;
  if (cfg.correctSave && correct) session.saves += 1;
  if (cfg.wrongBlock && !correct) session.blocks += 1;
  if (cfg.wrongConcede && !correct) session.pointsAgainst += 1;
  return session;
}

export function advanceVolleyball(session) {
  if (session.phase === "MATCH_INTRO") return { ...session, phase: "POSSESSION_QUESTION", visual: "possession" };
  if (session.questionsAsked >= session.maxQuestions) return summarizeVolleyball(session);
  const next = session.pendingNext || VOLLEYBALL_PHASES[session.phase]?.next || "POSSESSION_QUESTION";
  if (next === "ROUND_RESET") {
    if (session.questionsAsked >= session.maxQuestions) return summarizeVolleyball(session);
    return { ...session, phase: "POSSESSION_QUESTION", visual: "possession", pendingNext: null };
  }
  return { ...session, phase: next, visual: VOLLEYBALL_PHASES[next]?.visual || "possession", pendingNext: null };
}

export function summarizeVolleyball(session) {
  const base = summarizeFootball({ ...session, goalsFor: session.pointsFor, goalsAgainst: session.pointsAgainst, saves: session.saves });
  const summary = {
    ...base.summary,
    score: `${session.pointsFor}-${session.pointsAgainst}`,
    pointsFor: session.pointsFor,
    pointsAgainst: session.pointsAgainst,
    blocks: session.blocks,
    saves: session.saves,
    difficult: Object.entries(session.difficultWords || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id)
  };
  return { ...session, phase: "MATCH_SUMMARY", visual: session.pointsFor >= session.pointsAgainst ? "win" : "lose", summary };
}

export function mergeVolleyballStats(stats, session, studyStreak = 0) {
  const summary = session.summary || summarizeVolleyball(session).summary;
  const next = { ...defaultVolleyballStats(), ...stats, studiedWords: { ...(stats.studiedWords || {}) } };
  next.matches += 1;
  next.wins += summary.pointsFor > summary.pointsAgainst ? 1 : 0;
  next.pointsFor += summary.pointsFor;
  next.pointsAgainst += summary.pointsAgainst;
  next.blocks += summary.blocks || 0;
  next.saves += summary.saves || 0;
  next.bestStreak = Math.max(next.bestStreak || 0, session.streak || 0);
  next.studyStreak = studyStreak;
  next.lastMatch = summary;
  for (const id of session.recentWordIds || []) next.studiedWords[id] = (next.studiedWords[id] || 0) + 1;
  return next;
}

export function unlockVolleyballTrophies(stats, achievements = defaultVolleyballAchievements()) {
  const next = { ...defaultVolleyballAchievements(), ...achievements, unlocked: { ...(achievements.unlocked || {}) }, locked: { ...(achievements.locked || {}) } };
  const newlyUnlocked = [];
  for (const trophy of VOLLEYBALL_TROPHIES) {
    if (next.unlocked[trophy.id]) continue;
    if (trophy.test?.(stats)) {
      next.unlocked[trophy.id] = { title: trophy.title, unlockedAt: new Date().toISOString() };
      newlyUnlocked.push(trophy);
    }
  }
  return { achievements: next, newlyUnlocked };
}

export { recordFootballAnswer as recordVolleyballAnswer, recordFootballLeagueAnswer, finalizeFootballLeagueMatch, safeRead, safeWrite };

export function shouldUseVolleyballVideo(event, reducedMotion = false) {
  return !reducedMotion && ["passSuccess", "shotSuccess", "shotMissed", "defenceSuccess", "saveSuccess", "conceded", "win", "lose"].includes(event);
}
