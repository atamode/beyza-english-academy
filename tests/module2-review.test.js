import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {flattenLessons} from "../js/catalog.js";
import {isModuleComplete,analyzeModuleReview,createReviewSession} from "../js/review-engine.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),"utf8"));
const curriculum=read("data/curriculum.json");
const review=read("data/module2-review.json");
const config=read("data/app-config.json");

test("Module 2 general review exists and is configured without replacing Module 1",()=>{
  assert.equal(review.moduleId,"module-2");
  assert.equal(review.questions.length,25);
  assert.equal(config.moduleReviews["module-1"],"data/module1-review.json");
  assert.equal(config.moduleReviews["module-2"],"data/module2-review.json");
});

test("Module 2 review covers lessons 008-015 topics with balanced analysis tags",()=>{
  const tags=review.questions.map(q=>q.topicTag);
  const expected=[
    "present-simple-affirmative",
    "third-person-s",
    "present-simple-negative",
    "do-does-questions",
    "short-answers",
    "frequency",
    "time-routines",
    "preferences"
  ];
  assert.deepEqual([...new Set(tags)].sort(),expected.sort());
  const counts=Object.values(tags.reduce((a,t)=>(a[t]=(a[t]||0)+1,a),{}));
  assert.ok(Math.max(...counts)-Math.min(...counts)<=2);
  const session=createReviewSession(review);
  for(const q of session.items)session.answers[q.id]={completed:true,points:q.points||1};
  const result=analyzeModuleReview(session);
  assert.deepEqual(result.topics.map(t=>t.id).sort(),expected.sort());
});

test("Module 2 review uses varied original activity types",()=>{
  const types=new Set(review.questions.map(q=>q.type));
  for(const type of ["multiple-choice","fill-blank","matching","error-find","sentence-order","reading","listening"]){
    assert.ok(types.has(type),`missing ${type}`);
  }
  const prompts=review.questions.map(q=>q.content?.prompt||q.content?.question||q.title);
  assert.equal(new Set(prompts).size,prompts.length);
});

test("Module 2 review unlocks only after lessons 008-015 are complete",()=>{
  const module2=flattenLessons(curriculum).filter(x=>x.moduleId==="module-2"&&x.status==="published");
  const state={lessonProgress:{}};
  assert.equal(isModuleComplete(curriculum,state,"module-2"),false);
  for(const row of module2.slice(0,-1))state.lessonProgress[row.id]={completed:true};
  assert.equal(isModuleComplete(curriculum,state,"module-2"),false);
  state.lessonProgress[module2.at(-1).id]={completed:true};
  assert.equal(isModuleComplete(curriculum,state,"module-2"),true);
});

test("Module 2 review avoids banned editorial phrases",()=>{
  const raw=JSON.stringify(review);
  assert.doesNotMatch(raw,/hit the volleyball|hits the volleyball/i);
  assert.doesNotMatch(raw,/She doesn't play guitar/);
  assert.doesNotMatch(raw,/He practises music in his room/);
});
