// Uses only authored lesson questions. No network call or generated answer key.
export function practiceForWrongAnswer(lesson, screen, lastChoice) {
  const sources = lesson.screens.flatMap(item => {
    const c = item.content || {};
    if (item.type === "multiple-choice") return [{screenId:item.id, question:c.prompt || item.instructionTr || item.title, ...c}];
    if (item.type === "reading") return (c.questions || []).map(q => ({screenId:item.id, question:q.prompt, ...q}));
    if (item.type === "mini-game" || item.type === "vocabulary-hunt") return (c.rounds || []).map(q => ({screenId:item.id, question:q.prompt, ...q}));
    return [];
  });
  const eligible = sources.filter(q => q.question && q.question !== lastChoice.question && Array.isArray(q.options) && q.options.length > 1 && Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < q.options.length);
  const next = eligible.find(q => q.screenId === screen.id) || eligible.find(q => q.screenId !== screen.id);
  return next ? {question:next.question, options:next.options, correctIndex:next.correctIndex, explanation:next.explanationTr || "Doğru seçeneği cümlede yerine koyup tekrar oku."} : null;
}

export function tutorExplanation(screen, choice) {
  const c = screen.content || {};
  const source = screen.type === "reading" ? c.questions?.[(choice.round || 1) - 1] : ["mini-game","vocabulary-hunt"].includes(screen.type) ? c.rounds?.[(choice.round || 1) - 1] : c;
  const index = source?.options?.findIndex(x => x === choice.selected);
  const detail = source?.explanationsTr?.[index] || source?.optionExplanationsTr?.[index] || source?.wrongExplanationTr || screen.explanationTr || "Cümledeki özneye ve öğrendiğin kurala tekrar bak.";
  return `${detail} Doğru cevap: ${choice.correctAnswer}.`;
}
