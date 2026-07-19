import { getSupabaseClient } from "./supabase-client.js";
import { clearPartnerAttribution, normalizePartnerCode } from "./partner-attribution.js";

const RECEIPT_BUCKET = "payment-receipts";
const MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;

function unwrap(result, fallback) {
  if (result?.error) throw new Error(result.error.message || fallback);
  return result?.data ?? result;
}

function one(data) { return Array.isArray(data) ? data[0] : data; }

export function createPaymentService(client = getSupabaseClient()) {
  const refundBusy = new Set();
  const locked = async (key, action) => {
    if (refundBusy.has(key)) throw new Error("İade işlemi devam ediyor.");
    refundBusy.add(key);
    try { return await action(); } finally { refundBusy.delete(key); }
  };
  return {
    async listPlans() {
      return unwrap(await client.from("plans").select("id,code,name,price,duration_days,child_limit,active,version").eq("active", true).order("price"), "Planlar alınamadı.") || [];
    },
    async createPaymentRequest(input) {
      const partnerCode = ["FAMILY_MONTHLY", "FAMILY_YEARLY"].includes(input.planCode) ? normalizePartnerCode(input.partnerCode) : "";
      const row = one(unwrap(await client.rpc("create_payment_request", {
        p_plan_code: input.planCode, p_payment_method: input.paymentMethod,
        p_coupon_code: input.couponCode || null, p_instagram_username: input.instagramUsername || null,
        p_sender_name: input.senderName || null, p_transfer_date: input.transferDate || null,
        p_partner_code: partnerCode || null
      }), "Ödeme talebi oluşturulamadı."));
      if (partnerCode) clearPartnerAttribution(partnerCode);
      return row;
    },
    async uploadPaymentReceipt({ paymentRequestId, userId, file }) {
      if (!paymentRequestId || !userId || !file) throw new Error("Dekont bilgileri eksik.");
      if (!MIME_TYPES.has(file.type)) throw new Error("Dekont PDF, JPG veya PNG olmalı.");
      if (!file.size || file.size > MAX_RECEIPT_BYTES) throw new Error("Dekont en fazla 10 MB olabilir.");
      const extension = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
      const path = `${userId}/${paymentRequestId}/${crypto.randomUUID()}.${extension}`;
      unwrap(await client.storage.from(RECEIPT_BUCKET).upload(path, file, { contentType: file.type }), "Dekont yüklenemedi.");
      return one(unwrap(await client.rpc("register_payment_receipt", {
        p_payment_request_id: paymentRequestId, p_storage_path: path,
        p_original_filename: String(file.name || `receipt.${extension}`).slice(0, 255),
        p_mime_type: file.type, p_size_bytes: file.size
      }), "Dekont kaydedilemedi."));
    },
    async markInstagramReceiptSent(paymentRequestId, instagramUsername) {
      return one(unwrap(await client.rpc("mark_instagram_receipt_sent", {
        p_payment_request_id: paymentRequestId, p_instagram_username: instagramUsername
      }), "Instagram bildirimi kaydedilemedi."));
    },
    async listMyPayments(userId) {
      return unwrap(await client.from("payment_requests").select("*,plans(code,name,duration_days),payment_receipts(id,original_filename,mime_type,size_bytes,created_at),subscriptions(id,starts_at,ends_at,status),teacher_access_credits(id,status,starts_at,ends_at),refund_requests(id,status,refund_amount,requested_reason,admin_note,requested_at,completed_at,refund_method,refund_reference)").eq("user_id", userId).order("created_at", { ascending: false }), "Ödemeler alınamadı.") || [];
    },
    async getMySubscription(userId) {
      return one(unwrap(await client.from("subscriptions").select("*,plans(code,name,child_limit)").eq("user_id", userId).eq("status", "active").gt("ends_at", new Date().toISOString()).order("ends_at", { ascending: false }).limit(1).maybeSingle(), "Üyelik alınamadı."));
    },
    async validateCoupon(planCode, couponCode) {
      return one(unwrap(await client.rpc("validate_coupon", { p_plan_code: planCode, p_coupon_code: couponCode }), "Kupon doğrulanamadı."));
    },
    async validatePartnerCode(partnerCode) {
      return one(unwrap(await client.rpc("validate_partner_code", { p_partner_code: partnerCode }), "Öğretmen kodu doğrulanamadı."));
    },
    async approvePayment(paymentRequestId, adminNote = null) {
      return one(unwrap(await client.rpc("approve_payment", { p_payment_request_id: paymentRequestId, p_admin_note: adminNote }), "Ödeme onaylanamadı."));
    },
    async rejectPayment(paymentRequestId, adminNote) {
      if (!String(adminNote || "").trim()) throw new Error("Red notu zorunlu.");
      return one(unwrap(await client.rpc("reject_payment", { p_payment_request_id: paymentRequestId, p_admin_note: adminNote }), "Ödeme reddedilemedi."));
    },
    async sendPaymentDecisionEmail(paymentRequestId) {
      return unwrap(await client.functions.invoke("send-payment-decision-email", {
        body: { payment_request_id: paymentRequestId }
      }), "Ödeme sonucu e-postası gönderilemedi.");
    },
    async listAdminPayments() {
      return unwrap(await client.rpc("list_admin_payments"), "Yönetici ödemeleri alınamadı.") || [];
    },
    async listAdminRefunds() {
      const rows=unwrap(await client.rpc("list_admin_refunds"), "İade talepleri alınamadı.") || [],ids=rows.map(row=>row.refund_request_id).filter(Boolean);
      if(!ids.length)return rows;
      const [refunds,alerts]=await Promise.all([
        client.from("refund_requests").select("id,reviewed_at").in("id",ids),
        client.from("refund_accounting_alerts").select("id,refund_request_id,payment_request_id,commission_earning_id,payout_id,commission_amount,alert_type,status,resolution_note,resolved_at").in("refund_request_id",ids)
      ]);
      const refundRows=unwrap(refunds,"İade inceleme zamanları alınamadı.")||[],alertRows=unwrap(alerts,"Muhasebe uyarıları alınamadı.")||[];
      return rows.map(row=>({...row,refund_reviewed_at:refundRows.find(item=>item.id===row.refund_request_id)?.reviewed_at||null,accounting_alerts:alertRows.filter(item=>item.refund_request_id===row.refund_request_id)}));
    },
    async requestRefund(paymentRequestId, reason) {
      return locked(`request:${paymentRequestId}`, async () => one(unwrap(await client.rpc("request_refund", {
        p_payment_request_id: paymentRequestId, p_reason: String(reason || "").trim()
      }), "İade talebi oluşturulamadı. Listeyi yenileyip durumu kontrol edin.")));
    },
    async adminReviewRefund(refundRequestId, decision, adminNote = null) {
      return locked(`review:${refundRequestId}`, async () => one(unwrap(await client.rpc("admin_review_refund", {
        p_refund_request_id: refundRequestId, p_decision: decision, p_admin_note: adminNote || null
      }), "İade kararı kaydedilemedi. Listeyi yenileyin.")));
    },
    async adminCompleteRefund(refundRequestId, refundMethod, refundReference, adminNote = null) {
      return locked(`complete:${refundRequestId}`, async () => one(unwrap(await client.rpc("admin_complete_refund", {
        p_refund_request_id: refundRequestId, p_refund_method: refundMethod,
        p_refund_reference: String(refundReference || "").trim(), p_admin_note: adminNote || null
      }), "İade tamamlanamadı. Listeyi yenileyin.")));
    },
    async resolveRefundAccountingAlert(alertId, resolutionNote) {
      return locked(`alert:${alertId}`, async () => one(unwrap(await client.rpc("admin_resolve_refund_accounting_alert", {
        p_alert_id: alertId, p_resolution_note: String(resolutionNote || "").trim()
      }), "Muhasebe uyarısı çözülemedi. Listeyi yenileyin.")));
    },
    async getReceiptSignedUrl(storagePath, expiresIn = 300) {
      return unwrap(await client.storage.from(RECEIPT_BUCKET).createSignedUrl(storagePath, expiresIn), "Dekont bağlantısı oluşturulamadı.")?.signedUrl;
    }
  };
}

export { RECEIPT_BUCKET, MIME_TYPES, MAX_RECEIPT_BYTES };
