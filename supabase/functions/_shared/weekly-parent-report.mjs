const ISTANBUL_OFFSET_MS=3*60*60*1000;
const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);

export function previousIstanbulWeek(now=new Date()){
  const local=new Date(now.getTime()+ISTANBUL_OFFSET_MS),day=local.getUTCDay()||7;
  const currentMonday=Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate()-day+1)-ISTANBUL_OFFSET_MS;
  return {start:new Date(currentMonday-7*86400000).toISOString(),end:new Date(currentMonday).toISOString()};
}

export function summarizeWeeklyEvents(events=[]){
  const rows=events.filter(row=>row&&row.occurred_at),activeDays=new Set(),topics=new Map();
  let started=0,completed=0,questions=0,correct=0,words=0,games=0,stories=0,score=0;
  for(const row of rows){
    activeDays.add(new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Istanbul"}).format(new Date(row.occurred_at)));
    if(row.event_type==="lesson_started")started++;
    if(row.event_type==="lesson_completed")completed++;
    if(row.event_type==="question_answered"){
      questions++;if(row.is_correct===true)correct++;
      if(row.topic_key){const item=topics.get(row.topic_key)||{topic_key:row.topic_key,answers:0,correct:0};item.answers++;if(row.is_correct===true)item.correct++;topics.set(row.topic_key,item);}
    }
    if(row.event_type==="word_practiced")words++;
    if(row.event_type==="game_completed")games++;
    if(row.event_type==="story_completed")stories++;
    score+=Number(row.score_delta)||0;
  }
  const ranked=[...topics.values()].map(x=>({...x,accuracy_percent:Math.round(x.correct*100/x.answers)}));
  const difficult=ranked.filter(x=>x.answers>=3&&x.accuracy_percent<70).sort((a,b)=>a.accuracy_percent-b.accuracy_percent||a.topic_key.localeCompare(b.topic_key)).slice(0,3);
  const strengths=ranked.filter(x=>x.answers>=3&&x.accuracy_percent>=80).sort((a,b)=>b.accuracy_percent-a.accuracy_percent||a.topic_key.localeCompare(b.topic_key)).slice(0,3);
  const recommendations=[];
  if(difficult.length)recommendations.push(`${difficult[0].topic_key} konusu için kısa bir tekrar faydalı olabilir.`);
  if(words===0)recommendations.push("Kısa bir kelime tekrarı önerilir.");
  if(completed>0&&questions===0)recommendations.push("Tamamlanan derslerin mini quizleriyle pratik yapılabilir.");
  if(activeDays.size>=3)recommendations.push("Düzenli çalışma alışkanlığını aynı tempoda sürdürün.");
  return {active_days:activeDays.size,lessons_started:started,lessons_completed:completed,questions_answered:questions,correct_answers:correct,wrong_answers:questions-correct,accuracy_percent:questions?Math.round(correct*100/questions):null,words_practiced:words,games_completed:games,stories_completed:stories,score_earned:score,duration_seconds:null,difficult_topics:difficult,strengths,practice_recommendations:[...new Set(recommendations)].slice(0,3),has_data:rows.length>0};
}

export function buildParentDigest(reports=[],parentUserId){
  return reports.filter(row=>row.parent_user_id===parentUserId).sort((a,b)=>String(a.child_name).localeCompare(String(b.child_name),"tr"));
}

export function renderWeeklyParentReport(delivery){
  const reports=Array.isArray(delivery?.reports)?delivery.reports:[];
  const formatDate=value=>new Intl.DateTimeFormat("tr-TR",{timeZone:"Europe/Istanbul",dateStyle:"long"}).format(new Date(value));
  const week=`${formatDate(delivery.period_start)} – ${formatDate(new Date(new Date(delivery.period_end).getTime()-1))}`;
  const childText=reports.map(report=>{const m=report.metrics||{},accuracy=m.accuracy_percent==null?"Bu hafta henüz ölçülebilir soru etkinliği bulunmuyor.":`Soru doğruluğu: %${m.accuracy_percent}`;return [`${report.child_name}`,`Aktif gün: ${m.active_days||0}`,`Tamamlanan ders: ${m.lessons_completed||0}`,accuracy,...(report.practice_recommendations||[])].join("\n");}).join("\n\n");
  const text=["Haftalık gelişim raporu",week,"Çocuğunuzun doğrulanmış öğrenme etkinliklerinden hazırlanan özet aşağıdadır.",childText,"Veli paneli: https://academy.pomante.com.tr/#/parent/reports","E-posta tercihleri: https://academy.pomante.com.tr/#/parent/reports"].join("\n\n");
  const cards=reports.map(report=>{const m=report.metrics||{},accuracy=m.accuracy_percent==null?"Bu hafta henüz ölçülebilir soru etkinliği bulunmuyor.":`Soru doğruluğu: %${m.accuracy_percent}`;return `<section style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:14px 0"><h2>${escapeHtml(report.child_name)}</h2><p>Aktif gün: ${Number(m.active_days)||0} · Tamamlanan ders: ${Number(m.lessons_completed)||0}</p><p>${escapeHtml(accuracy)}</p><ul>${(report.practice_recommendations||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></section>`}).join("");
  const html=`<!doctype html><html lang="tr"><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;color:#172033"><main style="max-width:640px;margin:auto;padding:20px"><h1>Haftalık gelişim raporu</h1><p>${escapeHtml(week)}</p><p>Çocuğunuzun doğrulanmış öğrenme etkinliklerinden hazırlanan özet aşağıdadır.</p>${cards}<p><a href="https://academy.pomante.com.tr/#/parent/reports">Veli panelini aç</a> · <a href="https://academy.pomante.com.tr/#/parent/reports">E-posta tercihlerini yönet</a></p></main></body></html>`;
  return {subject:"Poma Academy | Haftalık gelişim raporu",text,html};
}
