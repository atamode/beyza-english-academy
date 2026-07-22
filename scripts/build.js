import fs from "node:fs";import path from "node:path";import crypto from "node:crypto";import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."),dist=path.join(root,"dist"),curriculum=JSON.parse(fs.readFileSync(path.join(root,"data/curriculum.json"),"utf8")),config=JSON.parse(fs.readFileSync(path.join(root,"data/app-config.json"),"utf8"));
const lessonFiles=curriculum.modules.flatMap(m=>m.lessons).filter(l=>l.status==="published").map(l=>l.file);
const reviewFiles=Object.values(config.moduleReviews||{});
function walk(dir){return fs.existsSync(path.join(root,dir))?fs.readdirSync(path.join(root,dir),{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0).flatMap(e=>{const p=path.join(dir,e.name).replace(/\\/g,"/");return e.isDirectory()?walk(p):[p]}):[]}
const textHashExtensions=new Set([".html",".css",".js",".json",".webmanifest",".svg",".md",".txt",".bat",".py"]);
function normalizeHashContent(filePath,buffer){if(!textHashExtensions.has(path.extname(filePath).toLowerCase()))return buffer;const bytes=[];for(let i=0;i<buffer.length;i++){if(buffer[i]===13){if(buffer[i+1]===10)i++;bytes.push(10)}else bytes.push(buffer[i])}return Buffer.from(bytes)}
const footballAssets=walk("assets/games/poma-football-v1");
const volleyballAssets=walk("assets/games/poma-volleyball-v1");
const storyAssets=walk("assets/stories");
const sportAudioAssets=walk("assets/audio");
const brandAssets=walk("assets/brand");
const base=["index.html","manifest.webmanifest","css/reset.css","css/variables.css","css/app.css","css/responsive.css","css/sprint2.css","css/quality.css","css/print.css","css/football.css","css/story.css","js/app.js","js/router.js","js/storage.js","js/account-config.js","js/account-storage.js","js/supabase-client.js","js/student-repository.js","js/teacher-repository.js","js/sync-engine.js","js/account-session.js","js/account-views.js","js/scoring.js","js/catalog.js","js/audio.js","js/accessibility.js","js/lesson-engine.js","js/diagnostic-engine.js","js/activity-renderers.js","js/parent-mode.js","js/review-engine.js","js/vocabulary-engine.js","js/poma-assets.js","js/volleyball-assets.js","js/sport-media.js","js/football-engine.js","js/football-audio.js","js/football-game.js","js/volleyball-engine.js","js/volleyball-game.js","js/story-engine.js","js/story-view.js","data/app-config.json","data/curriculum.json","data/diagnostic-test.json",...reviewFiles,"data/vocabulary.json","data/stories/story-001.json","assets/icons/icon.svg",...footballAssets,...volleyballAssets,...storyAssets,...sportAudioAssets,...brandAssets,...lessonFiles];
base.splice(base.indexOf("css/print.css"), 0, "css/profile-menu.css");
base.splice(base.indexOf("css/print.css"), 0, "css/payment.css");
base.splice(base.indexOf("css/print.css"), 0, "css/pricing.css");
base.splice(base.indexOf("css/print.css"), 0, "css/learning-reports.css");
base.splice(base.indexOf("css/print.css"), 0, "css/parent-dashboard.css");
base.splice(base.indexOf("css/print.css"), 0, "css/teacher-partner.css");
base.splice(base.indexOf("js/student-repository.js"), 0, "js/payment-config.js", "js/payment-service.js", "js/payment-views.js", "js/partner-attribution.js", "js/payment-entry.js");
base.splice(base.indexOf("js/student-repository.js"), 0, "js/analytics.js", "js/analytics-consent.js", "js/pricing-state.js", "js/pricing-views.js", "js/pricing-entry.js");
base.splice(base.indexOf("js/student-repository.js"), 0, "js/report-periods.js", "js/learning-report-service.js", "js/learning-report-views.js", "js/learning-report-entry.js");
base.splice(base.indexOf("js/football-engine.js"), 0, "js/sport-question-engine.js");
base.splice(base.indexOf("js/learning-report-entry.js"), 0, "js/parent-dashboard-service.js", "js/parent-dashboard-views.js");
base.splice(base.indexOf("js/student-repository.js"), 0, "js/teacher-partner-service.js", "js/teacher-partner-views.js", "js/admin-audit-view.js", "js/teacher-partner-entry.js");
const duplicateFiles=[...new Set(base.filter((file,index)=>base.indexOf(file)!==index))];
if(duplicateFiles.length)throw new Error(`Build listesinde yinelenen dosyalar: ${duplicateFiles.join(", ")}`);
for(const f of base)if(!fs.existsSync(path.join(root,f)))throw new Error(`Build dosyası eksik: ${f}`);
const fingerprint=crypto.createHash("sha256");for(const f of base){const content=normalizeHashContent(f,fs.readFileSync(path.join(root,f)));fingerprint.update(f,"utf8");fingerprint.update("\0");fingerprint.update(String(content.length),"utf8");fingerprint.update("\0");fingerprint.update(content);fingerprint.update("\0")}const version=fingerprint.digest("hex").slice(0,12);
const heavyMediaPrefixes=["assets/games/","assets/stories/","assets/audio/","assets/brand/"];
const precache=["./",...base.filter(f=>!heavyMediaPrefixes.some(prefix=>f.startsWith(prefix)))];
const sw=`const CACHE="beyza-english-${version}";\nconst ASSETS=${JSON.stringify(precache,null,2)};\nself.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));\nself.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));\nself.addEventListener("message",e=>{if(e.data?.type==="SKIP_WAITING")self.skipWaiting()});\nself.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;const u=new URL(e.request.url);if(u.origin!==self.location.origin){e.respondWith(fetch(e.request));return}e.respondWith(caches.match(e.request).then(x=>x||fetch(e.request).then(r=>{if(!r||!r.ok)return r;const q=r.clone();caches.open(CACHE).then(c=>c.put(e.request,q));return r}).catch(()=>e.request.mode==="navigate"?caches.match("index.html"):Response.error())))});\n`;
fs.writeFileSync(path.join(root,"service-worker.js"),sw,"utf8");fs.mkdirSync(dist,{recursive:true});for(const x of fs.readdirSync(dist))fs.rmSync(path.join(dist,x),{recursive:true,force:true});
for(const f of [...base,"service-worker.js","START_APP.bat","server.py","server.js","README_KULLANIM.md"]){const src=path.join(root,f),dst=path.join(dist,f);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst)}
console.log(`Build ${version}: ${lessonFiles.length} ders, ${precache.length} başlangıç önbelleği, ${base.length-precache.length+1} isteğe bağlı medya.`);
