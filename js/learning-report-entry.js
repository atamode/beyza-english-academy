import { trackEvent } from "./analytics.js";
import { restoreAccountSession, loadChildrenForSession } from "./account-session.js";
import { createLearningReportService } from "./learning-report-service.js";
import { learningReportView } from "./learning-report-views.js";
import { reportPeriod, previousReportPeriod } from "./report-periods.js";
import { getRoute, navigate } from "./router.js";

const app=document.querySelector("#app"),reports=createLearningReportService();
const initial=()=>({children:[],childId:null,periodType:"weekly",period:null,payload:null,history:[],weeklyReports:[],monthlyReports:[],weeklyEmailEnabled:true,monthlyEmailEnabled:true,loading:false,error:""});
let state=initial(),renderToken=0;
const reset=()=>{state=initial();renderToken++;};
function render(){app.innerHTML=learningReportView({selectedChildId:state.childId,...state});app.focus();}

async function loadSelectedReport(){
  const token=++renderToken;state.loading=true;state.error="";state.payload=null;state.history=[];state.period=reportPeriod(state.periodType);render();
  try{const [payload,history,weeklyReports,monthlyReports,weeklyEmailEnabled,monthlyEmailEnabled]=await Promise.all([reports.preview(state.childId,state.periodType,state.period.startDate),reports.list(state.childId),reports.listWeekly(state.childId),reports.listMonthly(state.childId),reports.getWeeklyPreference(),reports.getMonthlyPreference()]);if(token!==renderToken)return;Object.assign(state,{payload,history,weeklyReports,monthlyReports,weeklyEmailEnabled,monthlyEmailEnabled});trackEvent("parent_report_opened",{period_type:state.periodType,source:"parent",has_data:Boolean(payload?.has_data)});}
  catch(error){if(token!==renderToken)return;state.error=error.message||"Rapor yüklenemedi.";}
  finally{if(token===renderToken){state.loading=false;render();}}
}
async function openReportCenter(){
  const account=await restoreAccountSession().catch(()=>({status:"signed-out"}));if(account.status!=="signed-in")return navigate("login");
  if(!["parent","both"].includes(account.profile?.account_type)){app.innerHTML=`<section class="card"><h1>Gelişim raporları yalnız veli hesaplarına açıktır.</h1><button class="button secondary" data-route="home">Ana sayfa</button></section>`;return;}
  const children=await loadChildrenForSession(account).catch(()=>[]);state.children=children;state.childId=children.some(row=>String(row.id)===String(state.childId))?state.childId:children[0]?.id||null;
  if(!state.childId){state.error="Rapor gösterilecek bağlı çocuk profili bulunamadı.";state.period=reportPeriod(state.periodType);render();return;}await loadSelectedReport();
}
function injectReportsLink(){if(getRoute().startsWith("parent")&&!getRoute().startsWith("parent/reports")&&app.querySelector("[data-parent-report]")&&!app.querySelector("[data-parent-reports-link]")){const button=document.createElement("button");button.className="button primary";button.dataset.parentReportsLink="";button.textContent="Gelişim Raporları";app.querySelector("[data-parent-report] .page-head")?.append(button);}}

document.addEventListener("click",async event=>{
  if(event.target.closest("[data-parent-reports-link]")){navigate("parent/reports");return;}if(getRoute()!=="parent/reports")return;
  const periodButton=event.target.closest("[data-report-period]");if(periodButton){state.periodType=periodButton.dataset.reportPeriod;await loadSelectedReport();return;}
  if(event.target.closest("[data-action='print-learning-report']")){print();return;}
  if(event.target.closest("[data-action='generate-previous-report']")){const period=previousReportPeriod(state.periodType);try{await reports.generate(state.childId,state.periodType,period.startDate);await loadSelectedReport();}catch(error){state.error=error.message;render();}return;}
  const historyButton=event.target.closest("[data-report-id]");if(historyButton){try{const row=await reports.get(historyButton.dataset.reportId);state.payload=row.payload;state.period={type:row.period_type,start:row.period_start,end:row.period_end};render();}catch(error){state.error=error.message;render();}}
});
document.addEventListener("change",async event=>{if(getRoute()!=="parent/reports")return;if(event.target.matches("[data-report-child]")){state.childId=event.target.value;await loadSelectedReport();return;}if(event.target.matches("[data-weekly-email-preference]")){try{state.weeklyEmailEnabled=await reports.setWeeklyPreference(event.target.checked);render();}catch(error){state.error=error.message;render();}}if(event.target.matches("[data-monthly-email-preference]")){try{state.monthlyEmailEnabled=await reports.setMonthlyPreference(event.target.checked);render();}catch(error){state.error=error.message;render();}}});
window.addEventListener("hashchange",()=>queueMicrotask(()=>{if(getRoute()==="parent/reports")openReportCenter();else{reset();injectReportsLink();}}));
new MutationObserver(()=>injectReportsLink()).observe(app,{childList:true});setTimeout(()=>{if(getRoute()==="parent/reports")openReportCenter();else injectReportsLink();},0);
