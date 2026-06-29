export function pointsForAttempt(attempt, usedHint = false) {
  const base = attempt <= 1 ? 10 : attempt === 2 ? 6 : 3;
  return usedHint ? Math.min(base, 5) : base;
}

export function starsForPercent(percent) {
  if (percent >= 90) return 3;
  if (percent >= 75) return 2;
  if (percent >= 60) return 1;
  return 0;
}
export function matchingPoints(maxPoints,wrongAttempts){return Math.max(3,maxPoints-wrongAttempts*3)}
export function roundFeedbackTone(correct){return correct?"correct":"incorrect"}

export function diagnosticBand(score) {
  if (score <= 7) return { label: "A1 temel köprü", startLesson: "001-subject-pronouns" };
  if (score <= 13) return { label: "A1 orta", startLesson: "008-present-simple-affirmative" };
  if (score <= 18) return { label: "A1 sonu", startLesson: "026-present-simple-vs-continuous" };
  if (score <= 22) return { label: "A2 başlangıç", startLesson: "041-was-were" };
  return { label: "A2 orta başlangıç", startLesson: "056-present-perfect-intro" };
}

export function analyzeDiagnostic(questions, answers) {
  const topics = {};
  let score = 0;
  questions.forEach((question, index) => {
    const correct = Number(answers[index]) === question.correctIndex;
    if (correct) score += 1;
    if (!topics[question.topicTag]) topics[question.topicTag] = { correct: 0, total: 0, label: question.topicLabel };
    topics[question.topicTag].total += 1;
    if (correct) topics[question.topicTag].correct += 1;
  });
  const topicAnalysis = Object.entries(topics).map(([id, value]) => ({ id, ...value, percent: Math.round(value.correct / value.total * 100) }));
  const groupDefs={
    "Temel cümle yapıları":["pronouns","to-be","to-be-negative","to-be-questions","possessives","have-got"],
    "Günlük zamanlar":["present-simple","do-does","dont-doesnt","frequency","present-continuous","tense-choice"],
    "Yer, miktar ve çevre":["there-is-are","prepositions","countability","some-any"],
    "Yetenek ve kurallar":["can"],
    "Geçmiş, gelecek ve karşılaştırma":["past-simple","comparatives","future"],
    "Okuma ve dinleme":["reading","reading-detail","listening","sentence-order","error-finding"]
  };
  const skillGroups=Object.entries(groupDefs).map(([label,ids])=>{const rows=topicAnalysis.filter(t=>ids.includes(t.id));const correct=rows.reduce((n,t)=>n+t.correct,0),total=rows.reduce((n,t)=>n+t.total,0);return {label,correct,total,percent:total?Math.round(correct/total*100):0}});
  return {
    score,
    total: questions.length,
    percent: Math.round(score / questions.length * 100),
    band: diagnosticBand(score),
    topics: topicAnalysis,
    skillGroups,
    strengths: topicAnalysis.filter(t => t.percent >= 75),
    needsWork: topicAnalysis.filter(t => t.percent < 60)
  };
}
