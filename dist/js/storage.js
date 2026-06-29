const STORAGE_KEY = "beyzaEnglish.progress.v1";
const VERSION = 2;

export const defaultState = () => ({
  version: VERSION,
  profile: { name: "Beyza", age: 11, createdAt: null },
  onboardingComplete: false,
  diagnostic: null,
  diagnosticDraft: null,
  selectedLessonId: null,
  recommendedLessonId: null,
  lessonProgress: {},
  moduleReviews: {},
  moduleReviewDraft: null,
  vocabularyProgress: {},
  vocabularyTournament: {},
  totals: { points: 0, stars: 0, completedLessons: 0 },
  streak: { count: 0, lastStudyDate: null },
  settings: { theme: "light", muted: false }
});

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (parsed.version !== VERSION) return migrate(parsed);
    return { ...defaultState(), ...parsed, settings: { ...defaultState().settings, ...parsed.settings } };
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: VERSION }));
  return state;
}

export function updateState(updater) {
  const state = loadState();
  const next = updater(structuredClone(state)) || state;
  return saveState(next);
}

export function resetState() { localStorage.removeItem(STORAGE_KEY); }

export function markStudyDay(state) {
  const today = localDateKey(new Date());
  if (state.streak.lastStudyDate === today) return state;
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = localDateKey(yesterdayDate);
  state.streak.count = state.streak.lastStudyDate === yesterday ? state.streak.count + 1 : 1;
  state.streak.lastStudyDate = today;
  return state;
}

export function localDateKey(date) {
  const year=date.getFullYear(),month=String(date.getMonth()+1).padStart(2,"0"),day=String(date.getDate()).padStart(2,"0");
  return `${year}-${month}-${day}`;
}

function migrate(oldState) {
  return { ...defaultState(), ...oldState, settings:{...defaultState().settings,...oldState.settings}, version: VERSION };
}
