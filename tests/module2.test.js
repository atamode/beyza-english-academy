import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {flattenLessons} from "../js/catalog.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),"utf8"));
const curriculum=read("data/curriculum.json");
const module2=flattenLessons(curriculum).filter(x=>x.moduleId==="module-2"&&x.status==="published");

test("Module 2 lessons are published in order from existing lesson 8 through lesson 15",()=>{
  assert.deepEqual(module2.map(x=>x.id),[
    "008-present-simple-affirmative",
    "009-third-person-s",
    "010-present-simple-negative",
    "011-do-does-questions",
    "012-short-answers",
    "013-adverbs-frequency",
    "014-time-daily-routine",
    "015-hobbies-preferences"
  ]);
  for(const row of module2) assert.ok(fs.existsSync(path.join(root,row.file)),row.id);
});

test("editorial corrections are applied to corrected source and generated lessons",()=>{
  const source=fs.readFileSync(path.join(root,"docs/module2_source_corrected.md"),"utf8");
  const generated=JSON.stringify(module2.map(row=>read(row.file)));
  for(const text of [source,generated]){
    assert.doesNotMatch(text,/hit the volleyball|hits the volleyball/i);
    assert.doesNotMatch(text,/She doesn't play guitar/);
    assert.doesNotMatch(text,/He practises music in his room/);
  }
  assert.match(generated,/hit the ball|hits the ball/);
  assert.match(generated,/play the guitar/);
});

test("Ders 12 keeps Is and Are short-answer examples",()=>{
  const lesson=read("data/lessons/012-short-answers.json");
  const raw=JSON.stringify(lesson);
  assert.match(raw,new RegExp("Is/Are"));
  assert.match(raw,/Are your friends ready/);
  assert.match(raw,/they are/);
  assert.match(raw,/aren't/);
});

test("Ders 13 frequency question uses weekend evidence instead of liking inference",()=>{
  const lesson=read("data/lessons/013-adverbs-frequency.json");
  const prompts=lesson.screens.flatMap(s=>s.content?.rounds?.map(r=>r.prompt)||[]);
  assert.ok(prompts.includes("She plays volleyball every weekend. She ___ plays volleyball on weekends."));
  assert.ok(!prompts.some(p=>/loves watching/.test(p)));
});

test("Ders 15 keeps gerund recognition limited and mostly uses noun preference structure",()=>{
  const lesson=read("data/lessons/015-hobbies-preferences.json");
  const rounds=[...lesson.screens.find(s=>s.id==="s15").content.rounds,...lesson.screens.find(s=>s.id==="s16").content.rounds];
  const ingQuestions=rounds.filter(r=>/\b\w+ing\b/.test(JSON.stringify(r)));
  assert.ok(ingQuestions.length<=3);
  assert.ok(rounds.filter(r=>/volleyball|music|cold weather|the guitar|the team|concerts|match result/.test(JSON.stringify(r))).length>=7);
  assert.doesNotMatch(JSON.stringify(lesson),/harf ikilemesi|yazım kuralları/);
});

test("Module 2 generated lessons include vocabulary and vocabulary hunt screens",()=>{
  const vocab=read("data/vocabulary.json").items;
  for(const row of module2.filter(x=>x.id!=="008-present-simple-affirmative")){
    const lesson=read(row.file);
    const words=vocab.filter(w=>w.lessonId===row.id);
    assert.ok(words.length>=6&&words.length<=8,row.id);
    assert.ok(lesson.screens.some(s=>s.type==="vocabulary-hunt"),row.id);
  }
});
