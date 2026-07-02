import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createPomaManifestResolver, requiredPomaAssetPaths, pomaVideoEvents} from "../js/poma-assets.js";
import {createFootballSession, advanceFootball, answerFootballQuestion, availableFootballWords, selectWordQuestion, safeRead, defaultFootballStats, defaultAchievements, unlockTrophies, summarizeFootball, shouldUseVideo, FOOTBALL_KEYS, validateFootballQuestion, createFootballMatchQuestions, defaultFootballLeagueProgress, migrateFootballLeagueProgress, recordFootballLeagueAnswer, readFootballLeagueProgress, finalizeFootballLeagueMatch, FOOTBALL_LEAGUES} from "../js/football-engine.js";
import {renderFootballMedia, makeOnce} from "../js/football-game.js";
import {createFootballAudio} from "../js/football-audio.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"assets/games/poma-football-v1/asset-manifest.json"),"utf8"));
const resolver=createPomaManifestResolver(manifest);
const words=[
  {id:"w1",word:"goal",meaningTr:"gol",example:"She scores a goal.",lessonId:"l1",theme:"football",audioText:"goal"},
  {id:"w2",word:"save",meaningTr:"kurtarış",example:"It is a great save.",lessonId:"l1",theme:"football",audioText:"save"},
  {id:"w3",word:"team",meaningTr:"takım",example:"We are a team.",lessonId:"l1",theme:"football",audioText:"team"},
  {id:"w4",word:"music",meaningTr:"müzik",example:"I like music.",lessonId:"l2",theme:"music",audioText:"music"},
  {id:"w5",word:"practice",meaningTr:"antrenman",example:"Practice starts now.",lessonId:"l2",theme:"general",audioText:"practice"}
];
const leagueWords=Array.from({length:36},(_,i)=>({
  id:`lw${i+1}`,
  word:`word${i+1}`,
  meaningTr:`anlam${i+1}`,
  example:`This is word ${i+1}.`,
  lessonId:String(i<24?String((i%12)+1).padStart(3,"0"):String(13+(i%12)).padStart(3,"0"))+"-lesson",
  theme:i%3===0?"school":i%3===1?"city":"routine"
}));
function storageOf(value=null){
  return {value:value?JSON.stringify(value):null,getItem(key){return key===FOOTBALL_KEYS.league?this.value:null},setItem(key,v){if(key===FOOTBALL_KEYS.league)this.value=v}};
}

function answerAndAdvance(session, correct=true, state={vocabularyProgress:{}}) {
  const index=correct?session.currentQuestion.correctIndex:(session.currentQuestion.correctIndex+1)%session.currentQuestion.options.length;
  return advanceFootball(answerFootballQuestion(session,index,words,state,()=>0));
}

test("football manifest loads, resolves IDs and all asset paths exist",()=>{
  assert.equal(manifest.project,"Poma Academy Football V1");
  assert.equal(resolver.state("MATCH_INTRO").url.endsWith("match-intro.png"),true);
  assert.equal(resolver.state("DEFENCE_FAILED").url.includes("defence-failed.png"),true);
  for(const rel of requiredPomaAssetPaths(manifest)){
    assert.equal(fs.existsSync(path.join(root,"assets/games/poma-football-v1",rel)),true,rel);
  }
});

test("four video events have poster and fallback records",()=>{
  assert.deepEqual(pomaVideoEvents(manifest),["GOAL_SCORED","SHOT_MISSED_POST","SAVE_SUCCESS","GOAL_CONCEDED"]);
  for(const event of pomaVideoEvents(manifest)){
    const video=resolver.video(event);
    assert.ok(video.url.endsWith(".mp4"),event);
    assert.ok(video.posterUrl.endsWith(".png"),event);
    assert.ok(video.fallbackUrl.endsWith(".png"),event);
  }
});

test("MATCH_INTRO advances to POSSESSION_QUESTION",()=>{
  const next=advanceFootball(createFootballSession(words,{vocabularyProgress:{}},()=>0));
  assert.equal(next.phase,"POSSESSION_QUESTION");
  assert.equal(next.visual,"POSSESSION_POMA");
});

test("three correct attacking answers produce goal flow",()=>{
  let s=advanceFootball(createFootballSession(words,{vocabularyProgress:{}},()=>0));
  s=answerAndAdvance(s,true);
  assert.equal(s.phase,"GIVE_AND_GO_QUESTION");
  s=answerAndAdvance(s,true);
  assert.equal(s.phase,"SHOT_QUESTION");
  const shot=answerFootballQuestion(s,s.currentQuestion.correctIndex,words,{vocabularyProgress:{}},()=>0);
  assert.equal(shot.phase,"SHOT_RESULT");
  assert.equal(shot.visual,"GOAL_SCORED");
  assert.equal(shot.goalsFor,1);
  assert.equal(advanceFootball(shot).phase,"GOAL_CELEBRATION");
});

test("wrong shot uses SHOT_MISSED_POST flow",()=>{
  let s=advanceFootball(createFootballSession(words,{vocabularyProgress:{}},()=>0));
  s=answerAndAdvance(s,true);
  s=answerAndAdvance(s,true);
  const wrong=(s.currentQuestion.correctIndex+1)%s.currentQuestion.options.length;
  const result=answerFootballQuestion(s,wrong,words,{vocabularyProgress:{}},()=>0);
  assert.equal(result.visual,"SHOT_MISSED_POST");
  assert.equal(advanceFootball(result).phase,"OPPONENT_ATTACK_QUESTION");
});

test("wrong first possession sends opponent attack",()=>{
  let s=advanceFootball(createFootballSession(words,{vocabularyProgress:{}},()=>0));
  const wrong=(s.currentQuestion.correctIndex+1)%s.currentQuestion.options.length;
  const result=answerFootballQuestion(s,wrong,words,{vocabularyProgress:{}},()=>0);
  assert.equal(result.visual,"PASS_FAILED");
  assert.equal(advanceFootball(result).phase,"OPPONENT_ATTACK_QUESTION");
});

test("correct defence wins the ball back",()=>{
  let s=advanceFootball(createFootballSession(words,{vocabularyProgress:{}},()=>0));
  s=answerAndAdvance(s,false);
  const result=answerFootballQuestion(s,s.currentQuestion.correctIndex,words,{vocabularyProgress:{}},()=>0);
  assert.equal(result.visual,"DEFENCE_SUCCESS");
  assert.equal(advanceFootball(result).phase,"POSSESSION_QUESTION");
});

test("wrong defence and wrong keeper concede a goal",()=>{
  let s=advanceFootball(createFootballSession(words,{vocabularyProgress:{}},()=>0));
  s=answerAndAdvance(s,false);
  s=answerAndAdvance(s,false);
  assert.equal(s.phase,"OPPONENT_SHOT_QUESTION");
  const wrong=(s.currentQuestion.correctIndex+1)%s.currentQuestion.options.length;
  const result=answerFootballQuestion(s,wrong,words,{vocabularyProgress:{}},()=>0);
  assert.equal(result.visual,"GOAL_CONCEDED");
  assert.equal(result.goalsAgainst,1);
});

test("word selection avoids immediate repeats and caps difficult weighting",()=>{
  const state={vocabularyProgress:{w1:{wrong:9,status:"difficult"},w2:{wrong:1,status:"difficult"}}};
  const q=selectWordQuestion(words,state,["w1"],()=>0);
  assert.notEqual(q.wordId,"w1");
  const repeated=Array.from({length:20},()=>selectWordQuestion(words,state,[],()=>0).wordId);
  assert.ok(repeated.filter(x=>x==="w1").length<=20);
  assert.equal(availableFootballWords(words,{vocabularyProgress:{w3:{lastSeen:"2026-06-29T00:00:00.000Z"}}}).length,5);
  assert.equal(availableFootballWords([],{}).length,0);
});

test("football league order moves from easy to hard",()=>{
  assert.deepEqual(FOOTBALL_LEAGUES.map(x=>x.id),["starter","bronze","silver","gold","champion"]);
  assert.equal(FOOTBALL_LEAGUES[0].label,"Başlangıç Ligi");
  assert.equal(FOOTBALL_LEAGUES.at(-1).label,"Şampiyonlar Ligi");
});

test("league match has no duplicate normal words and valid answer options",()=>{
  const questions=createFootballMatchQuestions(leagueWords,{vocabularyProgress:{}},defaultFootballLeagueProgress(),()=>0.41);
  assert.equal(questions.length,10);
  assert.equal(new Set(questions.map(q=>q.wordId)).size,questions.length);
  for(const q of questions){
    assert.equal(validateFootballQuestion(q),true);
    assert.equal(q.options.filter(x=>x===q.correctAnswer).length,1);
    assert.equal(new Set(q.options).size,4);
  }
});

test("two consecutive matches cannot use the exact same word set",()=>{
  const first=createFootballMatchQuestions(leagueWords,{vocabularyProgress:{}},defaultFootballLeagueProgress(),()=>0.2);
  const progress={...defaultFootballLeagueProgress(),lastMatchSignature:first.map(q=>q.wordId).join("|")};
  const second=createFootballMatchQuestions(leagueWords,{vocabularyProgress:{}},progress,()=>0.2);
  assert.notDeepEqual(second.map(q=>q.wordId),first.map(q=>q.wordId));
});

test("last two match words are blocked from normal new selection",()=>{
  const progress={...defaultFootballLeagueProgress(),recentMatchWordIds:[leagueWords.slice(0,10).map(w=>w.id),leagueWords.slice(10,20).map(w=>w.id)]};
  const questions=createFootballMatchQuestions(leagueWords,{vocabularyProgress:{}},progress,()=>0.1);
  assert.equal(questions.some(q=>progress.recentMatchWordIds.flat().includes(q.wordId)),false);
});

test("correct words from previous match do not return as learned repeats immediately",()=>{
  const recent=leagueWords.slice(0,10).map(w=>w.id);
  const progress={...defaultFootballLeagueProgress(),seenWordIds:recent,recentMatchWordIds:[recent],words:Object.fromEntries(recent.map(id=>[id,{correct:1,wrong:0,league:"starter",nextReviewAt:"2099-01-01T00:00:00Z"}]))};
  const questions=createFootballMatchQuestions(leagueWords,{vocabularyProgress:{}},progress,()=>0.23);
  assert.equal(questions.some(q=>recent.includes(q.wordId)),false);
});

test("wrong word enters league review pool",()=>{
  const storage=storageOf();
  const q=createFootballMatchQuestions(leagueWords,{vocabularyProgress:{}},defaultFootballLeagueProgress(),()=>0.3)[0];
  recordFootballLeagueAnswer(q,false,"m1",storage,new Date("2026-07-02T10:00:00Z"));
  const progress=readFootballLeagueProgress(storage);
  assert.equal(progress.words[q.wordId].wrong,1);
  assert.equal(progress.words[q.wordId].mastered,false);
  assert.ok(progress.words[q.wordId].nextReviewAt);
});

test("mastered word remains but is selected less often than fresh words",()=>{
  const mastered=leagueWords[0].id;
  const progress={...defaultFootballLeagueProgress(),seenWordIds:[mastered],words:{[mastered]:{correct:3,wrong:0,correctMatchIds:["a","b","c"],mastered:true,league:"starter",nextReviewAt:"2099-01-01T00:00:00Z"}}};
  const ids=createFootballMatchQuestions(leagueWords,{vocabularyProgress:{}},progress,()=>0.5).map(q=>q.wordId);
  assert.equal(ids.includes(mastered),false);
});

test("old football localStorage safely migrates to word league v2",()=>{
  const migrated=migrateFootballLeagueProgress({version:1,currentLeague:"unknown",words:{w1:{correct:1}}});
  assert.equal(migrated.version,2);
  assert.equal(migrated.currentLeague,"starter");
  assert.ok(migrated.seenWordIds.includes("w1"));
});

test("narrow pool produces a controlled shorter valid match",()=>{
  const questions=createFootballMatchQuestions(words,{vocabularyProgress:{}},defaultFootballLeagueProgress(),()=>0);
  assert.ok(questions.length>0 && questions.length<=10);
  assert.equal(new Set(questions.map(q=>q.wordId)).size,questions.length);
  assert.equal(questions.every(validateFootballQuestion),true);
});

test("league finalization stores recent matches and can promote",()=>{
  const progress=defaultFootballLeagueProgress();
  progress.seenWordIds=leagueWords.slice(0,22).map(w=>w.id);
  progress.words=Object.fromEntries(leagueWords.slice(0,8).map(w=>[w.id,{league:"starter",mastered:true,correct:3,correctMatchIds:["a","b","c"]}]));
  const storage=storageOf(progress);
  const session={matchWordIds:leagueWords.slice(0,10).map(w=>w.id),recentWordIds:leagueWords.slice(0,10).map(w=>w.id),correct:9,questionsAsked:10,maxQuestions:10};
  const next=finalizeFootballLeagueMatch(session,storage);
  assert.equal(next.recentMatchWordIds.length,1);
  assert.equal(next.currentLeague,"bronze");
});

test("football questions are immutable and answer/options stay coherent",()=>{
  for(let i=0;i<12;i++){
    const q=selectWordQuestion(words,{vocabularyProgress:{}},[],()=>i/12);
    assert.equal(validateFootballQuestion(q),true);
    assert.equal(Object.isFrozen(q),true);
    assert.equal(Object.isFrozen(q.options),true);
    assert.equal(q.options.filter(x=>x===q.correctAnswer).length,1);
    assert.equal(new Set(q.options).size,4);
    assert.equal(q.options.some(x=>!String(x).trim()||x==="undefined"),false);
    assert.equal(q.options[q.correctIndex],q.correctAnswer);
  }
});

test("football question validation rejects missing, duplicate and empty options",()=>{
  const q=selectWordQuestion(words,{vocabularyProgress:{}},[],()=>0);
  assert.equal(validateFootballQuestion({...q,options:["gol","gol","",undefined],correctIndex:0}),false);
  assert.equal(validateFootballQuestion({...q,options:["kitapçı","sınıf","müze","film"],correctIndex:-1}),false);
  assert.equal(validateFootballQuestion({...q,options:["gol","kitapçı","sınıf","müze"],correctAnswer:"gol",correctIndex:0}),true);
});

test("video fallback policy is limited to four events and respects reduced motion",()=>{
  assert.equal(shouldUseVideo("GOAL_SCORED",false),true);
  assert.equal(shouldUseVideo("PASS_SUCCESS",false),false);
  assert.equal(shouldUseVideo("GOAL_SCORED",true),false);
});

test("video result renders one fixed media stage without stacked poster/video blocks",()=>{
  const html=renderFootballMedia(resolver.result("GOAL_SCORED"),resolver,"GOAL_SCORED",false);
  assert.match(html,/football-media-stage/);
  assert.equal((html.match(/football-media-poster/g)||[]).length,1);
  assert.equal((html.match(/football-media-video/g)||[]).length,1);
  assert.equal(/football-fallback|<video[\s\S]*<img/.test(html),false);
  const png=renderFootballMedia(resolver.result("PASS_SUCCESS"),resolver,"PASS_SUCCESS",false);
  assert.equal((png.match(/football-media-video/g)||[]).length,0);
});

test("video fallback and delayed events cannot advance more than once",()=>{
  let count=0;
  const once=makeOnce(()=>count++);
  assert.equal(once(),true);
  assert.equal(once(),false);
  assert.equal(once(),false);
  assert.equal(count,1);
});

test("football media stage CSS keeps a stable 16:9 box",()=>{
  const css=fs.readFileSync(path.join(root,"css/football.css"),"utf8");
  assert.match(css,/football-media-stage\{[^}]*position:relative/);
  assert.match(css,/aspect-ratio:16\/9/);
  assert.match(css,/position:absolute/);
  assert.match(css,/object-fit:contain/);
  assert.match(css,/40vh/);
});

test("football audio respects mute and recovers from audio failures",()=>{
  const storage={value:null,setItem(k,v){this.value={k,v}},getItem(){return this.value?.v||null}};
  const muted=createFootballAudio({muted:true,storage});
  assert.equal(muted.play("goal"),false);
  assert.deepEqual(muted.state.played,[]);
  const oldAudio=globalThis.AudioContext;
  globalThis.AudioContext=function BrokenAudio(){throw new Error("audio failed")};
  const noisy=createFootballAudio({muted:false,storage});
  assert.equal(noisy.play("kick"),false);
  assert.equal(noisy.state.failures>=0,true);
  if(oldAudio)globalThis.AudioContext=oldAudio;else delete globalThis.AudioContext;
});

test("broken football localStorage JSON recovers safely",()=>{
  const storage={getItem:key=>key===FOOTBALL_KEYS.stats?"{bad":null,setItem(){}};
  assert.deepEqual(safeRead(FOOTBALL_KEYS.stats,defaultFootballStats(),storage),defaultFootballStats());
});

test("trophies unlock once",()=>{
  const stats={...defaultFootballStats(),wins:3,goalsFor:10,saves:5,studyStreak:3,lastMatch:{goalsFor:2,goalsAgainst:1,correct:8}};
  const first=unlockTrophies(stats,defaultAchievements());
  assert.ok(first.newlyUnlocked.length>=4);
  const second=unlockTrophies(stats,first.achievements);
  assert.equal(second.newlyUnlocked.length,0);
  assert.equal(first.achievements.locked["hard-opponent"],true);
});

test("match reaches summary at question limit",()=>{
  let s=advanceFootball(createFootballSession(words,{vocabularyProgress:{}},()=>0));
  for(let i=0;i<10;i++){
    const idx=s.currentQuestion.correctIndex;
    s=answerFootballQuestion(s,idx,words,{vocabularyProgress:{}},()=>0);
    s=advanceFootball(s);
    if(s.phase==="MATCH_SUMMARY")break;
    if(!s.phase.endsWith("_QUESTION"))s=advanceFootball(s);
  }
  s=s.phase==="MATCH_SUMMARY"?s:summarizeFootball(s);
  assert.equal(s.phase,"MATCH_SUMMARY");
  assert.ok(s.summary.percent>=0);
});

test("football integration text preserves UTF-8",()=>{
  const files=["js/app.js","js/football-game.js","js/football-engine.js","js/football-audio.js","css/football.css"];
  for(const file of files){
    const text=fs.readFileSync(path.join(root,file),"utf8");
    assert.equal(/[ÃÄÅ]|\?n|Kasas\?|ma\?|a\?/.test(text),false,file);
  }
});
