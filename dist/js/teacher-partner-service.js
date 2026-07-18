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
 getAdminTeacherProfiles:async(status=null)=>unwrap(await client.rpc("list_admin_teacher_profiles",{p_status:status}),"Öğretmen başvuruları alınamadı.")||[],
 getAdminCommissionPayouts:async(status="pending")=>unwrap(await client.rpc("list_admin_commission_payouts",{p_status:status}),"Payout listesi alınamadı.")||[],
 upsertAdminPartner:async input=>one(unwrap(await client.rpc("admin_upsert_teacher_partner",{p_teacher_id:input.teacherId,p_partner_code:input.partnerCode,p_status:input.status,p_commission_rate:Number(input.commissionRate||.10),p_access_ends_at:input.accessEndsAt||null,p_admin_note:input.adminNote||null}),"Partner güncellenemedi.")),
 setTeacherApproval:async input=>one(unwrap(await client.rpc("admin_set_teacher_approval",{p_teacher_id:input.teacherId,p_status:input.status,p_admin_note:input.adminNote||null}),"Öğretmen durumu güncellenemedi.")),
 createCommissionPayout:async input=>one(unwrap(await client.rpc("admin_create_commission_payout",{p_teacher_id:input.teacherId,p_period_start:input.periodStart,p_period_end:input.periodEnd,p_admin_note:input.adminNote||null}),"Payout oluşturulamadı.")),
 markCommissionPayoutPaid:async(id,note)=>one(unwrap(await client.rpc("admin_mark_commission_payout_paid",{p_payout_id:id,p_admin_note:note||null}),"Ödeme işaretlenemedi.")),
 cancelCommissionPayout:async(id,note)=>one(unwrap(await client.rpc("admin_cancel_commission_payout",{p_payout_id:id,p_admin_note:note}),"Payout iptal edilemedi."))
}}
