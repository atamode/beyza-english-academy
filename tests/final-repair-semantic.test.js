import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {flattenLessons} from "../js/catalog.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),"utf8"));
const curriculum=read("data/curriculum.json");
const lessons=flattenLessons(curriculum).filter(x=>x.status==="published"&&x.order>=22&&x.order<=65);
const forbidden=[
  "Choose the correct answer.",
  "\"answer\": \"\"",
  "Kaynak cevap anahtarına göre doğru seçenek budur.",
  "Kaynakta belirtilen kelime hedef kurala göre düzeltilmelidir.",
  "What is the text about?",
  "Metinde yok",
  "Farklı ayrıntı",
  "target present",
  "sentence present",
  "question present",
  "answer present",
  "rule present",
  "target general",
  "Doğru seçenek",
  "Geliştirilecek seçenek",
  "Konu dışı seçenek"
];
const sourceFiles=[
  "modul4_english_academy_REVIZE_FINAL.md",
  "modul5_english_academy_REVIZE_FINAL.md",
  "modul6_english_academy_REVIZE_FINAL.md",
  "modul7_english_academy_REVIZE_FINAL.md",
  "modul8_english_academy_REVIZE_FINAL.md",
  "modul9_english_academy_REVIZE_FINAL.md",
  "modul10_english_academy_REVIZE_FINAL.md"
];

function lessonFiles(){return lessons.map(x=>x.file);}
function sourceVocabulary(){
  const map=new Map();
  for(const source of sourceFiles){
    const text=fs.readFileSync(path.join(root,source),"utf8");
    for(const lesson of [...text.matchAll(/^#\s+DERS\s+(\d+)\s+[—-]\s+(.+)$/gm)]){
      const no=Number(lesson[1]);
      const start=lesson.index;
      const next=text.slice(start+1).search(/^#\s+DERS\s+\d+\s+[—-]/m);
      const block=next>=0?text.slice(start,start+1+next):text.slice(start);
      const words=[...block.matchAll(/^\d+\.\s+\*\*([^*]+)\*\*\s+\|/gm)].map(m=>m[1].toLowerCase());
      if(words.length)map.set(no,words);
    }
  }
  return map;
}
function normalizedSegments(items){return items.map(x=>String(x).toLowerCase().replace(/[.,!?]/g,"").trim()).sort();}

test("repaired final files contain no banned placeholders",()=>{
  const files=[...lessonFiles(),"data/module4-review.json","data/module5-review.json","data/module6-review.json","data/module7-review.json","data/module8-review.json","data/module9-review.json","data/module10-review.json","data/vocabulary.json"];
  for(const file of files){
    const text=fs.readFileSync(path.join(root,file),"utf8");
    for(const bad of forbidden)assert.equal(text.includes(bad),false,`${file}: ${bad}`);
    assert.equal(/\bFinal\s+\d+\b/.test(text),false,`${file}: placeholder final title`);
    assert.equal(/"options"\s*:\s*\[\s*"A"\s*,\s*"B"\s*,\s*"C"\s*\]/.test(text),false,`${file}: bare ABC options`);
  }
});

test("fill blank, multiple choice and sentence order screens are meaningful",()=>{
  for(const row of lessons){
    const lesson=read(row.file);
    for(const screen of lesson.screens){
      if(screen.type==="fill-blank"){
        assert.ok(screen.content.answer?.trim(),`${row.id}:${screen.id}`);
        assert.ok(screen.content.accepted?.some(x=>String(x).trim()),`${row.id}:${screen.id}`);
      }
      if(screen.type==="multiple-choice"){
        assert.ok(screen.instructionTr.length>4,`${row.id}:${screen.id}`);
        assert.ok(screen.content.options.length>=2,`${row.id}:${screen.id}`);
        assert.ok(new Set(screen.content.options).size>=2,`${row.id}:${screen.id}`);
        assert.ok(screen.content.correctIndex>=0&&screen.content.correctIndex<screen.content.options.length,`${row.id}:${screen.id}`);
        assert.notDeepEqual(screen.content.options,["A","B","C"],`${row.id}:${screen.id}`);
      }
      if(screen.type==="mini-game"){
        for(const round of screen.content.rounds){
          assert.ok(round.prompt.length>4,`${row.id}:${screen.id}`);
          assert.notDeepEqual(round.options,["A","B","C"],`${row.id}:${screen.id}`);
          assert.ok(round.correctIndex>=0&&round.correctIndex<round.options.length,`${row.id}:${screen.id}`);
        }
      }
      if(screen.type==="sentence-order"){
        assert.deepEqual(normalizedSegments(screen.content.tokens),normalizedSegments(screen.content.answer),`${row.id}:${screen.id}`);
      }
    }
  }
});

test("reading and listening use real questions without answer blocks in student text",()=>{
  for(const row of lessons){
    const lesson=read(row.file);
    const reading=lesson.screens.find(s=>s.type==="reading");
    assert.ok(reading,`${row.id}: reading`);
    assert.equal(/Cevaplar:/i.test(reading.content.text),false,row.id);
    assert.ok(reading.content.questions.length>=3,row.id);
    assert.equal(reading.content.questions.some(q=>q.prompt==="What is the text about?"),false,row.id);
    const listening=lesson.screens.find(s=>s.type==="listening");
    assert.ok(listening,`${row.id}: listening`);
    assert.equal(/Cevaplar:/i.test(listening.content.audioText),false,row.id);
    assert.ok((listening.content.questions||[]).length>=3,row.id);
  }
});

test("vocabulary for lessons 022-065 matches source markdown words",()=>{
  const expected=sourceVocabulary();
  const vocab=read("data/vocabulary.json").items;
  for(const row of lessons){
    const words=vocab.filter(w=>w.lessonId===row.id).map(w=>w.word.toLowerCase());
    assert.ok(words.length>=6&&words.length<=8,row.id);
    const sourceWords=expected.get(row.order);
    assert.ok(sourceWords?.length>=6,`${row.id}: source vocabulary missing`);
    assert.deepEqual(words,sourceWords.slice(0,words.length),row.id);
  }
});

test("module 4-10 reviews have 25 unique real prompts",()=>{
  for(let i=4;i<=10;i++){
    const review=read(`data/module${i}-review.json`);
    assert.equal(review.questions.length,25,`module${i}`);
    const prompts=review.questions.map(q=>q.instructionTr||q.content?.prompt||q.title);
    assert.equal(new Set(prompts).size,25,`module${i}`);
    assert.equal(prompts.some(p=>/Choose the correct answer|Final \d+|Doğru seçenek/.test(p)),false,`module${i}`);
  }
});

test("lesson 64 and final exam contain real review/final assessment content",()=>{
  const l64=read("data/lessons/064-general-review.json");
  const matching=JSON.stringify(l64.screens.find(s=>s.type==="matching")?.content?.pairs||[]);
  assert.equal(matching.includes("every day\",\"Past Simple"),false);
  assert.equal(matching.includes("now\",\"Present Simple"),false);
  assert.equal(matching.includes("yesterday\",\"Present Continuous"),false);
  const final=read("data/lessons/065-final-exam.json");
  const rounds=final.screens.find(s=>s.id==="s14b").content.rounds;
  assert.equal(rounds.length,40);
  assert.ok(new Set(rounds.map(r=>r.prompt)).size>=35);
  assert.equal(rounds.some(r=>/Final \d+|Doğru seçenek|Geliştirilecek seçenek|Konu dışı seçenek/.test(JSON.stringify(r))),false);
  const rubricScreens=final.screens.filter(s=>["s14c","s14d"].includes(s.id));
  assert.equal(rubricScreens.length,2);
  assert.equal(final.assessment.finalExam.questionCount,45);
});

test("critical pedagogy examples are present in repaired content",()=>{
  const all=lessons.map(x=>fs.readFileSync(path.join(root,x.file),"utf8")).join("\n");
  assert.match(all,/Did you _______ the film[\s\S]*?see/);
  assert.match(all,/mustn't[\s\S]*don't have to|don't have to[\s\S]*mustn't/i);
  assert.match(all,/going to[\s\S]*plan|plan[\s\S]*going to/i);
  assert.match(all,/for[\s\S]*since|since[\s\S]*for/i);
  assert.match(all,/If I study[\s\S]*will/);
});
