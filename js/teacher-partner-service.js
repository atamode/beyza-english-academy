import { getSupabaseClient } from "./supabase-client.js";
function unwrap(result,message){if(result?.error)throw new Error(result.error.message||message);return result?.data??result}
function one(value){return Array.isArray(value)?value[0]:value}
export function createTeacherPartnerService(client=getSupabaseClient()){return{
 validatePartnerCode:async code=>one(unwrap(await client.rpc("validate_partner_code",{p_partner_code:code}),"Kod doğrulanamadı.")),
 registerMyPartner:async()=>one(unwrap(await client.rpc("register_my_teacher_partner"),"Partner profili oluşturulamadı.")),
 getMyPartnerSummary:async()=>one(unwrap(await client.rpc("get_my_partner_summary"),"Partner özeti alınamadı.")),
 getMyPartnerAccess:async()=>one(unwrap(await client.rpc("get_my_partner_access"),"Erişim bilgisi alınamadı.")),
 getMyCommissionHistory:async()=>unwrap(await client.rpc("list_my_commission_history"),"Komisyon geçmişi alınamadı.")||[],
 getMyReferralHistory:async()=>unwrap(await client.rpc("list_my_partner_referrals"),"Satış geçmişi alınamadı.")||[],
 getAdminPartnerList:async()=>unwrap(await client.rpc("list_admin_teacher_partners"),"Partner listesi alınamadı.")||[],
 markCommissionPayoutPaid:async(id,note)=>one(unwrap(await client.rpc("admin_mark_commission_payout_paid",{p_payout_id:id,p_admin_note:note||null}),"Ödeme işaretlenemedi."))
}}
