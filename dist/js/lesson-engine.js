import { starsForPercent } from "./scoring.js";
import { isInteractive } from "./activity-renderers.js";

export function createLessonSession(lesson, saved={}) {
  return { lesson, index: saved.currentScreen||0, answers: saved.answers||{}, startedAt:saved.startedAt||new Date().toISOString(), completed:false };
}
export function lessonStats(session){
  const interactive=session.lesson.screens.filter(s=>isInteractive(s.type));
  const completed=interactive.filter(s=>session.answers[s.id]?.completed).length;
  const points=Object.values(session.answers).reduce((sum,a)=>sum+(a.points||0),0);
  const max=interactive.reduce((sum,s)=>sum+(s.points||10),0);
  const percent=max?Math.round(points/max*100):0;
  return {completed,total:interactive.length,points,max,percent,stars:starsForPercent(percent),allDone:completed===interactive.length};
}
