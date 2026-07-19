import { getSupabaseClient } from "./supabase-client.js";
const unwrap=(result,message)=>{if(result?.error)throw new Error(result.error.message||message);return result?.data??result};

export function createLearningReportService(client=getSupabaseClient()) {
  return {
    preview(childId,periodType,periodStart){return client.rpc("preview_learning_report",{p_child_id:childId,p_period_type:periodType,p_period_start:periodStart}).then(result=>unwrap(result,"Rapor ön izlemesi alınamadı."));},
    generate(childId,periodType,periodStart){return client.rpc("generate_learning_report",{p_child_id:childId,p_period_type:periodType,p_period_start:periodStart}).then(result=>unwrap(result,"Rapor kaydedilemedi."));},
    list(childId){return client.rpc("list_my_learning_reports",{p_child_id:childId}).then(result=>unwrap(result,"Rapor geçmişi alınamadı."))||[];},
    get(reportId){return client.rpc("get_learning_report",{p_report_id:reportId}).then(result=>unwrap(result,"Rapor alınamadı."));},
    listWeekly(childId=null){return client.rpc("list_my_weekly_parent_reports",{p_child_id:childId}).then(result=>unwrap(result,"Haftalık raporlar alınamadı."))||[];},
    getWeeklyPreference(){return client.from("weekly_parent_report_preferences").select("weekly_progress_email_enabled").maybeSingle().then(({data,error})=>{if(error)throw new Error("E-posta tercihi alınamadı.");return data?.weekly_progress_email_enabled!==false;});},
    setWeeklyPreference(enabled){return client.rpc("update_weekly_progress_email_preference",{p_enabled:Boolean(enabled)}).then(result=>unwrap(result,"E-posta tercihi kaydedilemedi."));}
  };
}
