import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { SUPABASE_CONFIG } from "../js/account-config.js";

function loadEnv(path) {
  const env = {};
  for (const raw of fs.readFileSync(path,"utf8").split(/\r?\n/)) {
    const line=raw.trim(); if(!line||line.startsWith("#")||!line.includes("="))continue;
    const i=line.indexOf("="); let value=line.slice(i+1).trim();
    if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
    env[line.slice(0,i).trim()]=value;
  }
  return env;
}

const env=loadEnv(new URL("../.env.rls.local",import.meta.url));
const base=SUPABASE_CONFIG.url.replace(/\/$/,"");
const key=SUPABASE_CONFIG.publishableKey;

async function request(path,{token,method="GET",body}={}){
  const response=await fetch(`${base}${path}`,{method,headers:{apikey:key,Authorization:`Bearer ${token||key}`,...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined});
  const text=await response.text();let data=null;if(text){try{data=JSON.parse(text);}catch{}}
  return {ok:response.ok,status:response.status,data};
}
async function login(email,password){const result=await request("/auth/v1/token?grant_type=password",{method:"POST",body:{email,password}});assert.equal(result.ok,true,"Canlı test hesabı oturum açamadı");return result.data.access_token;}
const rpc=(token)=>request("/rest/v1/rpc/list_admin_payments",{token,method:"POST",body:{}});

test("live admin payment RPC authorization and result contract",async t=>{
  const adminToken=await login(env.RLS_ADMIN_EMAIL,env.RLS_ADMIN_PASSWORD);
  const userToken=await login(env.RLS_USER_A_EMAIL,env.RLS_USER_A_PASSWORD);

  await t.test("admin JWT can call list_admin_payments",async()=>{
    const result=await rpc(adminToken);assert.equal(result.ok,true);assert.ok(Array.isArray(result.data));assert.ok(result.data.length>0,"Canlı projede doğrulanacak ödeme kaydı yok");
    for(const row of result.data){
      assert.match(row.user_email,/^[^@\s]+@[^@\s]+$/);assert.match(row.payment_code,/^POMA-[A-F0-9]{6}$/);
      assert.ok(["FREE_STARTER","FAMILY_MONTHLY","FAMILY_YEARLY"].includes(row.plan_code));assert.ok(row.plan_name);
      assert.ok(Number.isFinite(Number(row.payable_amount)));assert.ok(Number(row.discount_amount)>=0);
      assert.ok(["bank_transfer","instagram"].includes(row.payment_method));assert.ok(["pending","receipt_sent","approved","rejected"].includes(row.status));
      assert.ok(Number.isFinite(Date.parse(row.created_at)));assert.ok(Array.isArray(row.receipts));
    }
  });
  await t.test("normal authenticated user is rejected",async()=>{const result=await rpc(userToken);assert.equal(result.ok,false);assert.ok([400,401,403,404].includes(result.status));});
  await t.test("anonymous caller is rejected",async()=>{const result=await rpc(null);assert.equal(result.ok,false);assert.ok([400,401,403,404].includes(result.status));});
  await t.test("auth.users is not exposed through REST",async()=>{
    for(const token of [null,userToken,adminToken]){
      const result=await request("/rest/v1/auth.users?select=id&limit=1",{token});assert.equal(result.ok,false);
    }
  });
});
