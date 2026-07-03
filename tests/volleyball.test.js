import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createVolleyballManifestResolver, requiredVolleyballAssetPaths, volleyballVideoEvents} from "../js/volleyball-assets.js";
import {renderVolleyballMedia} from "../js/volleyball-game.js";
import {FOOTBALL_KEYS, recordFootballLeagueAnswer, readFootballLeagueProgress, finalizeFootballLeagueMatch} from "../js/football-engine.js";
import {VOLLEYBALL_KEYS, createVolleyballSession, advanceVolleyball, answerVolleyballQuestion, validateVolleyballQuestion, summarizeVolleyball, mergeVolleyballStats, defaultVolleyballStats} from "../js/volleyball-engine.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"assets/games/poma-volleyball-v1/asset-manifest.json"),"utf8"));
const resolver=createVolleyballManifestResolver(manifest);
const words=Array.from({length:34},(_,i)=>({
  id:`vw${i+1}`,
  word:`volley${i+1}`,
  meaningTr:`anlam${i+1}`,
  example:`This is volley ${i+1}.`,
  lessonId:String((i%15)+1).padStart(3,"0")+"-lesson",
  theme:i%4===0?"school":i%4===1?"sport":i%4===2?"city":"routine"
}));
function storageOf(value=null){
  const data={};
  if(value)data[FOOTBALL_KEYS.league]=JSON.stringify(value);
  return {getItem(key){return data[key]||null},setItem(key,v){data[key]=v},raw(){return data}};
}

test("volleyball manifest resolves all result videos and asset paths",()=>{
  assert.equal(manifest.id,"poma-volleyball-v1");
  assert.deepEqual(volleyballVideoEvents(manifest).sort(),["conceded","defenceSuccess","lose","passSuccess","saveSuccess","shotMissed","shotSuccess","win"].sort());
  for(const rel of requiredVolleyballAssetPaths(manifest)){
    assert.equal(fs.existsSync(path.join(root,"assets/games/poma-volleyball-v1",rel)),true,rel);
  }
  assert.match(resolver.result("shotSuccess").posterUrl,/volleyball-spike-success-poster\.webp$/);
  assert.match(resolver.video("conceded").url,/volleyball-point-conceded\.mp4$/);
});

test("app exposes real volleyball route and active games card",()=>{
  const app=fs.readFileSync(path.join(root,"js/app.js"),"utf8");
  assert.match(app,/game\/volleyball/);
  assert.match(app,/volleyballGameView/);
  assert.match(app,/Poma Voleybol V1/);
  assert.doesNotMatch(app,/Voleybol mini oyunu hazır olduğunda burada açılacak/);
});

test("volleyball state flow branches to point, block, save and conceded visuals",()=>{
  let s=createVolleyballSession(words,{vocabularyProgress:{}},()=>0.11,storageOf());
  s=advanceVolleyball(s);
  assert.equal(s.phase,"POSSESSION_QUESTION");
  s=answerVolleyballQuestion(s,s.currentQuestion.correctIndex,words,{},()=>0.2);
  assert.equal(s.visual,"passSuccess");
  s=advanceVolleyball(s);
  assert.equal(s.phase,"SPIKE_QUESTION");
  s=answerVolleyballQuestion(s,s.currentQuestion.correctIndex,words,{},()=>0.3);
  assert.equal(s.visual,"shotSuccess");
  assert.equal(s.pointsFor,1);

  let d=createVolleyballSession(words,{vocabularyProgress:{}},()=>0.41,storageOf());
  d=advanceVolleyball(d);
  d=answerVolleyballQuestion(d,(d.currentQuestion.correctIndex+1)%4,words,{},()=>0.4);
  assert.equal(d.phase,"RECEIVE_QUESTION");
  d=answerVolleyballQuestion(d,d.currentQuestion.correctIndex,words,{},()=>0.5);
  assert.equal(d.visual,"saveSuccess");
  d=advanceVolleyball(d);
  d=answerVolleyballQuestion(d,(d.currentQuestion.correctIndex+1)%4,words,{},()=>0.6);
  d=answerVolleyballQuestion(d,(d.currentQuestion.correctIndex+1)%4,words,{},()=>0.7);
  d=answerVolleyballQuestion(d,(d.currentQuestion.correctIndex+1)%4,words,{},()=>0.8);
  assert.equal(d.visual,"conceded");
  assert.equal(d.pointsAgainst,1);
});

test("volleyball questions are valid and have no duplicate words in one match",()=>{
  const s=createVolleyballSession(words,{vocabularyProgress:{}},()=>0.23,storageOf());
  assert.equal(s.matchQuestions.length,10);
  assert.equal(new Set(s.matchQuestions.map(q=>q.wordId)).size,s.matchQuestions.length);
  for(const q of s.matchQuestions){
    assert.equal(validateVolleyballQuestion(q),true);
    assert.equal(q.options.filter(x=>x===q.correctAnswer).length,1);
  }
});

test("two volleyball matches do not repeat the same question set after finalization",()=>{
  const store=storageOf();
  const a=createVolleyballSession(words,{vocabularyProgress:{}},()=>0.12,store);
  const finished=summarizeVolleyball({...a,questionsAsked:a.maxQuestions,correct:8,wrong:2,recentWordIds:a.matchWordIds});
  finalizeFootballLeagueMatch(finished,store);
  const b=createVolleyballSession(words,{vocabularyProgress:{}},()=>0.12,store);
  assert.notEqual(a.matchWordIds.join("|"),b.matchWordIds.join("|"));
});

test("football word league progress is shared with volleyball while sport stats stay separate",()=>{
  const store=storageOf();
  const s=createVolleyballSession(words,{vocabularyProgress:{}},()=>0.18,store);
  recordFootballLeagueAnswer(s.currentQuestion,true,"football-match-1",store,new Date("2026-01-01T00:00:00Z"));
  const progress=readFootballLeagueProgress(store);
  assert.equal(progress.seenWordIds.includes(s.currentQuestion.wordId),true);
  assert.equal(VOLLEYBALL_KEYS.league,FOOTBALL_KEYS.league);
  assert.notEqual(VOLLEYBALL_KEYS.stats,FOOTBALL_KEYS.stats);
  const stats=mergeVolleyballStats(defaultVolleyballStats(),{...s,summary:{pointsFor:1,pointsAgainst:0,correct:1,wrong:0,blocks:1,saves:1},recentWordIds:[s.currentQuestion.wordId]});
  assert.equal(stats.pointsFor,1);
  assert.equal(stats.goalsFor,undefined);
});

test("volleyball media uses a single 16:9 poster-video stage with fallback poster",()=>{
  const html=renderVolleyballMedia(resolver.result("shotSuccess"),resolver,"shotSuccess",false);
  assert.equal((html.match(/football-media-stage/g)||[]).length,1);
  assert.equal((html.match(/football-media-poster/g)||[]).length,1);
  assert.equal((html.match(/football-media-video/g)||[]).length,1);
  assert.equal(/<img[\s\S]*<\/div>[\s\S]*<video/.test(html),false);
  const png=renderVolleyballMedia(resolver.state("possession"),resolver,"possession",false);
  assert.equal((png.match(/football-media-video/g)||[]).length,0);
});
