import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const EXPECTED_REF="gzsrcjovhhlfpvvpucri",root=new URL("../",import.meta.url);
function load(name){const file=new URL(name,root);if(!fs.existsSync(file))return{};return Object.fromEntries(fs.readFileSync(file,"utf8").split(/\r?\n/).flatMap(raw=>{const line=raw.trim();if(!line||line.startsWith("#")||!line.includes("="))return[];const at=line.indexOf("=");let value=line.slice(at+1).trim();if(/^(['"]).*\1$/.test(value))value=value.slice(1,-1);return[[line.slice(0,at).trim(),value]]}))}
const env={...load(".env.e2e.local"),...process.env},required=["SUPABASE_URL","SUPABASE_ANON_KEY","SUPABASE_SERVICE_ROLE_KEY","POMA_E2E_EXPECTED_PROJECT_REF","POMA_E2E_ALLOW_PRODUCTION"];
if(required.some(key=>!env[key]))throw new Error("Eksik güvenlik kontrolü environment değişkeni.");
const base=new URL(env.SUPABASE_URL),projectRef=base.hostname.split(".")[0];
if(projectRef!==EXPECTED_REF||env.POMA_E2E_EXPECTED_PROJECT_REF!==EXPECTED_REF||env.POMA_E2E_ALLOW_PRODUCTION!=="true")throw new Error("Production guard başarısız; mutasyon yapılmadı.");
const runId=`poma-email-security-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,password=crypto.randomBytes(32).toString("base64url")+"aA1!",users=[];
const email=kind=>`e2e-${kind}+${runId}@e2e.invalid`;
async function request(path,{key=env.SUPABASE_ANON_KEY,token=key,method="GET",body}={}){const response=await fetch(`${base.origin}${path}`,{method,headers:{apikey:key,Authorization:`Bearer ${token}`,...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined});return{status:response.status,data:await response.text()}}
async function create(kind,admin=false){const result=await request("/auth/v1/admin/users",{key:env.SUPABASE_SERVICE_ROLE_KEY,token:env.SUPABASE_SERVICE_ROLE_KEY,method:"POST",body:{email:email(kind),password,email_confirm:true,app_metadata:admin?{role:"admin",is_admin:true}:{},user_metadata:{display_name:"E2E security check",account_type:"parent"}}});assert.equal(result.status,200);const user=JSON.parse(result.data);users.push(user.id)}
async function login(kind){const result=await request("/auth/v1/token?grant_type=password",{method:"POST",body:{email:email(kind),password}});assert.equal(result.status,200);return JSON.parse(result.data).access_token}
async function invoke(token){return request("/functions/v1/send-payment-decision-email",{token,method:"POST",body:{payment_request_id:"00000000-0000-4000-8000-000000000000"}})}
let failure;
try{
  const noJwt=await fetch(`${base.origin}/functions/v1/send-payment-decision-email`,{method:"POST",headers:{apikey:env.SUPABASE_ANON_KEY,"Content-Type":"application/json"},body:'{"payment_request_id":"00000000-0000-4000-8000-000000000000"}'});assert.equal(noJwt.status,401);console.log("[GEÇTİ] JWT olmadan çağrı 401");
  await create("normal");await create("admin",true);const normalToken=await login("normal"),adminToken=await login("admin");
  assert.equal((await invoke(normalToken)).status,403);console.log("[GEÇTİ] normal kullanıcı çağrısı 403");
  assert.equal((await invoke(adminToken)).status,404);console.log("[GEÇTİ] admin ve bilinmeyen ödeme çağrısı 404; e-posta gönderilmedi");
}catch(error){failure=error}
finally{for(const id of users.reverse()){const deleted=await request(`/auth/v1/admin/users/${id}`,{key:env.SUPABASE_SERVICE_ROLE_KEY,token:env.SUPABASE_SERVICE_ROLE_KEY,method:"DELETE"});if(![200,204,404].includes(deleted.status))failure||=new Error(`Güvenlik kontrolü cleanup başarısız (HTTP ${deleted.status})`)}console.log("[GEÇTİ] güvenlik kontrolü geçici kullanıcı cleanup tamamlandı")}
if(failure)throw failure;
