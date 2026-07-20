import { getSupabaseClient } from "./supabase-client.js";
const unwrap=(result,message)=>{if(result?.error)throw new Error(result.error.message||message);return result?.data??result};

export function createLearningReportService(client=getSupabaseClient()) {
  const page=async(kind,childId,offset=0,limit=5)=>{const monthly=kind==="monthly",table=monthly?"student_monthly_reports":"student_weekly_reports",fields=monthly?"id,child_id,child_name,period_start,period_end,status,metrics,topics_studied,improved_topics,review_topics,comparison":"id,child_id,child_name,period_start,period_end,status,metrics,strengths,practice_recommendations,difficult_topics";const {data,error}=await client.from(table).select(fields).eq("child_id",childId).neq("status","cancelled").order("period_start",{ascending:false}).range(offset,offset+limit);if(error)throw new Error("Raporlar alınamadı.");const rows=data||[];return {rows:rows.slice(0,limit),hasMore:rows.length>limit};};
  const deliveries=async kind=>{const table=kind==="monthly"?"monthly_parent_report_deliveries":"weekly_parent_report_deliveries",{data,error}=await client.from(table).select("period_start,status,skip_reason").order("period_start",{ascending:false}).limit(50);if(error)throw new Error("Teslimat bilgisi alınamadı.");return data||[];};
  return {
    preview(childId,periodType,periodStart){return client.rpc("preview_learning_report",{p_child_id:childId,p_period_type:periodType,p_period_start:periodStart}).then(result=>unwrap(result,"Rapor ön izlemesi alınamadı."));},
    generate(childId,periodType,periodStart){return client.rpc("generate_learning_report",{p_child_id:childId,p_period_type:periodType,p_period_start:periodStart}).then(result=>unwrap(result,"Rapor kaydedilemedi."));},
    list(childId){return client.rpc("list_my_learning_reports",{p_child_id:childId}).then(result=>unwrap(result,"Rapor geçmişi alınamadı."))||[];},
    get(reportId){return client.rpc("get_learning_report",{p_report_id:reportId}).then(result=>unwrap(result,"Rapor alınamadı."));},
    listWeekly(childId=null){return client.rpc("list_my_weekly_parent_reports",{p_child_id:childId}).then(result=>unwrap(result,"Haftalık raporlar alınamadı."))||[];},
    getWeeklyPreference(){return client.from("weekly_parent_report_preferences").select("weekly_progress_email_enabled").maybeSingle().then(({data,error})=>{if(error)throw new Error("E-posta tercihi alınamadı.");return data?.weekly_progress_email_enabled!==false;});},
    setWeeklyPreference(enabled){return client.rpc("update_weekly_progress_email_preference",{p_enabled:Boolean(enabled)}).then(result=>unwrap(result,"E-posta tercihi kaydedilemedi."));}
    ,listMonthly(childId=null){return client.rpc("list_my_monthly_parent_reports",{p_child_id:childId}).then(result=>unwrap(result,"Aylık raporlar alınamadı."))||[];}
    ,getMonthlyPreference(){return client.from("weekly_parent_report_preferences").select("monthly_progress_email_enabled").maybeSingle().then(({data,error})=>{if(error)throw new Error("Aylık e-posta tercihi alınamadı.");return data?.monthly_progress_email_enabled!==false;});}
    ,setMonthlyPreference(enabled){return client.rpc("update_monthly_progress_email_preference",{p_enabled:Boolean(enabled)}).then(result=>unwrap(result,"Aylık e-posta tercihi kaydedilemedi."));}
    ,listReportPage:page
    ,listDeliveryStatuses:deliveries
  };
}
