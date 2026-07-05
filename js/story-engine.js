export const STORY_DATA_URL = "data/stories/story-001.json";
export const STORY_ASSET_ROOT = "assets/stories/story-001/";
export const STORY_PROGRESS_KEY = "pomaAcademy.stories.v1";

export const STORY_PARENT_SUMMARY = {
  summaryTr: "Poma, kale kapısında öğrenciyi karşılar. Poma Dahi, Influencer Poma ve küçük bir yavru kurt sırayla gelir. Öğrenci karakterleri I, you, he, she, it, we ve they zamirleriyle eşleştirir.",
  pronouns: ["I", "you", "he", "she", "it", "we", "they"],
  homePractice: [
    "Aile üyelerini veya oyuncakları göstererek Who is he?, Who is she?, What is it? sorularını sorun.",
    "Çocuğu He is my father, She is my sister, It is my toy gibi tam cümlelerle cevap vermeye teşvik edin.",
    "We are a family ve They are friends cümleleriyle we / they farkını kısa tekrar edin."
  ],
  commonMixup: "Türkçede özne bazen söylenmez; İngilizcede başlangıç seviyesinde özneyi açık kullanmak gerekir."
};

export const STORY_TEACHER_GUIDE = {
  objective: "Öğrenci I, you, he, she, it, we, they zamirlerini karakter, hayvan ve grup bağlamıyla eşleştirir.",
  duration: "25-35 dakika",
  warmup: "Öğretmen kendini ve öğrenciyi göstererek I am the teacher. You are the student. cümlelerini model olur.",
  storyFlow: "Hikaye ilk turda kesintisiz izlenir; ikinci turda he / she / it ve we / they ayrımı fark ettirilir.",
  classActivity: "Pronoun Corners: HE, SHE, IT, THEY kartları sınıf köşelerine yerleştirilir; öğrenciler gösterilen görsele göre doğru köşeye gider.",
  worksheet: "Karakteri doğru zamirle eşleştir, boşluğu doldur, we / they ayrımını yap ve üç karakter için cümle yaz.",
  answerKey: ["Poma: I", "Student: you", "Poma Dahi: he", "Influencer Poma: she", "little wolf: it", "Poma + student: we", "Poma group: they"],
  wrongExplanations: [
    "Poma Dahi erkek bir karakter olduğu için he kullanılır.",
    "İnsan olmayan tek bir hayvan veya nesne için başlangıç seviyesinde it kullanılır.",
    "Konuşan kişi grubun içindeyse we, dışındaysa they kullanılır."
  ],
  differentiation: "Desteğe ihtiyaç duyan öğrenciyle he / she / it üzerinden başlayın; hızlı ilerleyen öğrenci kendi cümlelerini kursun.",
  successCriteria: "6 soruluk quizde en az 4 doğru, sözlü görevde en az 3 doğru cümle ve we / they ayrımında en az 1 doğru cevap."
};

export async function loadStoryBundle(fetcher = globalThis.fetch) {
  const [storyResponse, manifestResponse] = await Promise.all([
    fetcher(STORY_DATA_URL),
    fetcher(`${STORY_ASSET_ROOT}asset-manifest.json`)
  ]);
  if (!storyResponse.ok) throw new Error("Hikaye verisi yüklenemedi.");
  if (!manifestResponse.ok) throw new Error("Hikaye asset manifesti yüklenemedi.");
  const story = await storyResponse.json();
  const assetManifest = await manifestResponse.json();
  return normalizeStory({ ...story, parentSummary: STORY_PARENT_SUMMARY, teacherGuide: STORY_TEACHER_GUIDE, assetManifest });
}

export function normalizeStory(story) {
  return {
    ...story,
    slides: Array.isArray(story.slides) ? story.slides.map((slide, index) => Object.freeze({ ...slide, index })) : [],
    quiz: Array.isArray(story.quiz) ? story.quiz.map(q => Object.freeze({ ...q, options: Object.freeze([...(q.options || [])]) })) : [],
    completion: { passScore: 4, maxScore: 6, ...(story.completion || {}) }
  };
}

export function resolveStoryAsset(story, mediaId) {
  const asset = story?.assetManifest?.assets?.[mediaId];
  if (!asset) return null;
  return { ...asset, url: `${STORY_ASSET_ROOT}${asset.file}`, posterUrl: asset.poster ? `${STORY_ASSET_ROOT}${asset.poster}` : null };
}

export function validateStory(story) {
  const required = ["storyId", "lessonNo", "moduleNo", "title", "level", "grammarTarget", "targetWords", "slides", "quiz", "completion", "parentSummary", "teacherGuide", "assetManifest"];
  const missing = required.filter(key => story[key] == null);
  if (missing.length) return { ok: false, reason: `Eksik alan: ${missing.join(", ")}` };
  for (const question of story.quiz) {
    const unique = new Set(question.options);
    const answerCount = question.options.filter(x => x === question.answer).length;
    if (unique.size !== question.options.length || answerCount !== 1) return { ok: false, reason: `Geçersiz quiz: ${question.id}` };
  }
  return { ok: true };
}

export function defaultStoryProgress(storyId = "story-001") {
  return { schemaVersion: 1, storyId, opened: false, lastScene: 0, completed: false, quizScore: null, wrongPronouns: [], seenTargetWords: [], completedAt: null, rewardGranted: false };
}

export function safeReadStoryStore(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(STORY_PROGRESS_KEY) || "{}");
    if (!parsed || parsed.schemaVersion !== 1 || typeof parsed.stories !== "object") return { schemaVersion: 1, stories: {} };
    return parsed;
  } catch {
    return { schemaVersion: 1, stories: {} };
  }
}

export function readStoryProgress(storage, storyId) {
  const store = safeReadStoryStore(storage);
  return { ...defaultStoryProgress(storyId), ...(store.stories?.[storyId] || {}) };
}

export function writeStoryProgress(storage, storyId, updater) {
  const store = safeReadStoryStore(storage);
  const current = { ...defaultStoryProgress(storyId), ...(store.stories?.[storyId] || {}) };
  const next = updater({ ...current }) || current;
  store.stories = { ...(store.stories || {}), [storyId]: next };
  storage.setItem(STORY_PROGRESS_KEY, JSON.stringify(store));
  return next;
}

export function markStoryOpened(storage, story) {
  return writeStoryProgress(storage, story.storyId, progress => ({ ...progress, opened: true, lastScene: Math.max(0, progress.lastScene || 0) }));
}

export function updateStoryScene(storage, story, sceneIndex) {
  const words = story.targetWords.map(x => x.word);
  return writeStoryProgress(storage, story.storyId, progress => ({ ...progress, opened: true, lastScene: sceneIndex, seenTargetWords: [...new Set([...(progress.seenTargetWords || []), ...words])] }));
}

export function gradeStoryQuiz(story, answers) {
  const rows = story.quiz.map(question => {
    const selected = answers?.[question.id];
    const correct = selected === question.answer;
    return { questionId: question.id, selected, answer: question.answer, correct, feedbackTr: question.feedbackTr };
  });
  const score = rows.filter(x => x.correct).length;
  const wrongPronouns = rows.filter(x => !x.correct).map(x => x.answer);
  return { score, maxScore: story.quiz.length, passed: score >= story.completion.passScore, wrongPronouns: [...new Set(wrongPronouns)], rows };
}

export function completeStoryQuiz(storage, story, answers) {
  const result = gradeStoryQuiz(story, answers);
  return writeStoryProgress(storage, story.storyId, progress => ({
    ...progress,
    opened: true,
    completed: result.passed,
    quizScore: result.score,
    wrongPronouns: result.wrongPronouns,
    seenTargetWords: [...new Set([...(progress.seenTargetWords || []), ...story.targetWords.map(x => x.word)])],
    completedAt: result.passed ? (progress.completedAt || new Date().toISOString()) : progress.completedAt,
    rewardGranted: result.passed ? true : progress.rewardGranted
  }));
}
