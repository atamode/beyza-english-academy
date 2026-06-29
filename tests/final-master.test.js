import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {flattenLessons} from "../js/catalog.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),"utf8"));
const curriculum=read("data/curriculum.json");
const lessons=flattenLessons(curriculum).filter(x=>x.status==="published");

test("final curriculum has lessons 000-065 exactly once and in order",()=>{
  assert.equal(lessons.length,66);
  assert.deepEqual(lessons.map(x=>x.order),Array.from({length:66},(_,i)=>i));
  assert.equal(new Set(lessons.map(x=>x.id)).size,66);
  for(const row of lessons){
    assert.ok(fs.existsSync(path.join(root,row.file)),row.id);
    assert.equal(read(row.file).id,row.id);
  }
});

test("final curriculum chain has the requested module boundaries",()=>{
  const byOrder=new Map(lessons.map(x=>[x.order,x]));
  for(let i=2;i<=65;i++) assert.ok(byOrder.get(i).prerequisites.includes(byOrder.get(i-1).id),`${i}`);
  assert.equal(byOrder.get(65).id,"065-final-exam");
});

test("module 4 through 10 reviews are configured and cached candidates exist",()=>{
  const config=read("data/app-config.json");
  for(let i=4;i<=10;i++){
    const file=config.moduleReviews[`module-${i}`];
    assert.equal(file,`data/module${i}-review.json`);
    const review=read(file);
    assert.equal(review.questions.length,25);
    assert.equal(review.moduleId,`module-${i}`);
  }
});

test("new lessons have vocabulary and vocabulary hunt integration",()=>{
  const vocab=read("data/vocabulary.json").items;
  for(const row of lessons.filter(x=>x.order>=22&&x.order<=65)){
    const lesson=read(row.file);
    const words=vocab.filter(w=>w.lessonId===row.id);
    assert.ok(words.length>=6&&words.length<=8,row.id);
    assert.ok(lesson.screens.some(s=>s.type==="vocabulary-hunt"),row.id);
    assert.ok(lesson.parentGuide?.worksheet?.questions?.length>=10,row.id);
  }
});

test("lesson 65 contains a real final exam model",()=>{
  const lesson=read("data/lessons/065-final-exam.json");
  assert.equal(lesson.assessment.finalExam.questionCount,45);
  assert.ok(lesson.screens.some(s=>s.id==="s14b"&&s.content.rounds.length===40));
  assert.equal(lesson.assessment.finalExam.rubricTasks,5);
});

test("known UTF-8 mojibake patterns are absent from shipped source files",()=>{
  const bad=/(Mod\?l|Yanl\?\?lar\?m\?|Kelime Kasas\?|Haftan\?n|s\?nav\?|\u00EF\u00BF\u00BD|\u00C3\u0192|\u00C3\u201E|\u00C3\u2026|\u00E2\u20AC|\u00C2\u00B7)/;
  const files=["index.html","js/app.js","js/parent-mode.js","data/curriculum.json","data/app-config.json","data/vocabulary.json","service-worker.js"];
  for(const file of files) assert.doesNotMatch(fs.readFileSync(path.join(root,file),"utf8"),bad,file);
});
