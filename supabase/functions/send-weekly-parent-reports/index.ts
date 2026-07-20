import {createClient} from "@supabase/supabase-js";
import {renderWeeklyParentReport} from "../_shared/weekly-parent-report.mjs";
import {renderMonthlyParentReport} from "../_shared/monthly-parent-report.mjs";

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8"}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const acceptanceEmail="delivered+poma-weekly@resend.dev";

Deno.serve(async req=>{
  if(req.headers.has("Origin"))return json({error:"Browser origin reddedildi."},403);
  if(req.method!=="POST")return json({error:"Yalnız POST desteklenir."},405);
  let body;try{body=await req.json()}catch{return json({error:"Geçersiz JSON."},400)}
  const keys=Object.keys(body||{}),jobMode=keys.length===1&&uuid.test(String(body?.job_token||"")),monthlyMode=keys.length===1&&uuid.test(String(body?.monthly_job_token||"")),manualMode=keys.length===1&&uuid.test(String(body?.delivery_id||""));
  if(!jobMode&&!monthlyMode&&!manualMode)return json({error:"Geçersiz istek."},400);

  const supabaseUrl=Deno.env.get("SUPABASE_URL")||"",serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  const server=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  let deliveries=[];
  if(jobMode||monthlyMode){
    const rpcName=monthlyMode?"service_claim_monthly_parent_report_job":"service_claim_weekly_parent_report_job",args=monthlyMode?{p_job_token:body.monthly_job_token,p_limit:50}:{p_job_token:body.job_token,p_limit:50};
    const {data,error}=await server.rpc(rpcName,args);
    if(error)return json({error:"Geçersiz veya kullanılmış iş tokenı."},401);
    deliveries=(Array.isArray(data)?data:[]).map(row=>({...row,_report_type:monthlyMode?"monthly":"weekly"}));
  }else{
    const authorization=req.headers.get("Authorization");
    if(!authorization?.startsWith("Bearer "))return json({error:"Yetkilendirme gerekli."},401);
    const anonKey=Deno.env.get("SUPABASE_ANON_KEY")||"",token=authorization.slice(7);
    const userClient=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
    const {data:{user},error:userError}=await userClient.auth.getUser(token);
    if(userError||!user)return json({error:"Geçersiz oturum."},401);
    const {data:isAdmin,error:adminError}=await userClient.rpc("is_poma_admin");
    if(adminError||isAdmin!==true)return json({error:"Yönetici yetkisi gerekli."},403);
    const {data:delivery,error:deliveryError}=await server.from("weekly_parent_report_deliveries").select("*").eq("id",body.delivery_id).maybeSingle();
    if(deliveryError)return json({error:"Teslimat kaydı okunamadı."},500);
    if(!delivery)return json({error:"Teslimat kaydı bulunamadı."},404);
    if(delivery.status==="sent")return json({ok:true,claimed:0,sent:0,failed:0,idempotent:true});
    const {data:recipient,error:recipientError}=await server.auth.admin.getUserById(delivery.parent_user_id);
    const metadata=recipient?.user?.app_metadata||{};
    if(recipientError||metadata.is_test!==true||metadata.test_purpose!=="weekly_parent_report_acceptance"||delivery.recipient_email!==acceptanceEmail||recipient.user?.email!==acceptanceEmail)return json({error:"Yalnız işaretli haftalık rapor test hesabı kabul edilir."},403);
    if(!["pending","failed"].includes(delivery.status)||delivery.attempt_count>=3)return json({error:"Teslimat gönderime uygun değil."},409);
    const now=new Date().toISOString();
    const {data:claimed,error:claimError}=await server.from("weekly_parent_report_deliveries").update({status:"processing",processing_started_at:now,attempt_count:delivery.attempt_count+1,last_error_code:null,last_error_at:null,updated_at:now}).eq("id",delivery.id).eq("status",delivery.status).eq("attempt_count",delivery.attempt_count).select("*").maybeSingle();
    if(claimError||!claimed)return json({error:"Teslimat başka bir işlem tarafından alındı."},409);
    deliveries=[claimed];
  }

  let sent=0,failed=0;
  for(const delivery of deliveries){
    const now=new Date().toISOString(),table=delivery._report_type==="monthly"?"monthly_parent_report_deliveries":"weekly_parent_report_deliveries",update=values=>server.from(table).update({...values,updated_at:now}).eq("id",delivery.id).eq("status","processing").eq("attempt_count",delivery.attempt_count);
    const key=Deno.env.get("RESEND_API_KEY"),from=Deno.env.get("EMAIL_FROM"),replyTo=Deno.env.get("EMAIL_REPLY_TO");
    if(!key||!from||!replyTo){await update({status:"failed",processing_started_at:null,last_error_code:"email_configuration_missing",last_error_at:now});failed++;continue}
    const monthly=delivery._report_type==="monthly",message=monthly?renderMonthlyParentReport(delivery):renderWeeklyParentReport(delivery);let response;
    try{response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json; charset=utf-8","Idempotency-Key":`${monthly?"monthly":"weekly"}-parent-report/${delivery.id}`},body:JSON.stringify({from,to:[delivery.recipient_email],reply_to:replyTo,subject:message.subject,text:message.text,html:message.html})})}catch{response=null}
    if(!response?.ok){await update({status:"failed",processing_started_at:null,last_error_code:response?`provider_http_${response.status}`:"provider_unreachable",last_error_at:now});failed++;continue}
    let providerId="";try{providerId=String((await response.json())?.id||"")}catch{}
    if(!providerId){await update({status:"failed",processing_started_at:null,last_error_code:"provider_id_missing",last_error_at:now});failed++;continue}
    await update({status:"sent",provider_message_id:providerId,sent_at:now,processing_started_at:null,last_error_code:null,last_error_at:null});sent++;
  }
  return json({ok:true,claimed:deliveries.length,sent,failed});
});
