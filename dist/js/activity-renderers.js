import { pointsForAttempt,matchingPoints,roundFeedbackTone } from "./scoring.js";
import { speak } from "./audio.js";

const esc = value => String(value ?? "").replace(/[&<>\"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));
const examples = items => `<div class="grid">${items.map(item => typeof item === "string" ? `<p class="example-sentence">${esc(item)}</p>` : `<p class="example-sentence">${esc(item.sentence).replace(esc(item.focus),`<span class="accent">${esc(item.focus)}</span>`)}</p>`).join("")}</div>`;
const optionList = options => `<div class="options">${options.map((option,index)=>`<button class="option" data-answer="${index}">${esc(option)}</button>`).join("")}</div>`;

export function renderScreen(screen, answer = {}) {
  const c = screen.content || {};
  let body = "";
  if (screen.type === "intro") body = `<p class="eyebrow">${esc(c.eyebrow)}</p><h1>${esc(screen.title)}</h1><p class="lead">${esc(screen.instructionTr)}</p><p class="example-sentence">${esc(c.heroText)}</p>`;
  else if (["explanation","example"].includes(screen.type)) body = `<h1>${esc(screen.title)}</h1><p class="lead">${esc(screen.instructionTr)}</p>${examples(c.examples || [])}${c.noteTr?`<div class="question-context">${esc(c.noteTr)}</div>`:""}`;
  else if (screen.type === "rule-table") body = `<h1>${esc(screen.title)}</h1><p class="lead">${esc(screen.instructionTr)}</p><table class="rule-table"><tbody>${c.rows.map(row=>`<tr><td>${esc(row[0])}</td><td>${esc(row[1])}</td></tr>`).join("")}</tbody></table><div class="question-context">${esc(screen.explanationTr)}</div>`;
  else if (["multiple-choice","listening"].includes(screen.type)) body = renderChoice(screen, answer);
  else if (screen.type === "fill-blank") body = `<h1>${esc(screen.title)}</h1><p class="lead">${esc(screen.instructionTr)}</p><input class="fill-input" id="fill-answer" autocomplete="off" placeholder="${esc(c.placeholder)}" value="${esc(answer.input || "")}"><div class="button-row"><button class="button primary" data-action="check-fill">Kontrol et</button><button class="button secondary" data-action="hint">İpucu</button></div>${feedback(answer)}`;
  else if (screen.type === "sentence-order") body = renderOrder(screen, answer);
  else if (screen.type === "error-find") body = `<h1>${esc(screen.title)}</h1><p class="lead">${esc(screen.instructionTr)}</p><div class="token-bank">${c.sentence.map((word,index)=>`<button class="token" data-wrong="${index}">${esc(word)}</button>`).join("")}</div>${feedback(answer)}`;
  else if (screen.type === "matching") body = renderMatching(screen, answer);
  else if (screen.type === "reading") body = renderReading(screen, answer);
  else if (screen.type === "mini-game") body = renderGame(screen, answer);
  else if (screen.type === "vocabulary-hunt") body = renderVocabHunt(screen, answer);
  else if (screen.type === "speaking") {const checks=c.selfChecks||["En az dört cümle söyledim.","Özne ve fiili doğru sıraya koydum.","Hedef yapıyı kullandım.","Cümlelerimi anlaşılır söyledim."];body = `<h1>${esc(screen.title)}</h1><p class="lead">${esc(screen.instructionTr)}</p><div class="question-context"><ul class="clean-list">${c.sentenceStarters.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div><p><strong>Kalan süre: <span data-speaking-timer>${c.timerSeconds||45} saniye</span></strong></p><fieldset class="self-check"><legend>Öz değerlendirme</legend>${checks.map((x,i)=>`<label><input type="checkbox" data-speaking-check="${i}" ${(answer.checks||[]).includes(i)?"checked":""}> ${esc(x)}</label>`).join("")}</fieldset><div class="button-row"><button class="button primary" data-action="speaking-done" ${(answer.checks||[]).length<checks.length?"disabled":""}>Görevi tamamla</button></div>${feedback(answer)}`;}
  else if (screen.type === "summary") body = `<h1>${esc(screen.title)}</h1><p class="lead">${esc(screen.instructionTr)}</p><ul class="clean-list">${c.points.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`;
  return `<div class="lesson-content">${body}</div>`;
}

function renderChoice(screen, answer) {
  const c = screen.content;
  return `<h1>${esc(screen.title)}</h1><p class="lead">${esc(screen.instructionTr)}</p>${screen.type==="listening"?`<button class="button secondary" data-action="listen">🔊 Metni dinle</button>`:""}${optionList(c.options)}${feedback(answer)}${screen.type==="listening"&&answer.completed?`<details><summary>Transkripti aç</summary><p class="reading-text">${esc(c.audioText)}</p></details>`:""}`;
}

function renderOrder(screen, answer) {
  const picked = answer.picked || [];
  return `<h1>${esc(screen.title)}</h1><p class="lead">${esc(screen.instructionTr)}</p><div class="answer-bank">${picked.map((word,index)=>`<button class="token" data-remove-token="${index}">${esc(word)}</button>`).join("")}</div><div class="token-bank">${screen.content.tokens.map((word,index)=>`<button class="token ${(answer.used||[]).includes(index)?"used":""}" data-token="${index}" ${(answer.used||[]).includes(index)?"disabled":""}>${esc(word)}</button>`).join("")}</div><div class="button-row"><button class="button primary" data-action="check-order">Kontrol et</button><button class="button secondary" data-action="hint">İpucu</button></div>${feedback(answer)}`;
}

function renderMatching(screen, answer) {
  const matched = answer.matched || [];
  const left = screen.content.pairs.map(p=>p[0]);
  const right = [...screen.content.pairs.map(p=>p[1])].reverse();
  return `<h1>${esc(screen.title)}</h1><p class="lead">${esc(screen.instructionTr)}</p><div class="match-grid"><div class="options">${left.map(x=>`<button class="option ${matched.includes(x)?"selected":""}" data-match-left="${esc(x)}" ${matched.includes(x)?"disabled":""}>${esc(x)}</button>`).join("")}</div><div class="options">${right.map(x=>`<button class="option" data-match-right="${esc(x)}">${esc(x)}</button>`).join("")}</div></div>${answer.selectedLeft?`<p>Seçilen fiil: <strong>${esc(answer.selectedLeft)}</strong></p>`:""}${feedback(answer)}`;
}

function renderReading(screen, answer) {
  const index = answer.round || 0;
  const q = screen.content.questions[index];
  if (!q) return `<h1>${esc(screen.title)}</h1><div class="feedback correct">✓ Metindeki ${screen.content.questions.length} soruyu da tamamladın.</div>`;
  return `<h1>${esc(screen.title)}</h1><div class="reading-text">${esc(screen.content.text)}</div><p class="lead"><strong>${index+1}/${screen.content.questions.length}:</strong> ${esc(q.prompt)}</p>${optionList(q.options)}${feedback(answer)}`;
}

function renderGame(screen, answer) {
  const index = answer.round || 0;
  const round = screen.content.rounds[index];
  if (!round) return `<h1>${esc(screen.title)}</h1><div class="feedback correct">✓ Tüm turları tamamladın.</div>`;
  return `<h1>${esc(screen.title)}</h1><p class="lead">Tur ${index+1}/${screen.content.rounds.length}: ${esc(round.prompt)}</p><div class="game-board">${round.options.map((x,i)=>`<button class="game-door" data-game-answer="${i}">${esc(x)}</button>`).join("")}</div>${feedback(answer)}`;
}

function renderVocabHunt(screen, answer) {
  const index = answer.round || 0;
  const round = screen.content.rounds[index];
  if (!round) return `<h1>${esc(screen.title)}</h1><div class="feedback correct">✓ Kelime Avı tamamlandı. Bu kelimeler Kelime Kasası'na eklendi.</div>`;
  return `<h1>${esc(screen.title)}</h1><p class="lead">Tur ${index+1}/${screen.content.rounds.length}: ${esc(round.prompt)}</p>${round.audioText?`<button class="button secondary" data-action="vocab-listen">🔊 Kelimeyi dinle</button>`:""}<div class="game-board">${round.options.map((x,i)=>`<button class="game-door" data-vocab-answer="${i}">${esc(x)}</button>`).join("")}</div>${feedback(answer)}`;
}

function feedback(answer) {
  if (!answer.feedback) return "";
  const positive=answer.feedbackTone==="correct"||answer.correct;
  return `<div class="feedback ${positive?"correct":"incorrect"}">${positive?"✓ ":"✕ Bir daha düşün. "}${esc(answer.feedback)}</div>`;
}

export function bindActivity(container, screen, answer, update, muted=false) {
  const c = screen.content || {};
  container.querySelector("[data-action='listen']")?.addEventListener("click",()=>speak(c.audioText,muted));
  container.querySelectorAll("[data-answer]").forEach(button=>button.addEventListener("click",()=>{
    if (answer.completed) return;
    const index = Number(button.dataset.answer);
    const isReading = screen.type === "reading";
    const round = isReading ? (answer.round||0) : 0;
    const source = isReading ? c.questions[round] : c;
    answer.attempts = (answer.attempts||0)+1;
    answer.feedback = source.explanationsTr?.[index] || source.optionExplanationsTr?.[index] || screen.explanationTr || "Cevabını kuralı düşünerek yeniden değerlendir.";
    answer.correct = index === source.correctIndex;
    if (answer.correct) {
      answer.points = (answer.points||0)+pointsForAttempt(answer.attempts,answer.usedHint);
      answer.attempts=0;
      if (isReading && round < c.questions.length-1) { answer.round=round+1; answer.correct=false; answer.feedbackTone=roundFeedbackTone(true); answer.feedback=`${round+1}. soru tamam. Sıradaki soruya geç.`; }
      else answer.completed=true;
    } else {answer.feedbackTone="incorrect";answer.wrongCount=(answer.wrongCount||0)+1;if(c.secondTryHintTr&&answer.attempts===1)answer.feedback=`İpucu: ${c.secondTryHintTr} Bir kez daha dene.`;}
    update();
  }));
  container.querySelector("[data-action='check-fill']")?.addEventListener("click",()=>{
    const input = container.querySelector("#fill-answer").value.trim().toLowerCase(); answer.input=input; answer.attempts=(answer.attempts||0)+1;
    answer.correct=(c.accepted||[c.answer]).map(x=>x.toLowerCase()).includes(input);
    answer.feedback=answer.correct?c.explanationTr:`“${input||"boş"}” uygun değil. Özneyi ve hedef kuralı yeniden kontrol et.`;if(!answer.correct)answer.wrongCount=(answer.wrongCount||0)+1;
    if(answer.correct){answer.completed=true;answer.points=pointsForAttempt(answer.attempts,answer.usedHint)} update();
  });
  container.querySelector("[data-action='hint']")?.addEventListener("click",()=>{answer.usedHint=true;answer.feedback=screen.hintTr;answer.correct=false;update();});
  container.querySelectorAll("[data-token]").forEach(button=>button.addEventListener("click",()=>{const i=Number(button.dataset.token);answer.picked=[...(answer.picked||[]),c.tokens[i]];answer.used=[...(answer.used||[]),i];update();}));
  container.querySelectorAll("[data-remove-token]").forEach(button=>button.addEventListener("click",()=>{const i=Number(button.dataset.removeToken);const word=answer.picked[i];const sourceIndex=c.tokens.findIndex((x,j)=>x===word && !(answer.used||[]).filter(k=>k!==undefined).slice(0,i).includes(j));answer.picked.splice(i,1);answer.used.splice(i,1);update();}));
  container.querySelector("[data-action='check-order']")?.addEventListener("click",()=>{answer.attempts=(answer.attempts||0)+1;answer.correct=JSON.stringify(answer.picked||[])===JSON.stringify(c.answer);answer.feedback=answer.correct?c.explanationTr:"Kelime sırasını hedef yapının kuralına göre yeniden kontrol et.";if(!answer.correct)answer.wrongCount=(answer.wrongCount||0)+1;if(answer.correct){answer.completed=true;answer.points=pointsForAttempt(answer.attempts,answer.usedHint)}update();});
  container.querySelectorAll("[data-wrong]").forEach(button=>button.addEventListener("click",()=>{const i=Number(button.dataset.wrong);answer.attempts=(answer.attempts||0)+1;answer.correct=i===c.wrongIndex;answer.feedback=answer.correct?c.explanationTr:`“${c.sentence[i]}” doğru kullanılmış. Özne, yardımcı fiil veya gösterme sözcüğündeki asıl hatayı ara.`;if(!answer.correct)answer.wrongCount=(answer.wrongCount||0)+1;if(answer.correct){answer.completed=true;answer.points=pointsForAttempt(answer.attempts)}update();}));
  container.querySelectorAll("[data-match-left]").forEach(button=>button.addEventListener("click",()=>{answer.selectedLeft=button.dataset.matchLeft;update();}));
  container.querySelectorAll("[data-match-right]").forEach(button=>button.addEventListener("click",()=>{if(!answer.selectedLeft){answer.feedback="Önce soldan bir öğe seç.";answer.correct=false;answer.feedbackTone="incorrect";return update();}const pair=c.pairs.find(p=>p[0]===answer.selectedLeft);answer.attempts=(answer.attempts||0)+1;if(pair[1]===button.dataset.matchRight){answer.matched=[...(answer.matched||[]),answer.selectedLeft];answer.feedback=`Doğru: ${pair[0]} → ${pair[1]}`;answer.correct=true;answer.feedbackTone="correct";answer.selectedLeft=null;if(answer.matched.length===c.pairs.length){answer.completed=true;answer.points=matchingPoints(screen.points||20,answer.wrongAttempts||0)}}else{answer.wrongAttempts=(answer.wrongAttempts||0)+1;answer.feedback=`${answer.selectedLeft} bu öğeyle eşleşmiyor. İpucunu yeniden düşün.`;answer.correct=false;answer.feedbackTone="incorrect"}update();}));
  container.querySelectorAll("[data-game-answer]").forEach(button=>button.addEventListener("click",()=>{const roundIndex=answer.round||0;const round=c.rounds[roundIndex];answer.attempts=(answer.attempts||0)+1;answer.correct=Number(button.dataset.gameAnswer)===round.correctIndex;answer.feedbackTone=answer.correct?"correct":"incorrect";answer.feedback=answer.correct?round.explanationTr:(round.wrongExplanationTr||`Bu seçenek hedef kuralla uyuşmuyor. ${round.explanationTr}`);if(answer.correct){answer.points=(answer.points||0)+pointsForAttempt(answer.attempts);answer.attempts=0;if(roundIndex<c.rounds.length-1){answer.round=roundIndex+1;answer.correct=false}else answer.completed=true}update();}));
  container.querySelector("[data-action='vocab-listen']")?.addEventListener("click",()=>speak(c.rounds?.[answer.round||0]?.audioText,muted));
  container.querySelectorAll("[data-vocab-answer]").forEach(button=>button.addEventListener("click",()=>{const roundIndex=answer.round||0;const round=c.rounds[roundIndex];answer.attempts=(answer.attempts||0)+1;answer.vocabResults=answer.vocabResults||{};answer.correct=Number(button.dataset.vocabAnswer)===round.correctIndex;answer.feedbackTone=answer.correct?"correct":"incorrect";if(answer.correct){answer.vocabResults[round.wordId]=true;answer.feedback=`Doğru. “${round.word}” kelimesini anlamıyla bağladın.`;answer.points=(answer.points||0)+5;answer.attempts=0;if(roundIndex<c.rounds.length-1){answer.round=roundIndex+1;answer.correct=false}else answer.completed=true}else{answer.vocabResults[round.wordId]=false;answer.feedback=`İpucu: “${round.word}” örnek cümlede şöyle geçiyor: ${round.example||""}`;answer.wrongCount=(answer.wrongCount||0)+1}update();}));
  container.querySelectorAll("[data-speaking-check]").forEach(box=>box.addEventListener("change",()=>{answer.checks=answer.checks||[];const i=Number(box.dataset.speakingCheck);if(box.checked&&!answer.checks.includes(i))answer.checks.push(i);if(!box.checked)answer.checks=answer.checks.filter(x=>x!==i);update();}));
  container.querySelector("[data-action='speaking-done']")?.addEventListener("click",()=>{const needed=(c.selfChecks||[]).length||4;if((answer.checks||[]).length<needed)return;answer.completed=true;answer.correct=true;answer.feedbackTone="correct";answer.points=10;answer.feedback="Öz değerlendirme tamamlandı. Cümlelerini bir veliyle tekrar ederek pekiştirebilirsin.";update();});
  if(screen.type==="speaking"&&c.timerSeconds&&!answer.completed){answer.timerStartedAt=answer.timerStartedAt||Date.now();const timer=container.querySelector("[data-speaking-timer]");const tick=()=>{if(!timer?.isConnected)return;const left=Math.max(0,c.timerSeconds-Math.floor((Date.now()-answer.timerStartedAt)/1000));timer.textContent=`${left} saniye`;if(left>0)setTimeout(tick,1000)};tick()}
}

export function isInteractive(type){return ["multiple-choice","fill-blank","sentence-order","matching","error-find","listening","speaking","reading","mini-game","vocabulary-hunt"].includes(type)}
