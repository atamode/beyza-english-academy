import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
import {createVolleyballManifestResolver, requiredVolleyballAssetPaths, volleyballVideoEvents} from "../js/volleyball-assets.js";
import {renderVolleyballMedia, VOLLEYBALL_AUTO_ADVANCE, volleyballResultDelayMs} from "../js/volleyball-game.js";
import {FOOTBALL_KEYS, recordFootballLeagueAnswer, readFootballLeagueProgress, finalizeFootballLeagueMatch} from "../js/football-engine.js";
import {VOLLEYBALL_KEYS, createVolleyballSession, advanceVolleyball, answerVolleyballQuestion, validateVolleyballQuestion, summarizeVolleyball, mergeVolleyballStats, defaultVolleyballStats, volleyballResultType} from "../js/volleyball-engine.js";
import {createSportAudioManager, SPORT_MUSIC_URL} from "../js/football-audio.js";

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
function sha(file){return crypto.createHash("sha256").update(fs.readFileSync(path.join(root,file))).digest("hex");}
function mp4DurationSeconds(file){
  const buf=fs.readFileSync(path.join(root,file));
  const idx=buf.indexOf(Buffer.from("mvhd"));
  assert.ok(idx>4, `${file} should contain mvhd metadata`);
  const version=buf[idx+4];
  const timescale=version===1?buf.readUInt32BE(idx+28):buf.readUInt32BE(idx+16);
  const duration=version===1?Number(buf.readBigUInt64BE(idx+32)):buf.readUInt32BE(idx+20);
  return duration/timescale;
}

class MockAudio {
  static instances=[];
  constructor(src){this.src=src;this.loop=false;this.volume=1;this.preload="";this.muted=false;this.paused=true;this.playCount=0;MockAudio.instances.push(this);}
  play(){this.paused=false;this.playCount++;return Promise.resolve();}
  pause(){this.paused=true;}
}

test("volleyball manifest resolves all result videos and asset paths",()=>{
  assert.equal(manifest.id,"poma-volleyball-v1");
  assert.deepEqual(volleyballVideoEvents(manifest).sort(),["conceded","defenceSuccess","lose","saveSuccess","shotMissed","shotSuccess","win"].sort());
  for(const rel of requiredVolleyballAssetPaths(manifest)){
    assert.equal(fs.existsSync(path.join(root,"assets/games/poma-volleyball-v1",rel)),true,rel);
  }
  assert.match(resolver.result("shotSuccess").posterUrl,/volleyball-spike-success-poster\.webp$/);
  assert.match(resolver.video("conceded").url,/volleyball-point-conceded\.mp4$/);
});

test("volleyball events use semantic videos and only documented aliases share files",()=>{
  const expected={
    saveSuccess:"03-videos/volleyball-receive-success.mp4",
    shotSuccess:"03-videos/volleyball-spike-success.mp4",
    shotMissed:"03-videos/volleyball-spike-missed.mp4",
    defenceSuccess:"03-videos/volleyball-block-success.mp4",
    conceded:"03-videos/volleyball-point-conceded.mp4",
    win:"02-results/volleyball-set-win.mp4",
    lose:"02-results/volleyball-set-lose.mp4"
  };
  for(const [event,file] of Object.entries(expected)) assert.equal(manifest.events[event].video,file,event);
  assert.equal(manifest.events.passSuccess.video,undefined);
  assert.equal(manifest.events.serveSuccess.video,undefined);
  assert.equal(manifest.events.passFailed.video,undefined);
  const byVideo={};
  for(const [event,row] of Object.entries(manifest.events)){
    if(!row.video) continue;
    (byVideo[row.video]||=[]).push(event);
  }
  for(const [video,events] of Object.entries(byVideo)){
    if(events.length<2) continue;
    assert.deepEqual(manifest.documentedAliases?.[video]?.events?.sort(),events.sort(),`${video} alias must be documented`);
  }
});

test("volleyball deploy MP4 files match dist hashes and final videos keep real duration",()=>{
  for(const event of volleyballVideoEvents(manifest)){
    const rel=`assets/games/poma-volleyball-v1/${manifest.events[event].video}`;
    const dist=`dist/${rel}`;
    assert.equal(fs.existsSync(path.join(root,dist)),true,dist);
    assert.equal(sha(rel),sha(dist),`${event} source and dist hash`);
  }
  assert.ok(mp4DurationSeconds("assets/games/poma-volleyball-v1/02-results/volleyball-set-win.mp4")>=9.5);
  assert.ok(mp4DurationSeconds("assets/games/poma-volleyball-v1/02-results/volleyball-set-lose.mp4")>=9.5);
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
  assert.equal(s.phase,"SERVE_QUESTION");
  s=answerVolleyballQuestion(s,s.currentQuestion.correctIndex,words,{},()=>0.2);
  assert.equal(s.visual,"serveSuccess");
  s=advanceVolleyball(s);
  assert.equal(s.phase,"PASS_QUESTION");
  s=answerVolleyballQuestion(s,s.currentQuestion.correctIndex,words,{},()=>0.3);
  assert.equal(s.visual,"passSuccess");
  s=advanceVolleyball(s);
  assert.equal(s.phase,"SPIKE_QUESTION");
  s=answerVolleyballQuestion(s,s.currentQuestion.correctIndex,words,{},()=>0.4);
  assert.equal(s.visual,"shotSuccess");
  assert.equal(s.pointsFor,1);
  let missed=createVolleyballSession(words,{vocabularyProgress:{}},()=>0.22,storageOf());
  missed=advanceVolleyball(missed);
  missed=answerVolleyballQuestion(missed,missed.currentQuestion.correctIndex,words,{},()=>0.2);
  missed=advanceVolleyball(missed);
  missed=answerVolleyballQuestion(missed,missed.currentQuestion.correctIndex,words,{},()=>0.3);
  missed=advanceVolleyball(missed);
  missed=answerVolleyballQuestion(missed,(missed.currentQuestion.correctIndex+1)%4,words,{},()=>0.4);
  assert.equal(missed.visual,"shotMissed");
  assert.equal(missed.blocks,0);

  let d=createVolleyballSession(words,{vocabularyProgress:{}},()=>0.41,storageOf());
  d=advanceVolleyball(d);
  d=answerVolleyballQuestion(d,(d.currentQuestion.correctIndex+1)%4,words,{},()=>0.4);
  assert.equal(d.phase,"RECEIVE_QUESTION");
  d=answerVolleyballQuestion(d,d.currentQuestion.correctIndex,words,{},()=>0.5);
  assert.equal(d.visual,"saveSuccess");
  d=advanceVolleyball(d);
  assert.equal(d.phase,"PASS_QUESTION");
  d=answerVolleyballQuestion(d,(d.currentQuestion.correctIndex+1)%4,words,{},()=>0.6);
  assert.equal(d.visual,"passFailed");
  d=advanceVolleyball(d);
  d=answerVolleyballQuestion(d,(d.currentQuestion.correctIndex+1)%4,words,{},()=>0.7);
  d=answerVolleyballQuestion(d,(d.currentQuestion.correctIndex+1)%4,words,{},()=>0.8);
  assert.equal(d.visual,"conceded");
  assert.equal(d.pointsAgainst,1);
  let block=createVolleyballSession(words,{vocabularyProgress:{}},()=>0.45,storageOf());
  block=advanceVolleyball(block);
  block=answerVolleyballQuestion(block,(block.currentQuestion.correctIndex+1)%4,words,{},()=>0.4);
  block=answerVolleyballQuestion(block,(block.currentQuestion.correctIndex+1)%4,words,{},()=>0.5);
  block=answerVolleyballQuestion(block,block.currentQuestion.correctIndex,words,{},()=>0.6);
  assert.equal(block.visual,"defenceSuccess");
  assert.equal(block.blocks,1);
});

test("volleyball final result uses win lose draw consistently",()=>{
  const base=createVolleyballSession(words,{vocabularyProgress:{}},()=>0.1,storageOf());
  const win=summarizeVolleyball({...base,questionsAsked:base.maxQuestions,pointsFor:3,pointsAgainst:1,correct:8,wrong:2});
  assert.equal(volleyballResultType(win),"win");
  assert.equal(win.phase,"FINAL_VIDEO");
  assert.equal(win.visual,"win");
  assert.equal(advanceVolleyball(win).phase,"MATCH_SUMMARY");
  const lose=summarizeVolleyball({...base,questionsAsked:base.maxQuestions,pointsFor:1,pointsAgainst:3,correct:3,wrong:7});
  assert.equal(lose.phase,"FINAL_VIDEO");
  assert.equal(lose.visual,"lose");
  const draw=summarizeVolleyball({...base,questionsAsked:base.maxQuestions,pointsFor:2,pointsAgainst:2,correct:5,wrong:5});
  assert.equal(draw.summary.resultType,"draw");
  assert.equal(draw.phase,"MATCH_SUMMARY");
  assert.equal(draw.visual,"MATCH_INTRO");
  const stats=mergeVolleyballStats(defaultVolleyballStats(),draw);
  assert.equal(stats.wins,0);
});

test("volleyball attack chain requires serve, pass and spike questions",()=>{
  let s=createVolleyballSession(words,{vocabularyProgress:{}},()=>0.2,storageOf());
  s=advanceVolleyball(s);
  assert.equal(s.phase,"SERVE_QUESTION");
  s=answerVolleyballQuestion(s,s.currentQuestion.correctIndex,words,{},()=>0.21);
  assert.equal(s.visual,"serveSuccess");
  s=advanceVolleyball(s);
  assert.equal(s.phase,"PASS_QUESTION","serve success must not jump directly to spike");
  s=answerVolleyballQuestion(s,s.currentQuestion.correctIndex,words,{},()=>0.22);
  assert.equal(s.visual,"passSuccess");
  s=advanceVolleyball(s);
  assert.equal(s.phase,"SPIKE_QUESTION");
});

test("volleyball pass and receive branches return to the intended flow",()=>{
  let passWrong=createVolleyballSession(words,{vocabularyProgress:{}},()=>0.31,storageOf());
  passWrong=advanceVolleyball(passWrong);
  passWrong=answerVolleyballQuestion(passWrong,passWrong.currentQuestion.correctIndex,words,{},()=>0.32);
  passWrong=advanceVolleyball(passWrong);
  passWrong=answerVolleyballQuestion(passWrong,(passWrong.currentQuestion.correctIndex+1)%4,words,{},()=>0.33);
  assert.equal(passWrong.visual,"passFailed");
  passWrong=advanceVolleyball(passWrong);
  assert.equal(passWrong.phase,"RECEIVE_QUESTION");

  let receiveCorrect=createVolleyballSession(words,{vocabularyProgress:{}},()=>0.41,storageOf());
  receiveCorrect=advanceVolleyball(receiveCorrect);
  receiveCorrect=answerVolleyballQuestion(receiveCorrect,(receiveCorrect.currentQuestion.correctIndex+1)%4,words,{},()=>0.42);
  assert.equal(receiveCorrect.phase,"RECEIVE_QUESTION");
  receiveCorrect=answerVolleyballQuestion(receiveCorrect,receiveCorrect.currentQuestion.correctIndex,words,{},()=>0.43);
  assert.equal(receiveCorrect.visual,"saveSuccess");
  receiveCorrect=advanceVolleyball(receiveCorrect);
  assert.equal(receiveCorrect.phase,"PASS_QUESTION");
});

test("volleyball poster-only and video-only media policy is enforced",()=>{
  assert.equal(resolver.video("serveSuccess"),null);
  assert.equal(resolver.video("passSuccess"),null);
  assert.equal(resolver.video("passFailed"),null);
  assert.match(resolver.video("saveSuccess").url,/volleyball-receive-success\.mp4$/);
  assert.match(resolver.video("shotSuccess").url,/volleyball-spike-success\.mp4$/);
  assert.match(resolver.video("shotMissed").url,/volleyball-spike-missed\.mp4$/);
  assert.match(resolver.video("defenceSuccess").url,/volleyball-block-success\.mp4$/);
  assert.match(resolver.video("conceded").url,/volleyball-point-conceded\.mp4$/);
});

test("volleyball summarizes safely when the last answer would otherwise enter a new question phase",()=>{
  let s=createVolleyballSession(words,{vocabularyProgress:{}},()=>0.3,storageOf());
  s={...s,maxQuestions:1,matchQuestions:s.matchQuestions.slice(0,1),matchWordIds:s.matchWordIds.slice(0,1)};
  s=advanceVolleyball(s);
  s=answerVolleyballQuestion(s,(s.currentQuestion.correctIndex+1)%4,words,{},()=>0.4);
  assert.notEqual(s.phase,"RECEIVE_QUESTION");
  assert.equal(["FINAL_VIDEO","MATCH_SUMMARY"].includes(s.phase),true);
  assert.equal(s.currentQuestion,null);
});

test("shared sport audio uses the real MP3 loop after user interaction",()=>{
  MockAudio.instances=[];
  const audio=createSportAudioManager({muted:false,AudioClass:MockAudio,storage:storageOf()});
  assert.equal(audio.state.musicUrl,SPORT_MUSIC_URL);
  assert.equal(audio.state.musicStarted,false);
  assert.equal(MockAudio.instances.length,0);
  audio.startAmbient();
  assert.equal(MockAudio.instances.length,1);
  assert.equal(MockAudio.instances[0].src,SPORT_MUSIC_URL);
  assert.equal(MockAudio.instances[0].loop,true);
  assert.equal(MockAudio.instances[0].volume,0.22);
  assert.equal(MockAudio.instances[0].playCount,1);
  assert.equal(audio.state.ambientWanted,true);
  audio.setMuted(true);
  assert.equal(MockAudio.instances[0].paused,true);
  audio.setMuted(false);
  assert.equal(MockAudio.instances[0].paused,false);
  assert.equal(MockAudio.instances[0].playCount,2);
});

test("sport audio ducks for video, restores, and global mute updates the active video immediately",()=>{
  MockAudio.instances=[];
  const audio=createSportAudioManager({muted:false,AudioClass:MockAudio,storage:storageOf()});
  audio.startAmbient();
  const video={muted:false};
  audio.duckForVideo(video,{resume:true});
  assert.equal(MockAudio.instances[0].volume,0.06);
  assert.equal(video.muted,false);
  audio.setMuted(true);
  assert.equal(video.muted,true);
  assert.equal(MockAudio.instances[0].paused,true);
  audio.setMuted(false);
  assert.equal(video.muted,false);
  audio.restoreAfterVideo({resume:true});
  assert.equal(MockAudio.instances[0].volume,0.22);
  assert.equal(MockAudio.instances[0].paused,false);
  audio.duckForVideo(video,{resume:false});
  assert.equal(MockAudio.instances[0].paused,true);
  audio.restoreAfterVideo({resume:false});
  assert.equal(MockAudio.instances[0].paused,true);
});

test("football and volleyball presenters listen for live sound changes on active videos",()=>{
  const football=fs.readFileSync(path.join(root,"js/football-game.js"),"utf8");
  const volleyball=fs.readFileSync(path.join(root,"js/volleyball-game.js"),"utf8");
  for(const source of [football,volleyball]){
    assert.match(source,/beyza-sound-change/);
    assert.match(source,/video\.muted = Boolean\(e\.detail\?\.muted\)/);
    assert.match(source,/video\.muted = true/);
    assert.match(source,/retry\.catch\(fail\)/);
    assert.match(source,/removeEventListener\("beyza-sound-change", syncVideoMute\)/);
  }
});

test("volleyball final videos are not skipped by short ready timeout or stalled events",()=>{
  const source=fs.readFileSync(path.join(root,"js/volleyball-game.js"),"utf8");
  assert.match(source,/const readyTimeoutMs = finalVideo \? 15000 : VOLLEYBALL_CONFIG\.videoReadyTimeoutMs/);
  assert.match(source,/video\.addEventListener\("loadedmetadata", metadata/);
  assert.doesNotMatch(source,/addEventListener\("stalled", fail/);
  assert.match(source,/if \(!finalVideo && !skipButtonTimer\) skipButtonTimer = setTimeout/);
  assert.doesNotMatch(source,/if \(finalVideo && !timer\) timer = setTimeout/);
  assert.match(source,/hardStop = setTimeout\(go, Math\.max\(15000, duration\)\)/);
});

test("volleyball poster results auto-advance with correct and wrong durations",()=>{
  assert.equal(VOLLEYBALL_AUTO_ADVANCE.correctPosterMs,1300);
  assert.equal(VOLLEYBALL_AUTO_ADVANCE.wrongPosterMs,2800);
  assert.equal(volleyballResultDelayMs({visual:"serveSuccess",lastResult:{correct:true}}),1300);
  assert.equal(volleyballResultDelayMs({visual:"passFailed",lastResult:{correct:false}}),2800);
  assert.equal(volleyballResultDelayMs({visual:"lose"}),2800);
});

test("volleyball continue button can advance early and shares the single transition lock",()=>{
  const source=fs.readFileSync(path.join(root,"js/volleyball-game.js"),"utf8");
  assert.match(source,/const go = makeOnce/);
  assert.match(source,/continueButton\?\.addEventListener\("click", go\)/);
  assert.match(source,/continueButton\?\.removeAttribute\("hidden"\)/);
  assert.match(source,/clearTimeout\(timer\); clearTimeout\(hardStop\); clearTimeout\(readyTimer\); clearTimeout\(minPosterTimer\); clearTimeout\(skipButtonTimer\)/);
  assert.match(source,/Hemen Devam Et/);
});

test("volleyball poster timer uses longer wrong delay and does not require the button",()=>{
  const source=fs.readFileSync(path.join(root,"js/volleyball-game.js"),"utf8");
  assert.match(source,/const autoDelay = volleyballResultDelayMs\(session\)/);
  assert.match(source,/timer = setTimeout\(go, autoDelay\)/);
  assert.doesNotMatch(source,/VOLLEYBALL_CONFIG\.resultDelayMs/);
});

test("volleyball video ended is the automatic transition while video playback suppresses poster timer",()=>{
  const source=fs.readFileSync(path.join(root,"js/volleyball-game.js"),"utf8");
  assert.match(source,/video\.addEventListener\("ended", go, \{ once: true \}\)/);
  assert.match(source,/const playing = \(\) => \{ videoStarted = true; clearTimeout\(readyTimer\); \}/);
  assert.match(source,/if \(videoStarted && !video\.ended && !video\.error\) return/);
  assert.doesNotMatch(source,/video\.addEventListener\("stalled", fail/);
});

test("volleyball video error falls back to poster and auto-advances by result type",()=>{
  const source=fs.readFileSync(path.join(root,"js/volleyball-game.js"),"utf8");
  assert.match(source,/video\.addEventListener\("error", fail, \{ once: true \}\)/);
  assert.match(source,/showPoster\(\)/);
  assert.match(source,/if \(!timer\) timer = setTimeout\(go, autoDelay\)/);
});

test("volleyball win and lose videos wait for ended before summary",()=>{
  const source=fs.readFileSync(path.join(root,"js/volleyball-game.js"),"utf8");
  assert.match(source,/const finalVideo = session\.phase === "FINAL_VIDEO"/);
  assert.doesNotMatch(source,/finalVideo && !timer/);
  assert.match(source,/video\.addEventListener\("ended", go/);
  assert.match(source,/if \(videoStarted && !video\.ended && !video\.error\) return/);
});

test("volleyball state changes clean old timers and delayed video listeners",()=>{
  const source=fs.readFileSync(path.join(root,"js/volleyball-game.js"),"utf8");
  assert.match(source,/cleanup\(\);\s+cleanup = \(\) => \{\}/);
  assert.match(source,/mediaToken\+\+/);
  assert.match(source,/video\.removeEventListener\("ended", go\)/);
  assert.match(source,/video\.removeEventListener\("error", fail\)/);
  assert.match(source,/video\.removeEventListener\("playing", playing\)/);
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
  for(const event of ["shotSuccess","shotMissed","conceded","win","lose"]){
    const html=renderVolleyballMedia(resolver.result(event),resolver,event,false);
    assert.equal((html.match(/football-media-stage/g)||[]).length,1,event);
    assert.equal((html.match(/football-media-poster/g)||[]).length,1,event);
    assert.equal((html.match(/football-media-video/g)||[]).length,1,event);
    assert.equal(/<img[\s\S]*<\/div>[\s\S]*<video/.test(html),false,event);
    assert.match(html,new RegExp(resolver.video(event).url.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")),event);
  }
  const png=renderVolleyballMedia(resolver.state("possession"),resolver,"possession",false);
  assert.equal((png.match(/football-media-video/g)||[]).length,0);
});
