import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {flattenLessons} from "../js/catalog.js";
import {isModuleComplete,createReviewSession,analyzeModuleReview} from "../js/review-engine.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),"utf8"));
const curriculum=read("data/curriculum.json");
const module3=flattenLessons(curriculum).filter(x=>x.moduleId==="module-3"&&x.status==="published");

test("Module 3 lessons are published in order and chained from lesson 15",()=>{
  assert.deepEqual(module3.map(x=>x.id),[
    "016-there-is-there-are",
    "017-prepositions-place",
    "018-describing-room",
    "019-places-town",
    "020-giving-directions",
    "021-imperatives"
  ]);
  assert.deepEqual(module3.map(x=>x.prerequisites[0]),[
    "015-hobbies-preferences",
    "016-there-is-there-are",
    "017-prepositions-place",
    "018-describing-room",
    "019-places-town",
    "020-giving-directions"
  ]);
  for(const row of module3) assert.ok(fs.existsSync(path.join(root,row.file)),row.id);
});

test("Module 3 lessons include vocabulary and vocabulary hunt screens",()=>{
  const vocab=read("data/vocabulary.json").items;
  for(const row of module3){
    const lesson=read(row.file);
    const words=vocab.filter(w=>w.lessonId===row.id);
    assert.equal(words.length,7,row.id);
    assert.ok(lesson.vocabulary.length===7,row.id);
    assert.ok(lesson.screens.some(s=>s.type==="vocabulary-hunt"),row.id);
    assert.ok(lesson.screens.some(s=>s.type==="reading"),row.id);
    assert.ok(lesson.screens.some(s=>s.type==="listening"),row.id);
    assert.ok(lesson.screens.some(s=>s.type==="speaking"),row.id);
  }
});

test("Module 3 review has 25 questions across six target topics",()=>{
  const review=read("data/module3-review.json");
  const config=read("data/app-config.json");
  assert.equal(config.moduleReviews["module-3"],"data/module3-review.json");
  assert.equal(review.questions.length,25);
  const expected=["there-is-are","prepositions-place","describing-room","places-town","directions","imperatives"];
  assert.deepEqual([...new Set(review.questions.map(q=>q.topicTag))].sort(),expected.sort());
  const types=new Set(review.questions.map(q=>q.type));
  for(const type of ["multiple-choice","fill-blank","sentence-order","matching","error-find","listening"]) assert.ok(types.has(type),type);
  const session=createReviewSession(review);
  for(const item of session.items)session.answers[item.id]={completed:true,points:item.points||1};
  assert.deepEqual(analyzeModuleReview(session).topics.map(t=>t.id).sort(),expected.sort());
});

test("Module 3 review unlocks only after lessons 016-021 are complete",()=>{
  const state={lessonProgress:{}};
  assert.equal(isModuleComplete(curriculum,state,"module-3"),false);
  for(const row of module3.slice(0,-1))state.lessonProgress[row.id]={completed:true};
  assert.equal(isModuleComplete(curriculum,state,"module-3"),false);
  state.lessonProgress[module3.at(-1).id]={completed:true};
  assert.equal(isModuleComplete(curriculum,state,"module-3"),true);
});
