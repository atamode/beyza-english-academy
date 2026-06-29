import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {flattenLessons} from "../js/catalog.js";
import {normalizeVocabulary,recordWordAnswer,vocabularyStats,createTournament,weeklyWords} from "../js/vocabulary-engine.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),"utf8"));
const curriculum=read("data/curriculum.json");
const quick=read("data/lessons/000-quick-start.json");
const vocab=normalizeVocabulary(read("data/vocabulary.json"));

test("Ders 0 is the first published curriculum lesson and teaches before testing",()=>{
  const published=flattenLessons(curriculum).filter(x=>x.status==="published");
  assert.equal(published[0].id,"000-quick-start");
  assert.match(JSON.stringify(quick),/I am Beyza/);
  assert.match(JSON.stringify(quick),/volleyball player/);
  assert.match(JSON.stringify(quick),/They are singers/);
  assert.ok(quick.screens.find(x=>x.type==="explanation"));
  assert.ok(quick.screens.find(x=>x.content?.secondTryHintTr||x.content?.secondTryHintTr===""));
  assert.ok(quick.screens.some(x=>x.type==="vocabulary-hunt"));
  assert.match(JSON.stringify(quick),/İlk Adım Rozeti|İlk Adım Rozeti/);
});

test("each published lesson has six to eight vocabulary items and a vocabulary hunt",()=>{
  for(const row of flattenLessons(curriculum).filter(x=>x.status==="published")){
    const words=vocab.filter(x=>x.lessonId===row.id);
    assert.ok(words.length>=6&&words.length<=8,row.id);
    for(const w of words){
      assert.ok(w.word&&w.meaningTr&&w.example&&w.sentenceTr&&w.audioText&&w.sourceLessonTitle,w.id);
    }
    const lesson=read(row.file);
    assert.ok(lesson.screens.some(s=>s.type==="vocabulary-hunt"),row.id);
  }
});

test("vocabulary themes are naturally mixed around the requested ratio",()=>{
  const counts=vocab.reduce((acc,w)=>((acc[w.theme]=(acc[w.theme]||0)+1),acc),{});
  assert.ok(counts.general>counts.volleyball);
  assert.ok(counts.volleyball>=10);
  assert.ok(counts.music>=10);
});

test("smart repetition moves correct words forward and wrong words to difficult",()=>{
  const state={};
  const word=vocab[0];
  const now=new Date("2026-06-28T10:00:00Z");
  recordWordAnswer(state,word,true,now);
  assert.equal(state.vocabularyProgress[word.id].status,"learning");
  assert.match(state.vocabularyProgress[word.id].dueAt,/2026-06-29/);
  recordWordAnswer(state,word,false,now);
  assert.equal(state.vocabularyProgress[word.id].status,"difficult");
  assert.equal(vocabularyStats(vocab,state,now).difficult.length,1);
});

test("weekly tournament has three lives and a final-ready word pool",()=>{
  const state={vocabularyProgress:{}};
  const words=weeklyWords(vocab,state,new Date("2026-06-28T10:00:00Z"));
  const t=createTournament(words);
  assert.equal(t.lives,3);
  assert.ok(t.rounds.length>=6);
  assert.equal(t.mode,"tournament");
});
