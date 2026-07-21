const lessonNo=word=>Number(String(word?.lessonId||"").match(/\d+/)?.[0]||0);
const shufflePick=(pool,count,used,rng)=>{const picked=[];let rows=pool.filter(row=>!used.has(row.id));while(picked.length<count&&rows.length){const index=Math.floor(rng()*rows.length)%rows.length,item=rows.splice(index,1)[0];used.add(item.id);picked.push(item);}return picked;};

export function sportWordEligibility(word,state={},progress={},now=Date.now()){
  const league=progress.words?.[word.id]||{},academy=state.vocabularyProgress?.[word.id]||{},mastered=league.mastered===true||academy.status==="mastered",reviewAt=Date.parse(league.nextReviewAt||academy.nextReviewAt||""),due=Number.isFinite(reviewAt)&&reviewAt<=now,needsReview=Number(league.wrong||academy.wrong||0)>0||academy.status==="difficult";
  return {normal:!mastered,review:mastered?due:needsReview};
}

export function completedLessonBoundary(state={}){
  try{const opened=Object.entries(state?.lessonProgress||{}).filter(([,row])=>row?.completed||row?.startedAt||Number(row?.currentScreen)>0).map(([id])=>Number(String(id).match(/\d+/)?.[0]||0));return opened.length?Math.max(...opened):null;}catch{return null;}
}

export function selectAdaptiveSportWords(words,state={},progress={},rng=Math.random,maxQuestions=10){
  const all=(Array.isArray(words)?words:[]).filter(word=>word?.id),boundary=completedLessonBoundary(state),starter=boundary==null,currentLesson=starter?1:boundary,nextLesson=currentLesson+1,allowed=all.filter(word=>lessonNo(word)<=nextLesson);
  const recent=new Set((progress.recentQuestionIds||[]).slice(-5)),used=new Set(),available=allowed.filter(word=>!recent.has(word.id)),source=available.length?available:allowed;
  const normal=word=>sportWordEligibility(word,state,progress).normal,reviewable=word=>sportWordEligibility(word,state,progress).review,current=source.filter(word=>lessonNo(word)===currentLesson&&normal(word)),previous=source.filter(word=>lessonNo(word)<currentLesson&&normal(word)),preview=source.filter(word=>lessonNo(word)===nextLesson&&normal(word));
  const review=source.filter(word=>lessonNo(word)<=currentLesson&&reviewable(word)).slice(0,2),ordinaryPrevious=previous.filter(word=>!review.includes(word));
  const selected=[...shufflePick(current,6,used,rng),...shufflePick(review,2,used,rng),...shufflePick(ordinaryPrevious,3-review.length,used,rng),...shufflePick(preview,1,used,rng)];
  const safe=source.filter(normal),starterFallback=starter?all.filter(word=>!recent.has(word.id)&&normal(word)).sort((a,b)=>lessonNo(a)-lessonNo(b)):[];
  selected.push(...shufflePick(safe,maxQuestions-selected.length,used,rng));
  if(starter&&selected.length<maxQuestions)selected.push(...shufflePick(starterFallback,maxQuestions-selected.length,used,rng));
  return selected.slice(0,maxQuestions);
}

export {lessonNo as sportLessonNumber};
