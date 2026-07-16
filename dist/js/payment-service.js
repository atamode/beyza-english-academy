import { getSupabaseClient } from "./supabase-client.js";

const RECEIPT_BUCKET = "payment-receipts";
const MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;

function unwrap(result, fallback) {
  if (result?.error) throw new Error(result.error.message || fallback);
  return result?.data ?? result;
}

function one(data) { return Array.isArray(data) ? data[0] : data; }

export function createPaymentService(client = getSupabaseClient()) {
  return {
    async listPlans() {
      return unwrap(await client.from("plans").select("id,code,name,price,duration_days,child_limit,version").eq("active", true).order("price"), "Planlar alınamadı.") || [];
    },
    async createPaymentRequest(input) {
      return one(unwrap(await client.rpc("create_payment_request", {
        p_plan_code: input.planCode, p_payment_method: input.paymentMethod,
        p_coupon_code: input.couponCode || null, p_instagram_username: input.instagramUsername || null,
        p_sender_name: input.senderName || null, p_transfer_date: input.transferDate || null
      }), "Ödeme talebi oluşturulamadı."));
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
      return unwrap(await client.from("payment_requests").select("*,plans(code,name)").eq("user_id", userId).order("created_at", { ascending: false }), "Ödemeler alınamadı.") || [];
    },
    async getMySubscription(userId) {
      return one(unwrap(await client.from("subscriptions").select("*,plans(code,name,child_limit)").eq("user_id", userId).eq("status", "active").order("ends_at", { ascending: false }).limit(1).maybeSingle(), "Üyelik alınamadı."));
    },
    async validateCoupon(planCode, couponCode) {
      return one(unwrap(await client.rpc("validate_coupon", { p_plan_code: planCode, p_coupon_code: couponCode }), "Kupon doğrulanamadı."));
    },
    async approvePayment(paymentRequestId, adminNote = null) {
      return one(unwrap(await client.rpc("approve_payment", { p_payment_request_id: paymentRequestId, p_admin_note: adminNote }), "Ödeme onaylanamadı."));
    },
    async rejectPayment(paymentRequestId, adminNote) {
      if (!String(adminNote || "").trim()) throw new Error("Red notu zorunlu.");
      return one(unwrap(await client.rpc("reject_payment", { p_payment_request_id: paymentRequestId, p_admin_note: adminNote }), "Ödeme reddedilemedi."));
    },
    async listAdminPayments() {
      return unwrap(await client.from("payment_requests").select("*,plans(code,name),payment_receipts(*)").order("created_at", { ascending: false }), "Yönetici ödemeleri alınamadı.") || [];
    },
    async getReceiptSignedUrl(storagePath, expiresIn = 300) {
      return unwrap(await client.storage.from(RECEIPT_BUCKET).createSignedUrl(storagePath, expiresIn), "Dekont bağlantısı oluşturulamadı.")?.signedUrl;
    }
  };
}

export { RECEIPT_BUCKET, MIME_TYPES, MAX_RECEIPT_BYTES };
