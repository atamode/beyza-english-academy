import { getActiveStudentId, enqueueOfflineMutation, readOfflineQueue, clearOfflineQueue } from "./account-storage.js";
import { loadState } from "./storage.js";
import { createStudentRepository } from "./student-repository.js";

export function mergeStudentState(localState, remoteState) {
  if (!remoteState) return localState;
  return {
    ...remoteState,
    ...localState,
    lessonProgress: { ...(remoteState.lessonProgress || {}), ...(localState.lessonProgress || {}) },
    moduleReviews: { ...(remoteState.moduleReviews || {}), ...(localState.moduleReviews || {}) },
    vocabularyProgress: { ...(remoteState.vocabularyProgress || {}), ...(localState.vocabularyProgress || {}) },
    totals: { ...(remoteState.totals || {}), ...(localState.totals || {}) },
    settings: { ...(remoteState.settings || {}), ...(localState.settings || {}) }
  };
}

export function learningEventsFromStateChange(previous={},next={}) {
  const events=[];
  for(const [lessonId,lesson] of Object.entries(next.lessonProgress||{})){
    const old=(previous.lessonProgress||{})[lessonId]||{};
    if(lesson.completed&&!old.completed&&lesson.completedAt){
      events.push({eventType:"lesson_completed",contentType:"lesson",contentId:lessonId,lessonId,idempotencyKey:`lesson:${lessonId}:${lesson.completedAt}`});
      for(const [screenId,answer] of Object.entries(lesson.answers||{}))if(answer?.completed){events.push({eventType:"question_answered",contentType:"question",contentId:screenId,lessonId,topicKey:answer.topicKey||lessonId,isCorrect:!(Number(answer.wrongCount||0)+Number(answer.wrongAttempts||0)>0),idempotencyKey:`answer:${lessonId}:${screenId}:${lesson.completedAt}`});}
    }
  }
  for(const [wordId,word] of Object.entries(next.vocabularyProgress||{})){const old=(previous.vocabularyProgress||{})[wordId]||{};if(word.lastSeen&&word.lastSeen!==old.lastSeen)events.push({eventType:"word_practiced",contentType:"word",contentId:wordId,idempotencyKey:`word:${wordId}:${word.lastSeen}`});}
  return events;
}

export function createSyncEngine(repo = createStudentRepository()) {
  return {
    async syncNow(childId = getActiveStudentId(), state = loadState(), expectedRevision = Number(sessionStorage.getItem(`poma.revision.${childId}`) || 0)) {
      if (!childId) return { skipped: true };
      if (!navigator.onLine) {
        enqueueOfflineMutation(childId, { kind: "student_state", state });
        return { offline: true };
      }
      try {
        const previous=(await repo.getStudentState(childId))?.state||{};
        const result = await repo.upsertStudentState(childId, state, expectedRevision);
        if (result.conflict) {
          const merged = mergeStudentState(state, result.remote?.state || {});
          sessionStorage.setItem(`poma.revision.${childId}`, String(result.remote?.revision || expectedRevision));
          enqueueOfflineMutation(childId, { kind: "conflict_snapshot", state, remote: result.remote });
          return { conflict: true, merged };
        }
        for(const event of learningEventsFromStateChange(previous,state))await repo.recordLearningEvent(childId,event);
        sessionStorage.setItem(`poma.revision.${childId}`, String(result.row?.revision || expectedRevision + 1));
        return { ok: true, revision: result.row?.revision };
      } catch (error) {
        enqueueOfflineMutation(childId, { kind: "student_state", state, error: error.message });
        return { offline: true, error };
      }
    },
    async flushQueue(childId = getActiveStudentId()) {
      if (!childId || !navigator.onLine) return { skipped: true };
      const queue = readOfflineQueue(childId);
      if (!queue.length) return { ok: true, count: 0 };
      const last = [...queue].reverse().find(x => x.kind === "student_state");
      if (last) await this.syncNow(childId, last.state);
      clearOfflineQueue(childId);
      return { ok: true, count: queue.length };
    }
  };
}

let timer = null;
export function scheduleStudentSync(engine = createSyncEngine(), delay = 900) {
  clearTimeout(timer);
  timer = setTimeout(() => engine.syncNow(), delay);
}
