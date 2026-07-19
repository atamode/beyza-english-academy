import {createClient} from "@supabase/supabase-js";
import {renderMembershipExpiryReminder} from "../_shared/membership-expiry-reminder-template.mjs";

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8"}});
const safeError=(value:unknown)=>String(value instanceof Error?value.message:value||"E-posta istegi basarisiz oldu.").replace(/[\r\n]+/g," ").slice(0,500);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const result=(claimed=0,sent=0,failed=0,skipped=0)=>({ok:true,claimed,sent,failed,skipped});

Deno.serve(async req=>{
  if(req.headers.has("Origin"))return json({error:"Browser origin reddedildi."},403);
  if(req.method!=="POST")return json({error:"Yalniz POST desteklenir."},405);
  const contentType=req.headers.get("Content-Type")||"";
  if(!contentType.toLowerCase().startsWith("application/json"))return json({error:"JSON gerekli."},400);
  const length=Number(req.headers.get("Content-Length")||"0");
  if(length>256)return json({error:"Istek govdesi cok buyuk."},413);
  let raw="";try{raw=await req.text()}catch{return json({error:"Gecersiz istek."},400)}
  if(!raw||new TextEncoder().encode(raw).length>256)return json({error:"Gecersiz istek."},400);
  let body:Record<string,unknown>;try{body=JSON.parse(raw)}catch{return json({error:"Gecersiz JSON."},400)}
  if(Object.keys(body).length!==1||typeof body.job_token!=="string"||!uuid.test(body.job_token))return json({error:"Gecersiz is tokeni."},401);
  const supabaseUrl=Deno.env.get("SUPABASE_URL")||"",serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  const server=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:deliveries,error:claimError}=await server.rpc("service_claim_membership_reminder_job",{p_job_token:body.job_token,p_limit:50});
  if(claimError)return json({error:"Gecersiz veya kullanilmis is tokeni."},401);
  const rows=Array.isArray(deliveries)?deliveries:[];
  if(!rows.length)return json(result(),200);
  let sent=0,failed=0,skipped=0;
  for(const delivery of rows){
    const now=new Date().toISOString();
    const update=async values=>server.from("membership_expiry_reminder_deliveries").update({...values,updated_at:now}).eq("id",delivery.id).eq("status","processing").eq("attempt_count",delivery.attempt_count);
    const {data:recipient,error:recipientError}=await server.auth.admin.getUserById(delivery.recipient_user_id);
    if(recipientError){await update({status:"failed",processing_started_at:null,last_error:"Alici hesabi gecici olarak okunamadi."});failed++;continue}
    if(!recipient.user?.email){await update({status:"skipped",skipped_at:now,skip_reason:"recipient_missing",processing_started_at:null,last_error:null});skipped++;continue}
    const resendKey=Deno.env.get("RESEND_API_KEY"),from=Deno.env.get("EMAIL_FROM"),replyTo=Deno.env.get("EMAIL_REPLY_TO");
    if(!resendKey||!from||!replyTo){await update({status:"failed",processing_started_at:null,last_error:"E-posta servisi yapilandirmasi eksik."});failed++;continue}
    const message=renderMembershipExpiryReminder(delivery);
    let response:Response;
    try{response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${resendKey}`,"Content-Type":"application/json; charset=utf-8","Idempotency-Key":`membership-reminder/${delivery.id}`},body:JSON.stringify({from,to:[recipient.user.email],reply_to:replyTo,subject:message.subject,text:message.text,html:message.html})})}
    catch(error){await update({status:"failed",processing_started_at:null,last_error:safeError(error)});failed++;continue}
    if(!response.ok){await update({status:"failed",processing_started_at:null,last_error:`E-posta saglayicisi HTTP ${response.status} hatasi dondurdu.`});failed++;continue}
    let providerId="";try{providerId=String((await response.json())?.id||"")}catch{}
    if(!providerId){await update({status:"failed",processing_started_at:null,last_error:"E-posta saglayicisi mesaj kimligi dondurmedi."});failed++;continue}
    const {error:sentError}=await update({status:"sent",provider_message_id:providerId,sent_at:now,processing_started_at:null,last_error:null});
    if(sentError){failed++;continue}sent++;
  }
  return json(result(rows.length,sent,failed,skipped),200);
});
