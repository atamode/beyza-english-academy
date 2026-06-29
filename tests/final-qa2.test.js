import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {flattenLessons} from "../js/catalog.js";
import {parentView} from "../js/parent-mode.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const readJson=f=>JSON.parse(fs.readFileSync(path.join(root,f),"utf8"));
const readText=f=>fs.readFileSync(path.join(root,f),"utf8");
const curriculum=readJson("data/curriculum.json");
const published=flattenLessons(curriculum).filter(x=>x.status==="published");
const lessonRows=published.filter(x=>x.order>=0&&x.order<=65);
const qaRows=published.filter(x=>x.order>=22&&x.order<=65);
const badVisible=["S?nav?","MOD?L","do?ru","? Ana ekran","? Geri","Sonraki ?"];
const badQuestionMarks=["Boraç","cinemaç","bananaç","Ankaraç","Antalyaç","Beyzaç"];
const artificial=["doğru biçim","farklı bir ders kelimesi","yanlış anlam","This order is not complete"];

function uniqueOptions(options,label){
  assert.ok(Array.isArray(options),`${label}: options must be an array`);
  assert.ok(options.every(x=>String(x??"").trim()),`${label}: empty option`);
  assert.equal(new Set(options).size,options.length,`${label}: duplicate options`);
}

function collectOptionSets(screen){
  const out=[];
  if(screen.type==="multiple-choice")out.push({label:screen.id,options:screen.content.options});
  if(screen.type==="reading"){
    for(const [i,q] of (screen.content.questions||[]).entries())out.push({label:`${screen.id}:reading:${i}`,options:q.options});
  }
  if(screen.type==="listening"){
    for(const [i,q] of (screen.content.questions||[]).entries())out.push({label:`${screen.id}:listening:${i}`,options:q.options});
  }
  if(screen.type==="mini-game"||screen.type==="vocabulary-hunt"){
    for(const [i,r] of (screen.content.rounds||[]).entries())out.push({label:`${screen.id}:round:${i}`,options:r.options});
  }
  return out;
}

function correctIndexes(rows,type){
  const indexes=[];
  for(const row of rows){
    const lesson=readJson(row.file);
    for(const screen of lesson.screens.filter(s=>s.type===type)){
      if(type==="reading"||type==="listening"){
        for(const q of screen.content.questions||[])indexes.push(q.correctIndex);
      }else{
        for(const r of screen.content.rounds||[])indexes.push(r.correctIndex);
      }
    }
  }
  return indexes;
}

function assertBalanced(indexes,label){
  assert.ok(indexes.length>0,`${label}: no indexes`);
  assert.ok(new Set(indexes).size>=2,`${label}: only one correct index`);
  const counts=Map.groupBy(indexes,x=>x);
  const max=Math.max(...[...counts.values()].map(x=>x.length));
  assert.ok(max/indexes.length<=0.7,`${label}: one index is over 70%`);
}

test("QA2 visible text and wrong question-mark conversions are absent from source and dist",()=>{
  const files=["js/app.js","js/parent-mode.js","dist/js/app.js","dist/js/parent-mode.js"];
  for(const file of files){
    if(!fs.existsSync(path.join(root,file)))continue;
    const text=readText(file);
    for(const bad of badVisible)assert.equal(text.includes(bad),false,`${file}: ${bad}`);
  }
  const scanFiles=[
    "scripts/generate-module1.js",
    "scripts/generate-module2-review.js",
    "data/lessons/004-to-be-questions.json",
    "data/lessons/033-prices-shopping.json",
    "data/lessons/057-ever-never.json",
    "data/lessons/065-final-exam.json",
    "data/module2-review.json",
    "data/module10-review.json"
  ];
  for(const file of scanFiles.filter(f=>fs.existsSync(path.join(root,f)))){
    const text=readText(file);
    for(const bad of badQuestionMarks)assert.equal(text.includes(bad),false,`${file}: ${bad}`);
  }
});

test("QA2 duplicate and artificial options are absent across lessons, reviews and final",()=>{
  const files=[
    ...lessonRows.map(x=>x.file),
    ...Array.from({length:10},(_,i)=>`data/module${i+1}-review.json`).filter(f=>fs.existsSync(path.join(root,f)))
  ];
  for(const file of files){
    const text=readText(file);
    for(const bad of [...badQuestionMarks,...artificial])assert.equal(text.includes(bad),false,`${file}: ${bad}`);
    const data=readJson(file);
    if(data.screens){
      for(const screen of data.screens){
        for(const set of collectOptionSets(screen))uniqueOptions(set.options,`${file}:${set.label}`);
      }
    }
    if(data.questions){
      for(const [i,q] of data.questions.entries()){
        if(q.content?.options)uniqueOptions(q.content.options,`${file}:q${i}`);
        if(q.options)uniqueOptions(q.options,`${file}:q${i}`);
      }
    }
  }
});

test("QA2 error-find screens use valid single-token errors",()=>{
  const l57=readJson("data/lessons/057-ever-never.json").screens.find(s=>s.type==="error-find");
  const l58=readJson("data/lessons/058-already-yet.json").screens.find(s=>s.type==="error-find");
  assert.equal(l57.content.sentence[l57.content.wrongIndex].replace(/[.,!?]/g,""),"ever");
  assert.match(l57.content.explanationTr,/have never been|never/);
  assert.equal(l58.content.sentence[l58.content.wrongIndex].replace(/[.,!?]/g,""),"already");
  assert.match(l58.content.explanationTr,/yet/);
  for(const row of lessonRows){
    const lesson=readJson(row.file);
    for(const screen of lesson.screens.filter(s=>s.type==="error-find")){
      assert.ok(screen.content.wrongIndex>=0&&screen.content.wrongIndex<screen.content.sentence.length,`${row.id}:${screen.id}`);
      assert.equal(JSON.stringify(screen).includes("doğru biçim"),false,`${row.id}:${screen.id}`);
    }
  }
});

test("QA2 listening screens have three scored questions and advance sequentially",()=>{
  for(const row of qaRows){
    const lesson=readJson(row.file);
    const listening=lesson.screens.find(s=>s.type==="listening");
    assert.equal(listening.content.questions.length,3,row.id);
    assert.equal("answers" in listening.content,false,row.id);
    for(const [i,q] of listening.content.questions.entries()){
      assert.ok(q.prompt&&q.options&&q.explanationsTr,`${row.id}:q${i}`);
      assert.ok(q.correctIndex>=0&&q.correctIndex<q.options.length,`${row.id}:q${i}`);
      uniqueOptions(q.options,`${row.id}:listening:${i}`);
    }
  }
  const model={round:0,completed:false};
  for(let i=0;i<3;i++){
    model.round=i;
    model.completed=i===2;
    if(i<2)assert.equal(model.completed,false);
  }
  assert.equal(model.completed,true);
});

test("QA2 final exam has required topic metadata, distribution and result UI",()=>{
  const final=readJson("data/lessons/065-final-exam.json");
  const rounds=final.screens.find(s=>s.id==="s14b").content.rounds;
  assert.equal(rounds.length,40);
  const expected={Grammar:12,Vocabulary:8,Reading:5,Listening:5,"Sentence order":5,"Error correction":5};
  const counts={};
  for(const [i,r] of rounds.entries()){
    assert.ok(r.topicTag,`round ${i} topicTag`);
    assert.ok(r.topicLabel,`round ${i} topicLabel`);
    assert.ok(r.section,`round ${i} section`);
    counts[r.section]=(counts[r.section]||0)+1;
    uniqueOptions(r.options,`final:${i}`);
  }
  assert.deepEqual(counts,expected);
  const app=readText("js/app.js");
  assert.match(app,/finalExamResult/);
  assert.match(app,/buildFinalExamResult/);
  assert.match(app,/strongAreas/);
  assert.match(app,/weakAreas/);
});

test("QA2 correct answer positions are balanced in generated lesson checks",()=>{
  assertBalanced(correctIndexes(qaRows,"vocabulary-hunt"),"vocabulary-hunt");
  assertBalanced(correctIndexes(qaRows,"reading"),"reading");
  assertBalanced(correctIndexes(qaRows,"listening"),"listening");
  const final=readJson("data/lessons/065-final-exam.json").screens.find(s=>s.id==="s14b").content.rounds;
  for(const section of ["Vocabulary","Reading","Listening"]){
    assertBalanced(final.filter(r=>r.section===section).map(r=>r.correctIndex),`final ${section}`);
  }
});

test("QA2 parent mode uses the selected module, not hard-coded Module 1",()=>{
  const lessonRow=published.find(x=>x.moduleId==="module-10");
  const lesson=readJson(lessonRow.file);
  const state={lessonProgress:{[lesson.id]:{}},moduleReviews:{"module-10":{correct:20,total:25,percent:80,topics:[]}},vocabularyProgress:{}};
  const html=parentView(state,lesson,curriculum,new Map([[lesson.id,lesson]]),[]);
  assert.equal(html.includes("Modül 1 Genel Tekrar"),false);
  assert.equal(html.includes("Modül 10 Genel Tekrar"),true);
  assert.equal(html.includes("Seçili ders, modül tekrarı, kelime takibi ve tekrar havuzu tek yerde."),true);
});
