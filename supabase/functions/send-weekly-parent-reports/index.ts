import {createClient} from "@supabase/supabase-js";
import {renderWeeklyParentReport} from "../_shared/weekly-parent-report.mjs";

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8"}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
Deno.serve(async req=>{
  if(req.headers.has("Origin"))return json({error:"Browser origin reddedildi."},403);
  if(req.method!=="POST")return json({error:"Yalnız POST desteklenir."},405);
  let body;try{body=await req.json()}catch{return json({error:"Geçersiz JSON."},400)}
  if(Object.keys(body||{}).length!==1||!uuid.test(String(body?.job_token||"")))return json({error:"Geçersiz iş tokenı."},401);
  const server=createClient(Deno.env.get("SUPABASE_URL")||"",Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"",{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await server.rpc("service_claim_weekly_parent_report_job",{p_job_token:body.job_token,p_limit:50});
  if(error)return json({error:"Geçersiz veya kullanılmış iş tokenı."},401);
  let sent=0,failed=0;
  for(const delivery of Array.isArray(data)?data:[]){
    const now=new Date().toISOString(),update=values=>server.from("weekly_parent_report_deliveries").update({...values,updated_at:now}).eq("id",delivery.id).eq("status","processing").eq("attempt_count",delivery.attempt_count);
    const key=Deno.env.get("RESEND_API_KEY"),from=Deno.env.get("EMAIL_FROM"),replyTo=Deno.env.get("EMAIL_REPLY_TO");
    if(!key||!from||!replyTo){await update({status:"failed",processing_started_at:null,last_error_code:"email_configuration_missing",last_error_at:now});failed++;continue}
    const message=renderWeeklyParentReport(delivery);let response;
    try{response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json; charset=utf-8","Idempotency-Key":`weekly-parent-report/${delivery.id}`},body:JSON.stringify({from,to:[delivery.recipient_email],reply_to:replyTo,subject:message.subject,text:message.text,html:message.html})})}catch{response=null}
    if(!response?.ok){await update({status:"failed",processing_started_at:null,last_error_code:response?`provider_http_${response.status}`:"provider_unreachable",last_error_at:now});failed++;continue}
    let providerId="";try{providerId=String((await response.json())?.id||"")}catch{}
    if(!providerId){await update({status:"failed",processing_started_at:null,last_error_code:"provider_id_missing",last_error_at:now});failed++;continue}
    await update({status:"sent",provider_message_id:providerId,sent_at:now,processing_started_at:null,last_error_code:null,last_error_at:null});sent++;
  }
  return json({ok:true,claimed:Array.isArray(data)?data.length:0,sent,failed});
});
