import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const readJson=f=>JSON.parse(fs.readFileSync(path.join(root,f),"utf8"));
const writeJson=(f,d)=>fs.writeFileSync(path.join(root,f),JSON.stringify(d,null,2)+"\n","utf8");

const modules=[
  {id:"module-4",title:"Şu An",description:"Present Continuous ve zaman seçimi",source:"modul4_english_academy_REVIZE_FINAL.md",review:"data/module4-review.json",lessons:[
    ["22","022-present-continuous-affirmative","Present Continuous Affirmative"],
    ["23","023-present-continuous-negative","Present Continuous Negative"],
    ["24","024-present-continuous-questions","Present Continuous Questions"],
    ["25","025-ing-spelling-rules","-ing Spelling Rules"],
    ["26","026-present-simple-vs-present-continuous","Present Simple vs Present Continuous"],
    ["27","027-describing-a-picture","Describing a Picture"]
  ]},
  {id:"module-5",title:"Yiyecek ve Alışveriş",description:"Miktar ifadeleri, fiyatlar, alışveriş ve restoran dili",source:"modul5_english_academy_REVIZE_FINAL.md",review:"data/module5-review.json",lessons:[
    ["28","028-countable-uncountable","Countable / Uncountable"],
    ["29","029-a-an-some","a / an / some"],
    ["30","030-some-any","some / any"],
    ["31","031-much-many","much / many"],
    ["32","032-a-few-a-little","a few / a little"],
    ["33","033-prices-shopping","Prices and Shopping"],
    ["34","034-at-a-restaurant","At a Restaurant"]
  ]},
  {id:"module-6",title:"Yetenek, Tavsiye ve Kurallar",description:"Can, could, should, must ve have to",source:"modul6_english_academy_REVIZE_FINAL.md",review:"data/module6-review.json",lessons:[
    ["35","035-can-cant","can / can't"],
    ["36","036-could","could"],
    ["37","037-should-shouldnt","should / shouldn't"],
    ["38","038-must-mustnt","must / mustn't"],
    ["39","039-have-to","have to"],
    ["40","040-school-health-rules","School and Health Rules"]
  ]},
  {id:"module-7",title:"Geçmiş",description:"Past Simple ve Past Continuous",source:"modul7_english_academy_REVIZE_FINAL.md",review:"data/module7-review.json",lessons:[
    ["41","041-was-were","was / were"],
    ["42","042-past-simple-regular","Past Simple Regular"],
    ["43","043-past-simple-irregular","Past Simple Irregular"],
    ["44","044-did-didnt","did / didn't"],
    ["45","045-past-simple-questions","Past Simple Questions"],
    ["46","046-telling-a-past-story","Telling a Past Story"],
    ["47","047-past-continuous","Past Continuous"]
  ]},
  {id:"module-8",title:"Karşılaştırma",description:"Comparative ve Superlative yapılar",source:"modul8_english_academy_REVIZE_FINAL.md",review:"data/module8-review.json",lessons:[
    ["48","048-comparative-adjectives","Comparative Adjectives"],
    ["49","049-superlative-adjectives","Superlative Adjectives"],
    ["50","050-comparing-people-animals-cities","Comparing People, Animals and Cities"]
  ]},
  {id:"module-9",title:"Gelecek",description:"Going to, will ve gelecek planları",source:"modul9_english_academy_REVIZE_FINAL.md",review:"data/module9-review.json",lessons:[
    ["51","051-be-going-to","be going to"],
    ["52","052-will-wont","will / won't"],
    ["53","053-going-to-vs-will","going to vs will"],
    ["54","054-holiday-plans","Holiday Plans"],
    ["55","055-future-predictions","Future Predictions"]
  ]},
  {id:"module-10",title:"A2 Devam",description:"Present Perfect, used to, conditional ve genel final",source:"modul10_english_academy_REVIZE_FINAL.md",review:"data/module10-review.json",lessons:[
    ["56","056-present-perfect-introduction","Present Perfect Introduction"],
    ["57","057-ever-never","ever / never"],
    ["58","058-already-yet","already / yet"],
    ["59","059-for-since","for / since"],
    ["60","060-used-to","used to"],
    ["61","061-gerund-infinitive-introduction","Gerund / Infinitive Introduction"],
    ["62","062-first-conditional","First Conditional"],
    ["63","063-basic-phrasal-verbs","Basic Phrasal Verbs"],
    ["64","064-general-review","General Review"],
    ["65","065-final-exam","Final Exam"]
  ]}
];

const prerequisiteStart={
  "module-4":"021-imperatives",
  "module-5":"027-describing-a-picture",
  "module-6":"034-at-a-restaurant",
  "module-7":"040-school-health-rules",
  "module-8":"047-past-continuous",
  "module-9":"050-comparing-people-animals-cities",
  "module-10":"055-future-predictions"
};

function repairMojibake(text){
  let current=text;
  for(let pass=0;pass<4;pass++){
    const next=current.replace(/[\u00C2-\u00F4][\u0080-\u00BF]+/g,chunk=>{
      const decoded=Buffer.from(Array.from(chunk,ch=>ch.charCodeAt(0))).toString("utf8");
      return decoded.includes("\uFFFD")?chunk:decoded;
    });
    if(next===current)break;
    current=next;
  }
  return current
    .replace(/\b(hit|hits)\s+the volleyball\b/gi,(_,v)=>`${v} the ball`)
    .replace(/\bShe doesn't play guitar\b/g,"She doesn't play the guitar")
    .replace(/\bHe practises music in his room\b/g,"He practises the guitar in his room");
}

const strip=s=>String(s??"")
  .replace(/\r/g,"")
  .replace(/[“”]/g,'"')
  .replace(/[‘’]/g,"'")
  .replace(/\*\*/g,"")
  .replace(/`/g,"")
  .trim();
const clean=s=>strip(s).replace(/\s+/g," ").trim();
const section=(lesson,no)=>{
  const re=new RegExp(`^##\\s+${no}\\.\\s+[^\\n]+\\n([\\s\\S]*?)(?=^##\\s+${no+1}\\.\\s+|^#\\s+DERS\\s+|^---\\s*$|(?![\\s\\S]))`,"m");
  return lesson.match(re)?.[1]?.trim()||"";
};
const splitLessons=text=>[...text.matchAll(/^#\s+DERS\s+(\d+)\s+[—-]\s+(.+)$/gm)]
  .map((m,i,arr)=>({no:m[1],sourceTitle:clean(m[2]),text:text.slice(m.index,arr[i+1]?.index??text.length)}));
const numbered=t=>[...t.matchAll(/^\d+\.\s+(.+)$/gm)].map(m=>clean(m[1])).filter(x=>!/^[-A-D]\)/.test(x));
const bullets=t=>[...t.matchAll(/^[-*]\s+(.+)$/gm)].map(m=>clean(m[1]));
const answerBlock=t=>t.match(/Cevaplar:\s*([\s\S]*)$/i)?.[1]?.trim()||"";

function parseAnswers(t){
  const block=answerBlock(t);
  const out=new Map();
  for(const m of block.matchAll(/(\d+)\s*[-.]?\s*([A-D])(?:\s*[—–-]\s*([^,\n]+))?/g))out.set(Number(m[1]),{letter:m[2],explanation:clean(m[3]||"")});
  for(const m of block.matchAll(/^(\d+)\.\s+(.+)$/gm))if(!out.has(Number(m[1])))out.set(Number(m[1]),{text:clean(m[2])});
  return out;
}

function parseMC(t){
  const answers=parseAnswers(t);
  const out=[];
  for(const m of t.matchAll(/(?:^|\n)(\d+)\.\s+([^\n]+)\n((?:\s+-\s+[A-D]\)\s+[^\n]+\n?)+)/g)){
    const number=Number(m[1]);
    const options=[...m[3].matchAll(/-\s+([A-D])\)\s+([^\n]+)/g)].map(x=>clean(x[2]));
    if(options.length<2)continue;
    const a=answers.get(number)||{letter:"A"};
    const correctIndex=Math.max(0,"ABCD".indexOf(a.letter||"A"));
    const correct=options[correctIndex];
    const explanation=a.explanation||`${correct} seçeneği cümledeki hedef kurala uyar.`;
    out.push({
      prompt:clean(m[2]).length<=4?`Doğru biçimi seç: ${clean(m[2])}`:clean(m[2]),
      options,
      correctIndex,
      explanation,
      optionExplanationsTr:options.map((o,i)=>i===correctIndex
        ?`Doğru. ${explanation}`
        :`"${o}" seçeneği bu cümledeki özne, zaman veya anlam ipucuyla uyuşmuyor; doğru cevap "${correct}" çünkü ${explanation}`)
    });
  }
  return out;
}

function parseFill(t){
  const body=t.split(/Cevaplar:/i)[0];
  const answers=parseAnswers(t);
  return numbered(body).map((prompt,i)=>{
    const answer=answers.get(i+1)?.text||"";
    return {prompt,answer,exp:`"${answer}" boşluğu cümlenin hedef kuralına göre tamamlar.`};
  }).filter(x=>x.answer);
}

function splitSentence(sentence){return clean(sentence).replace(/[.!?]$/,"").split(/\s+/).filter(Boolean)}
function orderAnswerFromTokens(sentence,tokens){
  const plain=clean(sentence).replace(/[.!?]$/,"");
  const lowered=plain.toLowerCase();
  const positions=tokens.map((tok,idx)=>({tok,idx,pos:lowered.indexOf(tok.toLowerCase())}));
  if(positions.every(x=>x.pos>=0))return positions.sort((a,b)=>a.pos-b.pos).map(x=>x.tok);
  return splitSentence(plain);
}
function parseOrder(t){
  const prompts=[...t.matchAll(/^\d+\.\s+\[([^\]]+)\]/gm)].map(m=>m[1].split("/").map(clean));
  const answers=[...answerBlock(t).matchAll(/^(\d+)\.\s+(.+)$/gm)].map(m=>clean(m[2]));
  const tokens=prompts[0]||["I","am","learning"];
  const answer=orderAnswerFromTokens(answers[0]||tokens.join(" "),tokens);
  return {tokens:answer.length===tokens.length?tokens:answer,answer:answer.length===tokens.length?answer:answer};
}

function parseError(t){
  const sentence=clean((t.match(/^\d+\.\s+`([^`]+)`/m)||t.match(/^\d+\.\s+(.+)$/m))?.[1]||"She can plays volleyball.");
  const ans=answerBlock(t).match(/^1\.\s+`?([^`\n]+)`?\s*(?:→|->|â†’)\s*`?([^`\n]+)`?/m);
  const wrong=clean(ans?.[1]||sentence.split(/\s+/)[1]).replace(/[.!?]/g,"");
  const words=sentence.split(/\s+/);
  const wrongIndex=Math.max(0,words.findIndex(w=>w.replace(/[.,!?]/g,"").toLowerCase()===wrong.toLowerCase()));
  const replacement=clean(ans?.[2]||"doğru cevap");
  return {sentence:words,wrongIndex,explanation:`"${wrong}" burada hatalıdır; doğru cevap "${replacement}" olmalıdır.`};
}

function parseMatching(t){
  const before=t.split(/Cevaplar:|Örnek doğru eşleştirme:/i)[0];
  const left=[...before.matchAll(/^(\d+)\.\s+(.+)$/gm)].map(m=>clean(m[2]));
  const opts=Object.fromEntries([...before.matchAll(/^([A-D])\)\s+(.+)$/gm)].map(m=>[m[1],clean(m[2])]));
  const block=t.match(/(?:Cevaplar:|Örnek doğru eşleştirme:)\s*([\s\S]*)$/i)?.[1]||"";
  const pairs=[];
  for(const m of block.matchAll(/(\d+)\s*[-–—]\s*([A-D])/g)){
    const l=left[Number(m[1])-1],r=opts[m[2]];
    if(l&&r)pairs.push([l,r]);
  }
  return pairs.length>=2?pairs:left.slice(0,3).map((l,i)=>[l,Object.values(opts)[i]||""]);
}

function parseTextQuestions(t){
  const text=clean((t.split(/Sorular:/i)[0]||"").replace(/^"|"$/g,""));
  const qBlock=t.match(/Sorular:\s*([\s\S]*?)(?=Cevaplar:|$)/i)?.[1]||"";
  const questions=numbered(qBlock).slice(0,5);
  const answers=[...answerBlock(t).matchAll(/^(\d+)\.\s+(.+)$/gm)].map(m=>clean(m[2])).slice(0,5);
  return {text,questions,answers};
}

function readingQuestions(data){
  return data.questions.slice(0,3).map((prompt,i)=>{
    const answer=data.answers[i]||"Yes.";
    const wrongA=data.answers[(i+1)%Math.max(1,data.answers.length)]||"A different action";
    const wrongB=data.answers[(i+2)%Math.max(1,data.answers.length)]||"A different person";
    const options=[answer,wrongA,wrongB].map(clean);
    if(new Set(options).size<3)options.splice(1,2,"Another detail from the lesson","A different time or person");
    return {
      prompt,
      options,
      correctIndex:0,
      explanationsTr:[
        `Doğru. Metinde bu sorunun cevabı "${answer}" olarak veriliyor.`,
        `"${options[1]}" başka bir ayrıntıyla karışıyor; bu soruda beklenen cevap "${answer}".`,
        `"${options[2]}" sorudaki kişi, zaman veya eylemle uyuşmuyor; doğru cevap "${answer}".`
      ]
    };
  });
}

function parseVocab(t,lessonId,title){
  const rows=[];
  for(const m of t.matchAll(/^\d+\.\s+\*\*([^*]+)\*\*\s+\|\s+([^|\n]+)(?:\|\s+([^|\n]+))?/gm)){
    const word=clean(m[1]).toLowerCase();
    const meaningTr=clean(m[2]);
    let example=clean(m[3]||`Use "${word}" in this lesson.`);
    if(example==="Choose the correct answer.")example="Choose one answer after reading the question.";
    rows.push({
      id:`${lessonId}-w${rows.length+1}`,
      word,
      meaningTr,
      example,
      sentenceTr:`"${word}" bu dersteki hedef kelime/ifadedir.`,
      lessonId,
      sourceLessonTitle:title,
      audioText:word,
      theme:/volley|team|coach|ball|match|serve|court/i.test(`${word} ${example}`)?"volleyball":/music|song|stage|guitar|concert|singer|audience|microphone/i.test(`${word} ${example}`)?"music":"general"
    });
  }
  return rows.slice(0,8);
}

function vocabHunt(words){
  return words.slice(0,5).map((w,i)=>{
    const options=[w.meaningTr,...words.filter(x=>x.id!==w.id).map(x=>x.meaningTr).slice(0,3)];
    while(options.length<3)options.push(["günlük ifade","ders kelimesi","eylem"][options.length-1]);
    return {wordId:w.id,word:w.word,example:w.example,audioText:w.audioText,prompt:`"${w.word}" kelimesinin Türkçe anlamını seç.`,options,correctIndex:0};
  });
}

function choice(id,title,q){
  return {id,type:"multiple-choice",title,instructionTr:q.prompt,content:{options:q.options,correctIndex:q.correctIndex,optionExplanationsTr:q.optionExplanationsTr},points:10};
}
function game(id,title,qs){
  return {id,type:"mini-game",title,instructionTr:"Beş soruluk seti çöz.",content:{rounds:qs.slice(0,5).map(q=>({
    prompt:q.prompt,
    options:q.options,
    correctIndex:q.correctIndex,
    explanationTr:q.optionExplanationsTr?.[q.correctIndex]||q.explanation,
    wrongExplanationTr:q.optionExplanationsTr?.find((_,i)=>i!==q.correctIndex)||`Bu seçenek hedef kuralla uyuşmuyor; "${q.options[q.correctIndex]}" doğru cevaptır.`
  }))},points:50};
}

function worksheet(title,mc,fill,order,error,reading){
  const questions=[
    ...mc.slice(0,3).map(q=>({type:"choice",prompt:q.prompt,options:q.options,spaceLines:1})),
    ...fill.slice(0,2).map(q=>({type:"fill",prompt:q.prompt,spaceLines:2})),
    {type:"sentence-order",prompt:`Sırala: ${order.tokens.join(" / ")}`,spaceLines:2},
    {type:"error-find",prompt:`Hatayı düzelt: ${error.sentence.join(" ")}`,spaceLines:2},
    {type:"reading",prompt:reading.questions[0]||"Metindeki bilgiyi yaz.",spaceLines:3},
    {type:"writing",prompt:`${title} yapısını kullanarak özgün bir cümle yaz.`,spaceLines:3},
    {type:"rule",prompt:`${title} kuralını Türkçe açıkla.`,spaceLines:3}
  ];
  while(questions.length<10)questions.push({type:"writing",prompt:`${title} ile yeni bir örnek cümle yaz.`,spaceLines:3});
  return {title:`${title} Çalışma Sayfası`,instructionTr:"Soruları kaynak dersteki kurala göre çöz.",questions:questions.slice(0,10),answerKey:questions.slice(0,10).map((q,i)=>{
    if(q.type==="choice")return mc[i]?.options[mc[i]?.correctIndex]||"Ders cevabı";
    if(q.type==="fill")return fill[i-mc.slice(0,3).length]?.answer||"Ders cevabı";
    if(q.type==="sentence-order")return order.answer.join(" ");
    if(q.type==="error-find")return error.explanation;
    if(q.type==="reading")return reading.answers[0]||"Metinden cevaplanır.";
    return "Öğrencinin hedef kurala uygun özgün cevabı kontrol edilir.";
  })};
}

function makeLesson(entry,module,meta){
  const t=entry.text;
  const isFinal=meta[0]==="65";
  const name=clean(section(t,1).split("\n")[0]||meta[2]);
  const objectives=bullets(section(t,2));
  const explanation=section(t,4).split(/\n{2,}/).map(clean).filter(Boolean);
  const examples=numbered(section(t,5)).slice(0,10);
  const tableSource=isFinal?section(t,14):section(t,6);
  const table=tableSource.split(/\n/).filter(l=>/^\|/.test(l)&&!/---/.test(l)).slice(1).map(l=>l.split("|").slice(1,-1).map(clean)).filter(r=>r.length>=2);
  const mistakes=isFinal?bullets(section(t,16)):bullets(section(t,7));
  const mc=isFinal?[...parseMC(section(t,6)),...parseMC(section(t,7))]:parseMC(section(t,8));
  const fill=isFinal?mc.slice(0,2).map(q=>({prompt:q.prompt,answer:q.options[q.correctIndex],exp:`"${q.options[q.correctIndex]}" final sorusundaki doğru cevaptır.`})):parseFill(section(t,9));
  const order=parseOrder(section(t,10));
  const error=parseError(section(t,11));
  const pairs=isFinal?[["Grammar","12 soru"],["Vocabulary","8 soru"],["Reading","5 soru"]]:parseMatching(section(t,12));
  const reading=parseTextQuestions(section(t,isFinal?8:13));
  const listening=parseTextQuestions(section(t,isFinal?9:14));
  const speaking=isFinal?section(t,13).split(/\n/).map(clean).filter(Boolean).join(" "):section(t,15).split(/\n/).map(clean).filter(Boolean).join(" ");
  const practice=isFinal?mc.slice(0,5):parseMC(section(t,16));
  const finalQs=isFinal?mc.slice(5,10):parseMC(section(t,17));
  const parentNote=clean(section(t,18));
  const words=parseVocab(section(t,19),meta[1],meta[2]);
  if(words.length<6)throw new Error(`Vocabulary parse failed for ${meta[1]}`);
  const combined=[...mc,...practice,...finalQs];
  if(combined.length<7)throw new Error(`MC parse failed for ${meta[1]}: ${combined.length}`);
  if(!fill.length)throw new Error(`Fill parse failed for ${meta[1]}`);
  const screens=[
    {id:"s01",type:"intro",title:meta[2],instructionTr:objectives[0]||name,content:{eyebrow:`${module.title} · DERS ${meta[0]}`,heroText:examples[0]||name}},
    {id:"s02",type:"explanation",title:"Türkçe konu anlatımı",instructionTr:explanation[0]||name,content:{examples:explanation.slice(1,6),noteTr:explanation[0]||""}},
    {id:"s03",type:"example",title:"Kaynak örnekleri",instructionTr:"Örnekleri incele.",content:{examples}},
    {id:"s04",type:"rule-table",title:"Kural tablosu",instructionTr:"Kuralı tabloyla gör.",content:{rows:table.length?table:[[name,examples[0]||"Example sentence."]]},explanationTr:objectives.join(" ")},
    {id:"s05",type:"explanation",title:"Sık yapılan hatalar",instructionTr:"Hata örneklerini oku.",content:{examples:mistakes,noteTr:"Yanlışta özne, yardımcı fiil, zaman ipucu ve anlamı birlikte kontrol et."}},
    choice("s06","Çoktan seçmeli 1",mc[0]||combined[0]),
    choice("s07","Çoktan seçmeli 2",mc[1]||combined[1]),
    {id:"s08",type:"fill-blank",title:"Boşluk doldurma",instructionTr:fill[0].prompt,content:{answer:fill[0].answer,accepted:[fill[0].answer],placeholder:"Cevabı yaz",explanationTr:fill[0].exp},hintTr:objectives[0]||"Kuralı düşün.",points:10},
    {id:"s09",type:"sentence-order",title:"Cümle sıralama",instructionTr:"Kelimeleri doğru sıraya koy.",content:{tokens:order.tokens,answer:order.answer,explanationTr:`Doğru sıra: ${order.answer.join(" ")}`},points:10},
    {id:"s10",type:"error-find",title:"Hata bulma",instructionTr:"Hatalı kelimeyi seç.",content:{sentence:error.sentence,wrongIndex:error.wrongIndex,explanationTr:error.explanation},points:10},
    {id:"s11",type:"matching",title:"Eşleştirme",instructionTr:"Uygun parçaları eşleştir.",content:{pairs,explanationTr:"Eşleşen parçalar birlikte doğru ve anlamlı cümle oluşturur."},points:20},
    {id:"s12",type:"reading",title:"Kısa okuma",instructionTr:"Metni oku ve soruları cevapla.",content:{text:reading.text,questions:readingQuestions(reading)},points:30},
    {id:"s13",type:"listening",title:"Dinleme metni",instructionTr:listening.questions[0]||"Dinle ve cevapla.",content:{audioText:listening.text,questions:listening.questions.slice(0,3),answers:listening.answers.slice(0,3),options:[listening.answers[0],listening.answers[1]||"Another detail",listening.answers[2]||"A different action"].map(x=>x||"Another detail"),correctIndex:0,optionExplanationsTr:[`Doğru. Dinleme metnindeki cevap "${listening.answers[0]}".`,`Bu seçenek başka bir sorunun cevabıyla karışıyor; bu soruda "${listening.answers[0]}" gerekir.`,`Bu seçenek kişi, zaman veya eylem ipucuyla uyuşmuyor; doğru cevap "${listening.answers[0]}".`]},points:10},
    {id:"s14",type:"speaking",title:"Konuşma görevi",instructionTr:speaking||"Hedef yapıyla iki kısa cümle söyle.",content:{sentenceStarters:(section(t,15).match(/^- .+$/gm)||["- I ...","- She ...","- We ..."]).map(x=>clean(x.replace(/^-\s*/,""))).slice(0,5),timerSeconds:45,selfChecks:["Hedef yapıyı kullandım.","En az iki cümle söyledim.","Kuralı kontrol ettim.","Cümlelerim anlaşılırdı."]},points:10},
    game("s15","Beş soruluk uygulama oyunu",practice.length?practice:combined.slice(0,5)),
    game("s16","Ders sonu testi",finalQs.length?finalQs:combined.slice(-5)),
    {id:"s17",type:"vocabulary-hunt",title:"Kelime Avı",instructionTr:"Bu dersin hedef kelimeleriyle kısa tekrar oyunu oyna.",content:{rounds:vocabHunt(words)},points:25},
    {id:"s18",type:"summary",title:"Ders özeti",instructionTr:"Ana noktaları kapat.",content:{points:[objectives[0]||name,objectives[1]||"",`Hedef kelimeler: ${words.map(w=>w.word).join(", ")}`].filter(Boolean)}}
  ];
  return {lesson:{id:meta[1],title:meta[2],level:"A2.1",module:module.title,estimatedMinutes:45,objectives:objectives.length?objectives:[name],prerequisites:[],parentGuide:{summaryTr:parentNote||explanation[0]||name,todayGoal:objectives[0]||name,teachingTips:[`Bu derste "${meta[2]}" hedefini kısa örneklerle tekrar edin.`,`Yanlış cevaplarda cümledeki ipucu kelimeyi buldurun.`,`Voleybol, müzik ve günlük hayat örnekleriyle özgün cümle kurdurun.`],questionsToAsk:examples.slice(0,4),listeningScripts:[listening.text],speakingRubric:["10 puan: Dört öz değerlendirme maddesi tamam","5 puan: Destekle iki cümle","0 puan: Örnekleri tekrar dinleyip yeniden deneme"],worksheet:worksheet(meta[2],combined,fill,order,error,reading)},vocabulary:words.map(w=>w.id),screens,assessment:{passScore:60,starThresholds:{one:60,two:75,three:90},completionBonus:20}},words,source:{mc,practice,finalQs,reading,listening,order,error,pairs}};
}

function makeReview(module,lessonPacks){
  const questions=[];
  const seenPrompts=new Map();
  let n=1;
  for(const pack of lessonPacks){
    const tag=pack.lesson.id.replace(/^\d+-/,"");
    const candidates=[...pack.source.practice,...pack.source.finalQs,...pack.source.mc];
    for(const q of candidates.slice(0,4)){
      const count=seenPrompts.get(q.prompt)||0;
      seenPrompts.set(q.prompt,count+1);
      const prompt=count?`${q.prompt} (${pack.lesson.title})`:q.prompt;
      questions.push({id:`${module.id}-review-${String(n++).padStart(2,"0")}`,type:"multiple-choice",topicTag:tag,topicLabel:pack.lesson.title,title:`${pack.lesson.title} tekrar`,instructionTr:prompt,content:{options:q.options,correctIndex:q.correctIndex,optionExplanationsTr:q.optionExplanationsTr},points:4});
      if(questions.length===25)break;
    }
    if(questions.length===25)break;
  }
  let idx=0;
  while(questions.length<25){
    const pack=lessonPacks[idx++%lessonPacks.length];
    const s=pack.lesson.screens.find(x=>x.type==="fill-blank")||pack.lesson.screens.find(x=>x.type==="sentence-order");
    const clone=JSON.parse(JSON.stringify(s));
    const basePrompt=clone.instructionTr||clone.content?.prompt||clone.title;
    const count=seenPrompts.get(basePrompt)||0;
    seenPrompts.set(basePrompt,count+1);
    clone.instructionTr=count?`${basePrompt} (${pack.lesson.title} tekrar ${count+1})`:basePrompt;
    questions.push({...clone,id:`${module.id}-review-${String(n++).padStart(2,"0")}`,topicTag:pack.lesson.id.replace(/^\d+-/,""),topicLabel:pack.lesson.title,points:4});
  }
  return {id:`${module.id}-review`,moduleId:module.id,title:`${module.title} Genel Tekrar`,description:`${module.title} derslerini ölçen gerçek kaynak sorularından oluşturuldu.`,questionCount:25,questions};
}

function makeFinalExamFromSource(finalPack,module10Packs){
  const grammar=[];
  const vocab=[];
  for(const p of module10Packs){
    grammar.push(...p.source.practice,...p.source.finalQs,...p.source.mc);
    vocab.push(...p.words.map(w=>({prompt:`"${w.word}" kelimesinin Türkçe anlamı nedir?`,options:[w.meaningTr,"farklı bir ders kelimesi","yanlış anlam"],correctIndex:0,topicLabel:"Vocabulary",topicTag:"vocabulary",optionExplanationsTr:[`Doğru. "${w.word}" = "${w.meaningTr}".`,`Bu anlam "${w.word}" için kullanılmaz; doğru anlam "${w.meaningTr}".`,`Bu seçenek hedef kelimenin anlamıyla uyuşmaz; doğru anlam "${w.meaningTr}".`]})));
  }
  const rounds=[];
  const addMC=(q,topic)=>rounds.push({prompt:q.prompt,options:q.options,correctIndex:q.correctIndex,topicTag:topic,topicLabel:topic,explanationTr:q.optionExplanationsTr?.[q.correctIndex]||q.explanation,wrongExplanationTr:q.optionExplanationsTr?.find((_,i)=>i!==q.correctIndex)||`Doğru cevap "${q.options[q.correctIndex]}".`});
  grammar.slice(0,12).forEach(q=>addMC(q,"Grammar"));
  vocab.slice(0,8).forEach(q=>addMC(q,"Vocabulary"));
  finalPack.source.reading.questions.slice(0,5).forEach((prompt,i)=>addMC({prompt,options:[finalPack.source.reading.answers[i],finalPack.source.reading.answers[(i+1)%5]||"Another answer",finalPack.source.reading.answers[(i+2)%5]||"Different detail"],correctIndex:0,optionExplanationsTr:[`Doğru. Okuma metnindeki cevap "${finalPack.source.reading.answers[i]}".`,`Bu seçenek başka bir ayrıntıya aittir; doğru cevap "${finalPack.source.reading.answers[i]}".`,`Bu seçenek soru ipucuyla uyuşmaz; doğru cevap "${finalPack.source.reading.answers[i]}".`]},"Reading"));
  finalPack.source.listening.questions.slice(0,5).forEach((prompt,i)=>addMC({prompt,options:[finalPack.source.listening.answers[i],finalPack.source.listening.answers[(i+1)%5]||"Another answer",finalPack.source.listening.answers[(i+2)%5]||"Different detail"],correctIndex:0,optionExplanationsTr:[`Doğru. Dinleme metnindeki cevap "${finalPack.source.listening.answers[i]}".`,`Bu seçenek başka bir ayrıntıyla karışıyor; doğru cevap "${finalPack.source.listening.answers[i]}".`,`Bu seçenek kişi, zaman veya eylemle uyuşmuyor; doğru cevap "${finalPack.source.listening.answers[i]}".`]},"Listening"));
  module10Packs.slice(0,5).forEach(p=>rounds.push({prompt:`Kelimeleri sırala: ${p.source.order.tokens.join(" / ")}`,options:[p.source.order.answer.join(" "),p.source.order.tokens.join(" "),"This order is not complete"],correctIndex:0,topicTag:"sentence-order",topicLabel:"Sentence order",explanationTr:`Doğru sıra: ${p.source.order.answer.join(" ")}`,wrongExplanationTr:"Cümle sırası hedef yapının özne-fiil-nesne düzenine uymalı."}));
  module10Packs.slice(0,5).forEach(p=>rounds.push({prompt:`Hatalı kelimeyi bul: ${p.source.error.sentence.join(" ")}`,options:[p.source.error.sentence[p.source.error.wrongIndex],p.source.error.sentence[0],p.source.error.sentence.at(-1)],correctIndex:0,topicTag:"error-correction",topicLabel:"Error correction",explanationTr:p.source.error.explanation,wrongExplanationTr:`Asıl hata "${p.source.error.sentence[p.source.error.wrongIndex]}" kelimesindedir.`}));
  grammar.slice(12).forEach(q=>{if(rounds.length<40)addMC(q,"Grammar");});
  return rounds.slice(0,40);
}

const lessonPacksByModule=new Map();
const allWords=[];
for(const module of modules){
  const srcPath=path.join(root,module.source);
  let source=repairMojibake(fs.readFileSync(srcPath,"utf8"));
  fs.writeFileSync(srcPath,source,"utf8");
  const entries=splitLessons(source).filter(e=>module.lessons.some(l=>l[0]===e.no));
  const packs=entries.map(e=>makeLesson(e,module,module.lessons.find(l=>l[0]===e.no)));
  lessonPacksByModule.set(module.id,packs);
  for(const pack of packs){
    writeJson(`data/lessons/${pack.lesson.id}.json`,pack.lesson);
    allWords.push(...pack.words);
  }
  writeJson(module.review,makeReview(module,packs));
}

const curriculum=readJson("data/curriculum.json");
for(const module of modules){
  let m=curriculum.modules.find(x=>x.id===module.id);
  if(!m){m={id:module.id,title:module.title,description:module.description,lessons:[]};curriculum.modules.push(m);}
  m.title=module.title;m.description=module.description;
  m.lessons=module.lessons.map((l,i)=>({id:l[1],order:Number(l[0]),title:l[2],file:`data/lessons/${l[1]}.json`,status:"published",prerequisites:[i===0?prerequisiteStart[module.id]:module.lessons[i-1][1]]}));
}
writeJson("data/curriculum.json",curriculum);

const vocab=readJson("data/vocabulary.json");
const repairedIds=new Set(allWords.map(w=>w.lessonId));
vocab.items=[...(vocab.items||[]).filter(w=>!repairedIds.has(w.lessonId)),...allWords];
vocab.version=11;
writeJson("data/vocabulary.json",vocab);

const config=readJson("data/app-config.json");
config.version="FINAL-A2-REPAIRED";
config.moduleReviews={...(config.moduleReviews||{})};
for(const module of modules)config.moduleReviews[module.id]=module.review;
writeJson("data/app-config.json",config);

const module10=lessonPacksByModule.get("module-10");
const finalPack=module10.find(p=>p.lesson.id==="065-final-exam");
const finalLesson=readJson("data/lessons/065-final-exam.json");
finalLesson.screens=finalLesson.screens.filter(s=>s.id!=="s14b");
finalLesson.screens.splice(14,0,{id:"s14b",type:"mini-game",title:"Final sınavı",instructionTr:"Bütün yılın gerçek final sorularını çöz.",content:{rounds:makeFinalExamFromSource(finalPack,module10).map((r,i)=>({id:`final-${String(i+1).padStart(2,"0")}`,...r}))},points:100});
finalLesson.screens.splice(15,0,{id:"s14c",type:"speaking",title:"Final kısa yazma görevleri",instructionTr:"Üç kısa yazma görevinden en az birini tamamla; veli rubriğe göre kontrol edebilir.",content:{sentenceStarters:["Geçen hafta yaptığın bir etkinliği 5–7 cümleyle yaz.","Gelecek hafta planını 5–7 cümleyle yaz.","Yaptığın ve hiç yapmadığın deneyimleri 5–7 cümleyle yaz."],timerSeconds:90,selfChecks:["Zaman seçimini kontrol ettim.","En az beş cümle yazdım.","Kelime ve noktalama kontrolü yaptım.","Cümlelerim anlaşılır."]},points:10});
finalLesson.screens.splice(16,0,{id:"s14d",type:"speaking",title:"Final konuşma görevleri",instructionTr:"İki konuşma görevini sırayla yap: kendini ve rutinini anlat; sonra dün yaptığın ve yakında yapacağın şeyleri söyle.",content:{sentenceStarters:["I usually ...","Yesterday, I ...","Next week, I am going to ...","I have already ..."],timerSeconds:60,selfChecks:["İki konuşma görevini de yaptım.","En az dört cümle söyledim.","Farklı zamanları doğru seçtim.","Anlaşılır konuştum."]},points:10});
finalLesson.assessment.finalExam={questionCount:45,autoScored:40,rubricTasks:5,topics:["Grammar","Vocabulary","Reading","Listening","Sentence order","Error correction","Writing","Speaking"]};
writeJson("data/lessons/065-final-exam.json",finalLesson);

fs.writeFileSync(path.join(root,"CODEX_FINAL_PROGRESS.md"),`# CODEX FINAL REPAIR PROGRESS\n\n- source_parse: DONE\n- lessons_022_065: DONE\n- vocabulary: DONE\n- module_reviews_4_10: DONE\n- lesson_64_review: DONE\n- lesson_65_final_exam: DONE\n- semantic_tests: PENDING\n- build: PENDING\n- zip_validation: PENDING\n- completed: PENDING\n`,"utf8");

console.log(`Repaired lessons: ${allWords.reduce((s,w)=>s.add(w.lessonId),new Set()).size}`);
console.log(`Vocabulary items: ${allWords.length}`);
