import {createClient} from "@supabase/supabase-js";
import {renderPaymentDecisionEmail} from "../_shared/payment-email-template.mjs";

const allowedOrigins=new Set(["https://pomante.com.tr","https://www.pomante.com.tr"]);
const localOrigin=/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const json=(body:unknown,status=200,origin?:string)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8",...(origin?{"Access-Control-Allow-Origin":origin,"Vary":"Origin"}:{})}});
const safeError=(value:unknown)=>String(value instanceof Error?value.message:value||"E-posta sa\u011flay\u0131c\u0131s\u0131 iste\u011fi ba\u015far\u0131s\u0131z oldu.").replace(/[\r\n]+/g," ").slice(0,500);

Deno.serve(async req=>{
  const origin=req.headers.get("Origin")||"",corsOrigin=allowedOrigins.has(origin)||localOrigin.test(origin)?origin:undefined;
  if(origin&&!corsOrigin)return json({error:"Origin izinli de\u011fil."},403);
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":corsOrigin||"","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}});
  if(req.method!=="POST")return json({error:"Yaln\u0131z POST desteklenir."},405,corsOrigin);
  const authorization=req.headers.get("Authorization");
  if(!authorization?.startsWith("Bearer "))return json({error:"Yetkilendirme gerekli."},401,corsOrigin);
  const supabaseUrl=Deno.env.get("SUPABASE_URL")||"",anonKey=Deno.env.get("SUPABASE_ANON_KEY")||"",serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  const userClient=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
  const token=authorization.slice(7);
  const {data:{user},error:userError}=await userClient.auth.getUser(token);
  if(userError||!user)return json({error:"Ge\u00e7ersiz oturum."},401,corsOrigin);
  const {data:isAdmin,error:adminError}=await userClient.rpc("is_poma_admin");
  if(adminError||isAdmin!==true)return json({error:"Y\u00f6netici yetkisi gerekli."},403,corsOrigin);
  let body:{payment_request_id?:string};try{body=await req.json()}catch{return json({error:"Ge\u00e7ersiz JSON."},400,corsOrigin)}
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.payment_request_id||""))return json({error:"Ge\u00e7ersiz payment_request_id."},400,corsOrigin);
  const server=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:delivery,error:deliveryError}=await server.from("payment_email_deliveries").select("*").eq("payment_request_id",body.payment_request_id).maybeSingle();
  if(deliveryError)return json({error:"Teslimat kayd\u0131 okunamad\u0131."},500,corsOrigin);
  if(!delivery)return json({error:"Teslimat kayd\u0131 bulunamad\u0131."},404,corsOrigin);
  if(delivery.status==="sent")return json({ok:true,status:"sent",idempotent:true},200,corsOrigin);
  const started=delivery.processing_started_at?new Date(delivery.processing_started_at).getTime():0;
  if(delivery.status==="processing"&&started>Date.now()-10*60*1000)return json({error:"E-posta g\u00f6nderimi devam ediyor.",status:"processing"},409,corsOrigin);
  let claim=server.from("payment_email_deliveries").update({status:"processing",processing_started_at:new Date().toISOString(),attempt_count:delivery.attempt_count+1,updated_at:new Date().toISOString(),last_error:null}).eq("id",delivery.id).eq("status",delivery.status).eq("attempt_count",delivery.attempt_count);
  if(delivery.status==="processing")claim=claim.eq("processing_started_at",delivery.processing_started_at);
  const {data:claimed,error:claimError}=await claim.select("*").maybeSingle();
  if(claimError||!claimed)return json({error:"Teslimat ba\u015fka bir i\u015flem taraf\u0131ndan al\u0131nd\u0131."},409,corsOrigin);
  const fail=async(message:string,status=502)=>{await server.from("payment_email_deliveries").update({status:"failed",processing_started_at:null,last_error:message.slice(0,500),updated_at:new Date().toISOString()}).eq("id",claimed.id).eq("status","processing").eq("attempt_count",claimed.attempt_count);return json({error:message,status:"failed"},status,corsOrigin)};
  const {data:recipient,error:recipientError}=await server.auth.admin.getUserById(claimed.recipient_user_id);
  if(recipientError||!recipient.user?.email)return fail("Al\u0131c\u0131 hesab\u0131 veya e-posta adresi bulunamad\u0131.",422);
  const resendKey=Deno.env.get("RESEND_API_KEY"),from=Deno.env.get("EMAIL_FROM"),replyTo=Deno.env.get("EMAIL_REPLY_TO");
  if(!resendKey||!from||!replyTo)return fail("E-posta servisi yap\u0131land\u0131rmas\u0131 eksik.",500);
  const message=renderPaymentDecisionEmail(claimed);
  let response:Response;
  try{response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${resendKey}`,"Content-Type":"application/json; charset=utf-8","Idempotency-Key":`payment-decision/${claimed.id}`},body:JSON.stringify({from,to:[recipient.user.email],reply_to:replyTo,subject:message.subject,text:message.text,html:message.html})})}catch(error){return fail(safeError(error))}
  if(!response.ok)return fail(`E-posta sa\u011flay\u0131c\u0131s\u0131 HTTP ${response.status} hatas\u0131 d\u00f6nd\u00fcrd\u00fc.`);
  let providerId="";try{providerId=String((await response.json())?.id||"")}catch{return fail("E-posta sa\u011flay\u0131c\u0131s\u0131 ge\u00e7ersiz yan\u0131t d\u00f6nd\u00fcrd\u00fc.")}
  if(!providerId)return fail("E-posta sa\u011flay\u0131c\u0131s\u0131 mesaj kimli\u011fi d\u00f6nd\u00fcrmedi.");
  const now=new Date().toISOString();
  const {data:sent,error:sentError}=await server.from("payment_email_deliveries").update({status:"sent",provider_message_id:providerId,sent_at:now,processing_started_at:null,last_error:null,updated_at:now}).eq("id",claimed.id).eq("status","processing").eq("attempt_count",claimed.attempt_count).select("id").maybeSingle();
  if(sentError||!sent)return json({error:"G\u00f6nderim sonucu kaydedilemedi."},500,corsOrigin);
  return json({ok:true,status:"sent",delivery_id:claimed.id},200,corsOrigin);
});