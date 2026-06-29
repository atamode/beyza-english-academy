import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),"utf8"));
const write=(f,d)=>fs.writeFileSync(path.join(root,f),JSON.stringify(d,null,2)+"\n","utf8");
const textFiles=["js/app.js","js/parent-mode.js","scripts/generate-module1.js","scripts/generate-module2-review.js","scripts/repair-final-content.js"];
const textPairs=[
  ["? Ana ekran","← Ana ekran"],["? Geri","← Geri"],["S?nav? tamamla","Sınavı tamamla"],["Sonraki ?","Sonraki →"],["MOD?L","MODÜL"],["do?ru","doğru"],["? GENEL TEKRAR","· GENEL TEKRAR"],
  ["Bora?","Bora?"],["cinema?","cinema?"],["banana?","banana?"],["Ankara?","Ankara?"],["Antalya?","Antalya?"],["Beyza?","Beyza?"],
  ["Seçili ders, Modül 1 sınavı, kelime takibi ve tekrar havuzu tek yerde.","Seçili ders, modül tekrarı, kelime takibi ve tekrar havuzu tek yerde."],
  ["Seçili ders, Modül 1 sınavı, kelime takibi ve tekrar havuzu tek yerde.","Seçili ders, modül tekrarı, kelime takibi ve tekrar havuzu tek yerde."]
];
let visibleFixes=0;
for(const f of textFiles){
  const p=path.join(root,f);
  if(!fs.existsSync(p))continue;
  let s=fs.readFileSync(p,"utf8"),o=s;
  for(const [a,b] of textPairs){const before=s;s=s.split(a).join(b);if(s!==before)visibleFixes++;}
  if(s!==o)fs.writeFileSync(p,s,"utf8");
}

function rotateToIndex(options,correctIndex,target){
  const opts=[...options].filter(x=>String(x??"").trim());
  const correct=opts[correctIndex]??opts[0];
  const unique=[correct,...opts.filter(x=>x!==correct)];
  while(unique.length<3)unique.push(["another answer","different detail","not this one"][unique.length-1]);
  const clean=[...new Set(unique)].slice(0,4);
  while(clean.length<3)clean.push(`different option ${clean.length}`);
  const len=clean.length;
  const wanted=target%len;
  const out=clean.filter(x=>x!==correct);
  out.splice(wanted,0,correct);
  return {options:out,correctIndex:wanted};
}
function explanations(prompt,options,correctIndex,answer){
  return options.map((o,i)=>i===correctIndex?`Doğru. Bu soruda cevap "${answer}" olmalıdır.`:`"${o}" bu sorudaki kişi, zaman veya anlam ipucuyla uyuşmuyor; doğru cevap "${answer}".`);
}
const curriculum=read("data/curriculum.json");
const rows=curriculum.modules.flatMap(m=>m.lessons||[]).filter(r=>r.status==="published"&&r.order>=22&&r.order<=65);
let listeningFixed=0;
for(const row of rows){
  const lesson=read(row.file);
  for(const s of lesson.screens){
    if(s.type==="reading"){
      s.content.questions=(s.content.questions||[]).map((q,i)=>{
        const currentAnswer=q.options?.[q.correctIndex]||q.options?.[0]||"Yes.";
        const r=rotateToIndex(q.options||[currentAnswer,"another detail","different detail"],q.correctIndex||0,i);
        return {...q,options:r.options,correctIndex:r.correctIndex,explanationsTr:explanations(q.prompt,r.options,r.correctIndex,currentAnswer)};
      });
    }
    if(s.type==="listening"){
      const prompts=(s.content.questions||[]).map(q=>typeof q==="string"?q:q.prompt).filter(Boolean);
      const answers=(s.content.answers||[]).filter(Boolean);
      if(prompts.length>=3&&answers.length>=3){
        s.content.questions=prompts.slice(0,3).map((prompt,i)=>{
          const opts=[answers[i],answers[(i+1)%answers.length],answers[(i+2)%answers.length]];
          const r=rotateToIndex(opts,0,i);
          return {prompt,options:r.options,correctIndex:r.correctIndex,explanationsTr:explanations(prompt,r.options,r.correctIndex,answers[i])};
        });
        delete s.content.answers;
        delete s.content.options;
        delete s.content.correctIndex;
        delete s.content.optionExplanationsTr;
        listeningFixed++;
      }
    }
    if(s.type==="vocabulary-hunt"){
      s.content.rounds=(s.content.rounds||[]).map((r,i)=>{
        const rotated=rotateToIndex(r.options,r.correctIndex,i);
        return {...r,options:rotated.options,correctIndex:rotated.correctIndex};
      });
    }
  }
  write(row.file,lesson);
}

function fixErrorLesson(file,sentence,wrong,explanation){
  const lesson=read(file);
  const screen=lesson.screens.find(s=>s.type==="error-find");
  screen.content.sentence=sentence.split(" ");
  screen.content.wrongIndex=screen.content.sentence.findIndex(w=>w.replace(/[.,!?]/g,"")===wrong);
  screen.content.explanationTr=explanation;
  write(file,lesson);
}
fixErrorLesson("data/lessons/057-ever-never.json","I have ever been there.","ever",'Olumlu anlamda "hiç gitmedim" demek için "have never been" kullanılır; bu cümlede "ever" yerine "never" gerekir.');
fixErrorLesson("data/lessons/058-already-yet.json","I haven\'t finished my homework already.","already",`Olumsuz c?mle sonunda "already" de?il "yet" kullan?l?r. Do?ru c?mle: "I haven\'t finished my homework yet."`);

const vocab=read("data/vocabulary.json").items;
const meanings=[...new Set(vocab.map(w=>w.meaningTr).filter(Boolean))];
function distractorsFor(correct){
  return meanings.filter(m=>m!==correct).slice(0,8);
}
function uniqueOptions(options){
  const out=[];
  for(const o of options.map(x=>String(x??"").replace(/Ankara?/g,"Ankara?").replace(/Antalya?/g,"Antalya?").replace(/Bora?/g,"Bora?").replace(/Beyza?/g,"Beyza?").trim()).filter(Boolean))if(!out.includes(o))out.push(o);
  return out;
}
const finalLesson=read("data/lessons/065-final-exam.json");
const finalScreen=finalLesson.screens.find(s=>s.id==="s14b");
const rounds=finalScreen.content.rounds;
const sections=[...Array(12).fill("Grammar"),...Array(8).fill("Vocabulary"),...Array(5).fill("Reading"),...Array(5).fill("Listening"),...Array(5).fill("Sentence order"),...Array(5).fill("Error correction")];
for(let i=0;i<rounds.length;i++){
  const r=rounds[i];
  r.prompt=String(r.prompt).replace(/Ankara?/g,"Ankara?").replace(/Antalya?/g,"Antalya?").replace(/Bora?/g,"Bora?").replace(/Beyza?/g,"Beyza?");
  let correct=r.options?.[r.correctIndex]??r.options?.[0]??"";
  correct=String(correct).replace(/Ankara?/g,"Ankara?").replace(/Antalya?/g,"Antalya?").replace(/Bora?/g,"Bora?").replace(/Beyza?/g,"Beyza?");
  if(sections[i]==="Vocabulary"){
    const word=(r.prompt.match(/"([^"]+)"/)?.[1]||"").toLowerCase();
    const entry=vocab.find(w=>w.word.toLowerCase()===word);
    if(entry)correct=entry.meaningTr;
    r.options=uniqueOptions([correct,...distractorsFor(correct)]).slice(0,3);
    r.correctIndex=0;
  }else if(sections[i]==="Sentence order"){
    if(r.prompt.includes("Ankara")){
      correct="Have you ever visited Ankara?";
      r.options=["Have you ever visited Ankara?","Have ever you visited Ankara?","You have ever visited Ankara?"];
      r.correctIndex=0;
    }else{
      const wrong1=String(r.options?.[1]||"").replace(/Ankara?/g,"Ankara?");
      r.options=uniqueOptions([correct,wrong1,`${correct.split(" ").slice(1).join(" ")} ${correct.split(" ")[0]}`]).slice(0,3);
      r.correctIndex=r.options.indexOf(correct);
    }
  }else if(sections[i]==="Error correction"&&i===36){
    r.prompt="Hatalı kelimeyi bul: I have ever been there.";
    r.options=["have","ever","there"];
    r.correctIndex=1;
    r.explanationTr='Doğru. "ever" burada hatalıdır; "hiç gitmedim" anlamı için "never" gerekir.';
    r.wrongExplanationTr='Asıl hata "ever" kelimesindedir; doğru cümle "I have never been there."';
  }else if(sections[i]==="Error correction"&&i===37){
    r.prompt="Hatalı kelimeyi bul: I haven't finished my homework already.";
    r.options=["haven't","finished","already"];
    r.correctIndex=2;
    r.explanationTr='Doğru. Olumsuz cümlede "already" yerine "yet" kullanılmalıdır.';
    r.wrongExplanationTr=`As?l hata "already" kelimesindedir; do?ru c?mle "I haven\'t finished my homework yet."`;
  }else{
    r.options=uniqueOptions(r.options||[]);
    if(!r.options.includes(correct))r.options.unshift(correct);
    r.correctIndex=r.options.indexOf(correct);
  }
  if(new Set(r.options).size!==r.options.length){
    r.options=uniqueOptions(r.options);
    r.correctIndex=r.options.indexOf(correct);
  }
  r.section=sections[i];
  r.topicLabel=r.topicLabel||sections[i];
  r.topicTag=r.topicTag||sections[i].toLowerCase().replace(/\s+/g,"-");
  if(!r.explanationTr)r.explanationTr=`Doğru cevap "${r.options[r.correctIndex]}".`;
  if(!r.wrongExplanationTr)r.wrongExplanationTr=`Bu seçenek uygun değil; doğru cevap "${r.options[r.correctIndex]}".`;
}
finalLesson.assessment.finalExam={questionCount:45,autoScored:40,rubricTasks:5,topics:["Grammar","Vocabulary","Reading","Listening","Sentence order","Error correction","Writing","Speaking"],sections:{Grammar:12,Vocabulary:8,Reading:5,Listening:5,"Sentence order":5,"Error correction":5}};
write("data/lessons/065-final-exam.json",finalLesson);

const config=read("data/app-config.json");
config.version="FINAL-A2-QA2";
write("data/app-config.json",config);
console.log(JSON.stringify({visibleFixes,listeningFixed}));
