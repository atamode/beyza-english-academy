import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { trackEvent } from "../js/analytics.js";
import { annualSaving, pricingErrorView, pricingPlansView } from "../js/pricing-views.js";
import { consumePricingSelection, readPricingSelection, savePricingSelection } from "../js/pricing-state.js";

const plans=[
  {code:"FREE_STARTER",name:"Ücretsiz Başlangıç",price:0,duration_days:null,child_limit:1,active:true},
  {code:"FAMILY_MONTHLY",name:"Aile Aylık",price:320,duration_days:30,child_limit:2,active:true},
  {code:"FAMILY_YEARLY",name:"Aile Yıllık",price:3000,duration_days:365,child_limit:2,active:true}
];
const entry=fs.readFileSync(new URL("../js/pricing-entry.js",import.meta.url),"utf8");
const distEntry=fs.readFileSync(new URL("../dist/js/pricing-entry.js",import.meta.url),"utf8");
const appSource=fs.readFileSync(new URL("../js/app.js",import.meta.url),"utf8");
const distAppSource=fs.readFileSync(new URL("../dist/js/app.js",import.meta.url),"utf8");
const paymentEntry=fs.readFileSync(new URL("../js/payment-entry.js",import.meta.url),"utf8");
const pricingSource=fs.readFileSync(new URL("../js/pricing-views.js",import.meta.url),"utf8");
const analyticsSource=fs.readFileSync(new URL("../js/analytics.js",import.meta.url),"utf8");
const publicPricingMigration=fs.readFileSync(new URL("../supabase/migrations/20260721000200_restore_public_pricing_visibility.sql",import.meta.url),"utf8");
const memory=()=>{const map=new Map();return{setItem:(k,v)=>map.set(k,v),getItem:k=>map.get(k)||null,removeItem:k=>map.delete(k)}};

test("landing pricing loads live plan fields through listPlans without hard-coded prices",()=>{const service=fs.readFileSync(new URL("../js/payment-service.js",import.meta.url),"utf8");assert.match(entry,/payments\.listPlans\(\)/);assert.match(service,/name,price,duration_days,child_limit,active/);assert.doesNotMatch(entry,/299|1990|1\.990/);assert.doesNotMatch(pricingSource,/299|1990|1\.990/);});
test("legacy landing payment block is absent from source and dist",()=>{for(const source of [appSource,distAppSource]){assert.doesNotMatch(source,/landing-payment-section|payment_instagram_click|payment_signup_click|copy_iban_click|data-copy-value/);assert.doesNotMatch(source,/TR81\s*0006\s*2001\s*1470\s*0006\s*6804\s*17/);}});
test("pricing is inserted directly after the landing hero",()=>{for(const source of [entry,distEntry]){assert.match(source,/getRoute\(\)!=="home"\|\|app\.querySelector\("\[data-pricing-section\]"\)/);assert.match(source,/app\.querySelector\("\.seo-landing \.landing-hero"\)/);assert.match(source,/anchor\.insertAdjacentElement\("afterend",section\)/);assert.doesNotMatch(source,/account-auth/);}});
test("changed source and dist runtime files are identical",()=>{assert.equal(entry,distEntry);assert.equal(appSource,distAppSource);});
test("three plans render with correct Turkish names and accessible CTAs",()=>{const html=pricingPlansView(plans);for(const label of ["Ücretsiz Başlangıç","Aile Aylık","Aile Yıllık","Ücretsiz Başla","Aylık Üyeliği Seç","Yıllık Üyeliği Seç"])assert.match(html,new RegExp(label));assert.equal((html.match(/data-pricing-plan=/g)||[]).length,3);});
test("FREE_STARTER never enters paid selection state",()=>{const storage=memory();assert.equal(savePricingSelection("FREE_STARTER",storage,100),false);assert.equal(readPricingSelection(storage,100),null);assert.match(entry,/if\(planCode==="FREE_STARTER"\)[\s\S]{0,180}navigate\("signup"\)/);});
test("monthly and yearly CTA selections survive briefly and are consumed once",()=>{for(const code of ["FAMILY_MONTHLY","FAMILY_YEARLY"]){const storage=memory();assert.equal(savePricingSelection(code,storage,100),true);assert.equal(readPricingSelection(storage,101),code);assert.equal(consumePricingSelection(storage,101),code);assert.equal(readPricingSelection(storage,101),null);}});
test("selected paid plan continues to membership after authentication",()=>{assert.match(entry,/readPricingSelection\(\)[\s\S]{0,300}navigate\("membership"\)/);assert.match(paymentEntry,/consumePricingSelection\(\)/);assert.match(paymentEntry,/if\(selectedPlan\)openPlanSelection\(selectedPlan\)/);});
test("active members are told purchased time will be added",()=>{assert.match(paymentEntry,/Mevcut üyeliğinize süre eklenecektir\./);assert.match(paymentEntry,/screen\.subscription/);});
test("annual advantage is calculated from live monthly and yearly prices",()=>{assert.equal(annualSaving(plans),840);assert.match(pricingPlansView(plans),/₺840,00|840,00\s*₺/);assert.doesNotMatch(pricingSource,/\d+%/);});
test("plan load failure shows no fake price and offers retry",()=>{const html=pricingErrorView();assert.match(html,/Planlar şu anda yüklenemedi/);assert.match(html,/Tekrar dene/);assert.doesNotMatch(html,/bağlantınızı kontrol|₺|TL|299|1\.990/);});
test("public pricing grants read-only access to active plans and preserves admin reads",()=>{assert.match(publicPricingMigration,/grant select on table public\.plans to anon, authenticated/);assert.match(publicPricingMigration,/revoke insert, update, delete[\s\S]*from anon, authenticated/);assert.match(publicPricingMigration,/for select\s+to anon, authenticated\s+using \(active = true\)/);assert.match(publicPricingMigration,/for select\s+to authenticated\s+using \(public\.is_poma_admin\(\)\)/);assert.doesNotMatch(publicPricingMigration,/\b(?:insert into|update public\.plans|delete from)\b/i);});
test("analytics allowlist strips personal and payment data",()=>{let call;const target={gtag:(...args)=>{call=args}};assert.equal(trackEvent("pricing_plan_selected",{plan_code:"FAMILY_MONTHLY",source:"landing",email:"x@example.com",uuid:"u",iban:"TR",payment_code:"POMA-X"},target),true);assert.deepEqual(call,["event","pricing_plan_selected",{plan_code:"FAMILY_MONTHLY",source:"landing"}]);for(const banned of ["email","username","uuid","iban","receipt","payment_code","signed","admin_note"])assert.doesNotMatch(analyticsSource,new RegExp(`PARAMS[^;]*${banned}`,"i"));});
test("CTA flow remains functional when analytics is unavailable",()=>{assert.equal(trackEvent("pricing_plan_selected",{plan_code:"FAMILY_YEARLY"},{}),false);assert.match(entry,/trackEvent\("pricing_plan_selected"[\s\S]{0,500}navigate\(/);});
test("landing pricing never exposes bank IBAN",()=>{for(const source of [entry,pricingSource])assert.doesNotMatch(source,/TR280006200129200006643010|PAYMENT_INSTRUCTIONS|\bIBAN\b/);});
test("responsive pricing keeps cards and CTAs usable at target widths",()=>{const css=fs.readFileSync(new URL("../css/pricing.css",import.meta.url),"utf8");assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);assert.match(css,/@media\(max-width:820px\)\{\.landing-pricing-grid\{grid-template-columns:1fr\}/);assert.match(css,/\.landing-pricing-card \.button\{[^}]*width:100%/);});
