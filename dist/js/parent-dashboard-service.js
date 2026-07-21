import {createPaymentService} from "./payment-service.js";
import {createLearningReportService} from "./learning-report-service.js";
import {createStudentRepository} from "./student-repository.js";

const time=value=>value?new Date(value).getTime():0;
const newest=rows=>[...(rows||[])].sort((a,b)=>time(b.created_at||b.period_start)-time(a.created_at||a.period_start))[0]||null;
const refunds=row=>row?.refund_requests||[];

export function effectiveSubscription(payments,now=new Date()){
  const rows=(payments||[]).flatMap(payment=>(payment.subscriptions||[]).map(subscription=>({subscription,payment})));
  return rows.filter(({subscription,payment})=>subscription.status==="active"&&time(subscription.ends_at)>now.getTime()&&!refunds(payment).some(refund=>refund.status==="completed")).sort((a,b)=>time(b.subscription.ends_at)-time(a.subscription.ends_at))[0]||null;
}

export function selectParentPriority({payments=[],subscription=null,weekly=null,monthly=null},now=new Date()){
  const allSubscriptions=payments.flatMap(row=>row.subscriptions||[]),expired=allSubscriptions.some(row=>row.status==="active"&&time(row.ends_at)<=now.getTime())||allSubscriptions.some(row=>row.status==="expired");
  if(expired&&!subscription)return {kind:"membership_expired",title:"Üyeliğinizin süresi doldu",action:"Üyeliği Yönet",route:"membership"};
  const pending=newest(payments.filter(row=>["pending","receipt_sent"].includes(row.status)));
  if(pending)return {kind:"payment_pending",title:pending.status==="receipt_sent"?"Dekontunuz inceleniyor":"Ödeme işleminiz bekliyor",action:"Ödemeleri Gör",route:"membership"};
  const refund=newest(payments.flatMap(payment=>refunds(payment).filter(row=>["requested","approved"].includes(row.status)).map(row=>({...row,created_at:row.requested_at}))));
  if(refund)return {kind:"refund_pending",title:"İade işlemi devam ediyor",action:"Ödemeleri Gör",route:"membership"};
  if(subscription){const days=Math.max(0,Math.ceil((time(subscription.subscription.ends_at)-now.getTime())/86400000));if(days<=14)return {kind:"membership_ending",title:`Üyeliğiniz ${days} gün içinde sona erecek`,action:"Üyeliği Yönet",route:"membership"};}
  if(weekly)return {kind:"weekly_ready",title:"Yeni haftalık gelişim raporu hazır",action:"Raporu Gör",route:"parent/reports"};
  if(monthly)return {kind:"monthly_ready",title:"Yeni aylık gelişim raporu hazır",action:"Raporu Gör",route:"parent/reports"};
  return {kind:"clear",title:"Çocuğunuz öğrenmeye devam edebilir",action:"Çocuğun Profiline Git",route:"profiles"};
}

export function summarizeProgress(row){
  const state=row?.state||{},lessons=Object.entries(state.lessonProgress||{}),completed=lessons.filter(([,value])=>value?.completed).sort((a,b)=>time(b[1].completedAt)-time(a[1].completedAt))[0],current=lessons.filter(([,value])=>!value?.completed&&(value?.startedAt||Number(value?.currentScreen)>0)).sort((a,b)=>time(b[1].startedAt)-time(a[1].startedAt))[0];
  const stories=Object.values(state.storyProgress||{}).filter(value=>value?.completed).sort((a,b)=>time(b.completedAt)-time(a.completedAt));
  return {lastCompletedLesson:completed?completed[0]:null,currentLesson:current?current[0]:null,lastActivity:stories[0]?.completedAt?"Son hikâye etkinliği tamamlandı":null};
}

export function createParentDashboardService({client,paymentService=createPaymentService(client),reportService=createLearningReportService(client),studentRepository=createStudentRepository(client)}={}){
  return {async load(userId,childId){
    const results=await Promise.allSettled([paymentService.listMyPayments(userId),reportService.listReportPage("weekly",childId,0,1),reportService.listReportPage("monthly",childId,0,1),studentRepository.getStudentState(childId)]);
    const value=(index,fallback)=>results[index].status==="fulfilled"?results[index].value:fallback,payments=value(0,[]),weekly=value(1,{rows:[]}).rows?.[0]||null,monthly=value(2,{rows:[]}).rows?.[0]||null,subscription=effectiveSubscription(payments);
    return {payments,subscription,weekly,monthly,progress:summarizeProgress(value(3,null)),partial:results.some(result=>result.status==="rejected"),priority:selectParentPriority({payments,subscription,weekly,monthly})};
  }};
}
