import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

globalThis.location={hash:"#/signup?partner=poma123"};
const router=await import("../js/router.js");
const attribution=await import("../js/partner-attribution.js");
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),"utf8");
const entry=read("js/payment-entry.js"),service=read("js/payment-service.js"),teacher=read("js/teacher-partner-entry.js"),build=read("scripts/build.js");
const memory=()=>{const data=new Map();return{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};

test("router separates query and preserves nested routes",()=>{assert.equal(router.getRoute(),"signup");assert.equal(router.getRouteParams().get("partner"),"poma123");for(const route of ["lesson/001","story/story-001","game/football","module-review/module-1"]){location.hash=`#/${route}`;assert.equal(router.getRoute(),route)}});
test("codes normalize and unsafe values are rejected",()=>{assert.equal(attribution.normalizePartnerCode(" poma123 "),"POMA123");for(const value of ["ab","A_B","A<script>","A".repeat(25)])assert.equal(attribution.normalizePartnerCode(value),"")});
test("session attribution expires after 24 hours",()=>{const store=memory(),now=1000,saved=attribution.savePartnerAttribution("poma123",store,now);assert.equal(saved.expiresAt,now+86400000);assert.equal(attribution.readPartnerAttribution(store,now+86399999).code,"POMA123");assert.equal(attribution.readPartnerAttribution(store,now+86400000),null);assert.doesNotMatch(read("js/partner-attribution.js"),/localStorage/)});
test("URL code requires validator approval before storage",async()=>{const store=memory();let calls=0;await attribution.capturePartnerAttribution(async()=>{calls++;return{valid:true}},new URLSearchParams("partner=bad_code"),store,10);assert.equal(calls,0);assert.equal(attribution.readPartnerAttribution(store,10),null);const saved=await attribution.capturePartnerAttribution(async code=>{calls++;assert.equal(code,"POMA123");return{valid:true}},new URLSearchParams("partner=poma123"),store,10);assert.equal(saved.code,"POMA123");assert.equal(calls,1)});
test("signup login and membership retain and surface invite",()=>{assert.match(entry,/\["signup","login"\]/);assert.match(entry,/Öğretmen davet kodu kaydedildi/);assert.match(entry,/capturePartnerAttribution/);assert.match(entry,/hydratePartnerCode/);assert.match(entry,/input\.value=invite\.code/)});
test("family plans send code and teacher plan cannot",()=>{assert.match(service,/FAMILY_MONTHLY/);assert.match(service,/FAMILY_YEARLY/);assert.match(service,/normalizePartnerCode/);assert.doesNotMatch(service,/TEACHER_MONTHLY[^\n]*p_partner_code/)});
test("only successful attributed requests consume stored code",()=>{const create=service.match(/async createPaymentRequest[\s\S]*?\n    },/)?.[0]||"";assert.match(create,/await client\.rpc/);assert.match(create,/if \(partnerCode\) clearPartnerAttribution/);assert.ok(create.indexOf("clearPartnerAttribution")>create.indexOf("await client.rpc"))});
test("failed request path contains no attribution clearing",()=>{assert.doesNotMatch(entry,/catch\(error\)[^\n]*clearPartnerAttribution/)});
test("price and analytics remain free of partner data",()=>{assert.match(read("js/payment-views.js"),/Partner kodu fiyatı değiştirmez/);assert.doesNotMatch(entry,/trackEvent\([^\n]*invite\.code|trackEvent\([^\n]*partnerCode/);assert.match(teacher,/trackEvent\("teacher_partner_code_copied",\{source:"teacher"\}\)/)});
test("teacher link and copy failure feedback remain",()=>{assert.match(teacher,/\$\{location\.origin\}\/\#\/signup\?partner=\$\{encodeURIComponent\(code\)\}/);assert.match(teacher,/Bağlantı kopyalanamadı/)});
test("module is built and Turkish text is intact",()=>{assert.match(build,/js\/partner-attribution\.js/);for(const text of [entry,service,teacher,read("js/partner-attribution.js")])assert.doesNotMatch(text,/Ã|Ä|Å|â€/)});
