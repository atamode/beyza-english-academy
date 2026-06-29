import { analyzeDiagnostic } from "./scoring.js";

export function createDiagnosticSession(questions, saved = null) {
  if(saved?.answers?.length===questions.length)return {questions,index:Math.min(saved.index||0,questions.length-1),answers:saved.answers,startedAt:saved.startedAt||new Date().toISOString()};
  return { questions, index: 0, answers: Array(questions.length).fill(null), startedAt: new Date().toISOString() };
}

export function diagnosticDraft(session){return {index:session.index,answers:session.answers,startedAt:session.startedAt,earlyPrompt:session.earlyPrompt||false}}

export function answerDiagnostic(session, answerIndex) {
  session.answers[session.index] = Number(answerIndex);
  return session;
}

export function finishDiagnostic(session) {
  return { ...analyzeDiagnostic(session.questions, session.answers), answers: session.answers, completedAt: new Date().toISOString() };
}
