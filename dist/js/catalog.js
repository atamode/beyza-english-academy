export function flattenLessons(curriculum){return curriculum.modules.flatMap(module=>module.lessons.map(lesson=>({...lesson,moduleId:module.id,moduleTitle:module.title})))}
export function lessonById(curriculum,id){return flattenLessons(curriculum).find(lesson=>lesson.id===id)||null}
export function completedIds(state){return new Set(Object.entries(state.lessonProgress||{}).filter(([,p])=>p.completed).map(([id])=>id))}
export function isUnlocked(lesson,state,curriculum){
  if(lesson.status!=="published")return false;
  if(state.recommendedLessonId===lesson.id)return true;
  if(state.diagnostic?.band?.startLesson===lesson.id)return true;
  if(state.diagnostic&&resolveRecommendation(curriculum,state.diagnostic.band.startLesson,state).available?.id===lesson.id)return true;
  const done=completedIds(state);
  return (lesson.prerequisites||[]).every(id=>done.has(id));
}
export function nextAvailableLesson(curriculum,state){
  const all=flattenLessons(curriculum).filter(x=>x.status==="published");
  const recommended=state.diagnostic?.band?.startLesson?resolveRecommendation(curriculum,state.diagnostic.band.startLesson,state):null;
  if(recommended?.available&&!state.lessonProgress[recommended.available.id]?.completed)return recommended.available;
  return all.find(lesson=>isUnlocked(lesson,state,curriculum)&&!state.lessonProgress[lesson.id]?.completed)||all.find(lesson=>isUnlocked(lesson,state,curriculum))||null;
}
export function resolveRecommendation(curriculum,targetId,state={lessonProgress:{}}){
  const all=flattenLessons(curriculum),target=lessonById(curriculum,targetId);
  if(target?.status==="published")return {target,available:target,fallback:false};
  const targetOrder=target?.order??Number(String(targetId||"").match(/^\d+/)?.[0]||Infinity);
  const candidates=all.filter(x=>x.status==="published"&&(x.order??0)<=targetOrder);
  return {target:target||{id:targetId,title:"Henüz yayımlanmamış hedef ders"},available:candidates.at(-1)||all.find(x=>x.status==="published")||null,fallback:true};
}
export function nextLesson(curriculum,currentId){const all=flattenLessons(curriculum).filter(x=>x.status==="published");const i=all.findIndex(x=>x.id===currentId);return i>=0?all[i+1]||null:null}
export function mergeBestResult(previous={},result={}){return {...previous,...result,bestPoints:Math.max(previous.bestPoints||previous.points||0,result.points||0),bestStars:Math.max(previous.bestStars||previous.stars||0,result.stars||0),bestPercent:Math.max(previous.bestPercent||previous.percent||0,result.percent||0)}}
export function validateCurriculum(curriculum){
  const all=flattenLessons(curriculum),ids=new Set(),errors=[];
  for(const lesson of all){if(ids.has(lesson.id))errors.push(`Tekrarlanan ders ID: ${lesson.id}`);ids.add(lesson.id)}
  for(const lesson of all)for(const pre of lesson.prerequisites||[])if(!ids.has(pre))errors.push(`Eksik ön koşul: ${lesson.id} → ${pre}`);
  return errors;
}
