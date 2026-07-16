import { hasPaymentInstructions, PAYMENT_INSTRUCTIONS } from "./payment-config.js";

const e = value => String(value ?? "").replace(/[&<>\"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
const money = value => new Intl.NumberFormat("tr-TR", { style:"currency", currency:"TRY" }).format(Number(value || 0));
const date = value => value ? new Intl.DateTimeFormat("tr-TR", { dateStyle:"long" }).format(new Date(value)) : "—";
const daysLeft = value => value ? Math.max(0, Math.ceil((new Date(value) - Date.now()) / 86400000)) : 0;
const STATUS = {
  active:["✅","Aktif"], pending:["⏳","Ödeme bekleniyor"], receipt_sent:["🔎","İnceleme bekleniyor"],
  approved:["✅","Onaylandı"], rejected:["❌","Reddedildi"]
};
const PLAN_NAMES = {
  FREE_STARTER:"Ücretsiz Başlangıç", FAMILY_MONTHLY:"Aile Aylık", FAMILY_YEARLY:"Aile Yıllık"
};
const planName = plan => PLAN_NAMES[plan?.code] || plan?.name || "Plan";

export function isAdminUser(user) {
  return user?.app_metadata?.role === "admin" && user?.app_metadata?.is_admin === true;
}

export function planCards(plans) {
  const monthly = plans.find(x => x.code === "FAMILY_MONTHLY");
  return plans.map(plan => {
    const free = plan.code === "FREE_STARTER";
    const yearlySaving = plan.code === "FAMILY_YEARLY" && monthly ? Math.max(0, Number(monthly.price) * 12 - Number(plan.price)) : 0;
    const duration = plan.duration_days ? (plan.code === "FAMILY_YEARLY" ? "12 ay" : `${plan.duration_days} gün`) : "Ücretsiz erişim";
    return `<article class="card payment-plan" data-plan-code="${e(plan.code)}"><p class="eyebrow">ÜYELİK PLANI</p><h3>${e(planName(plan))}</h3><strong class="payment-price">${money(plan.price)}</strong><p>${duration}${free ? "" : " · mevcut sürenin üzerine eklenir"}</p>${yearlySaving ? `<p class="feedback correct">Aylık plana göre ${money(yearlySaving)} avantaj</p>` : ""}${free ? `<p class="meta">Manuel ödeme gerekmez.</p>` : `<button class="button primary" data-action="select-payment-plan" data-plan-code="${e(plan.code)}">Bu planı seç</button>`}</article>`;
  }).join("");
}

export function subscriptionCard(subscription) {
  if (!subscription) return `<article class="card membership-summary"><p class="eyebrow">AKTİF ÜYELİK</p><h2>Ücretli üyelik bulunmuyor</h2><p>Ücretsiz içeriklerden yararlanabilir veya aile planı seçebilirsin.</p></article>`;
  const status = STATUS[subscription.status] || ["ℹ️","Bilinmiyor"];
  return `<article class="card membership-summary"><p class="eyebrow">AKTİF ÜYELİK</p><h2>Aktif Aile Üyeliği</h2><div class="payment-facts"><span>Durum <strong>${status[0]} ${e(status[1])}</strong></span><span>Başlangıç <strong>${date(subscription.starts_at)}</strong></span><span>Bitiş <strong>${date(subscription.ends_at)}</strong></span><span>Kalan <strong>${daysLeft(subscription.ends_at)} gün</strong></span></div></article>`;
}

export function paymentHistory(payments) {
  if (!payments.length) return `<article class="card"><h2>Ödeme geçmişi</h2><p>Henüz ödeme talebi yok.</p></article>`;
  return `<section class="payment-history"><h2>Ödeme geçmişi</h2>${payments.map(row => {
    const status = STATUS[row.status] || ["ℹ️",row.status]; const receipt = row.payment_receipts?.[0]; const sub = row.subscriptions?.[0];
    return `<article class="card payment-history-row" data-payment-id="${e(row.id)}"><div><span class="status-badge status-${e(row.status)}">${status[0]} ${e(status[1])}</span><h3>${e(row.payment_code)}</h3><p>${e(planName(row.plans))} · ${money(row.payable_amount)}</p></div><dl><div><dt>Oluşturuldu</dt><dd>${date(row.created_at)}</dd></div><div><dt>Sonuçlandı</dt><dd>${date(row.reviewed_at)}</dd></div><div><dt>Yöntem</dt><dd>${row.payment_method === "instagram" ? "Instagram" : "Site içi dekont / Havale"}</dd></div><div><dt>Dekont</dt><dd>${receipt ? `${e(receipt.original_filename)} · ${formatBytes(receipt.size_bytes)}` : "Henüz yok"}</dd></div><div><dt>Üyelik süresi</dt><dd>${sub ? `${date(sub.starts_at)} – ${date(sub.ends_at)}` : "—"}</dd></div></dl>${row.admin_note ? `<p class="feedback incorrect"><strong>Yönetici notu:</strong> ${e(row.admin_note)}</p>` : ""}${["pending","receipt_sent"].includes(row.status) ? receiptUpload(row) : ""}</article>`;
  }).join("")}</section>`;
}

function receiptUpload(row) {
  return `<section class="receipt-panel"><h4>Önerilen: Dekontu güvenli yükle</h4><label class="field">PDF, JPG veya PNG · en fazla 10 MB<input type="file" data-receipt-file accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"></label><p data-file-summary class="meta">Dosya seçilmedi.</p><progress data-upload-progress max="100" value="0">0%</progress><div class="button-row"><button class="button primary" data-action="upload-receipt" data-payment-id="${e(row.id)}">Dekontu yükle</button>${row.payment_method === "instagram" && row.status === "pending" ? `<button class="button secondary" data-action="instagram-sent" data-payment-id="${e(row.id)}">Dekontu Instagram’dan gönderdim</button>` : ""}</div><p data-receipt-status aria-live="polite"></p></section>`;
}

export function paymentCenterView({ plans, subscription, payments }) {
  return `<section class="payment-center" data-route-page="membership"><div class="page-head"><div><p class="eyebrow">ÜYELİK VE ÖDEMELER</p><h1>Üyeliğini yönet</h1><p class="lead">Planını canlı fiyatlarla seç, ödeme kodunu al ve dekontunu güvenli yükle.</p></div><button class="button secondary" data-route="account">Hesaba dön</button></div>${subscriptionCard(subscription)}<section><h2>Planlar</h2><div class="payment-plan-grid">${planCards(plans)}</div></section><section class="card payment-request-panel" data-payment-request hidden><h2 data-request-title>Ödeme talebi</h2><form data-payment-form><input type="hidden" name="planCode"><div class="field"><label>Dekont yöntemi</label><select name="paymentMethod"><option value="bank_transfer">Site içinden güvenli dekont yükle (önerilen)</option><option value="instagram">Instagram’dan gönder</option></select></div><div class="field"><label>Kupon kodu (isteğe bağlı)</label><div class="inline-field"><input name="couponCode" maxlength="32" autocomplete="off"><button type="button" class="button secondary" data-action="validate-coupon">Kuponu doğrula</button></div></div><p data-coupon-result aria-live="polite"></p><div class="field"><label>Öğretmen / Davet Kodu (isteğe bağlı)</label><div class="inline-field"><input name="partnerCode" maxlength="24" autocomplete="off"><button type="button" class="button secondary" data-action="validate-partner-code">Kodu doğrula</button></div><small>Partner kodu fiyatı değiştirmez; kuponla birlikte kullanılabilir.</small></div><p data-partner-result aria-live="polite"></p><button class="button primary" data-action="create-payment">Ödeme talebi oluştur</button></form><div data-payment-result></div></section>${paymentHistory(payments)}</section>`;
}

export function paymentResult(row, instructions = PAYMENT_INSTRUCTIONS) {
  const bank = hasPaymentInstructions(instructions) ? `<section class="bank-transfer-card" aria-labelledby="bank-transfer-title"><p class="eyebrow">GÜVENLİ MANUEL ÖDEME</p><h3 id="bank-transfer-title">Banka Havale Bilgileri</h3><dl><div><dt>Banka adı</dt><dd>${e(instructions.bankName)}</dd></div><div><dt>Hesap sahibi</dt><dd>${e(instructions.accountHolder)}</dd></div><div><dt>IBAN</dt><dd class="bank-copy-row"><span data-copy-iban-value>${e(formatIban(instructions.iban))}</span><button type="button" class="button secondary" data-action="copy-iban">IBAN’ı Kopyala</button></dd></div><div><dt>Ödenecek tutar</dt><dd>${money(row.payable_amount)}</dd></div><div><dt>Ödeme kodu</dt><dd class="bank-copy-row"><span class="payment-code" data-copy-payment-code>${e(row.payment_code)}</span><button type="button" class="button secondary" data-action="copy-payment-code">Ödeme Kodunu Kopyala</button></dd></div></dl><p class="bank-transfer-warning">Havale/EFT açıklama alanına bu ödeme kodunu yazın: <strong>${e(row.payment_code)}</strong></p><p class="meta">Ödeme yaptıktan sonra dekontu site üzerinden yüklemenizi öneririz. Dekont göndermek ödeme onayı anlamına gelmez; üyeliğiniz yönetici ödemeyi onayladıktan sonra açılır.</p><p class="copy-status" data-copy-status aria-live="polite"></p></section>` : `<p class="feedback incorrect">Banka bilgileri henüz tanımlanmadı.</p>`;
  return `<article class="payment-created"><p class="feedback correct">✅ Ödeme talebin oluşturuldu.</p>${Number(row.payable_amount) === 0 ? `<p>Bu talep ödeme gerektirmiyor; üyelik incelemesi bekleniyor.</p>` : bank}</article>`;
}

export function adminPaymentsView(rows, { status="pending", search="" } = {}) {
  const visible = rows.filter(x => (status === "all" || x.status === status) && (!search || x.payment_code.toLowerCase().includes(search.toLowerCase())));
  return `<section class="payment-center admin-payments" data-route-page="admin-payments"><div class="page-head"><div><p class="eyebrow">YÖNETİCİ · ÖDEMELER</p><h1>Ödeme inceleme</h1></div><button class="button secondary" data-route="account">Hesaba dön</button></div><section class="card admin-payment-tools"><label>Durum<select data-admin-status><option value="pending" ${status==="pending"?"selected":""}>Bekleyen</option><option value="receipt_sent" ${status==="receipt_sent"?"selected":""}>Dekont gönderildi</option><option value="approved" ${status==="approved"?"selected":""}>Onaylandı</option><option value="rejected" ${status==="rejected"?"selected":""}>Reddedildi</option><option value="all" ${status==="all"?"selected":""}>Tümü</option></select></label><label>Ödeme kodu ara<input data-admin-search value="${e(search)}" placeholder="POMA-"></label></section><div class="admin-payment-list">${visible.length ? visible.map(adminRow).join("") : `<article class="card"><p>Bu filtrede ödeme yok.</p></article>`}</div></section>`;
}

function adminRow(row) {
  const status = STATUS[row.status] || ["ℹ️",row.status]; const receipt = row.receipts?.[0];
  return `<article class="card admin-payment-row" data-payment-id="${e(row.id)}"><div class="admin-payment-head"><div><span class="status-badge status-${e(row.status)}">${status[0]} ${e(status[1])}</span><h2>${e(row.payment_code)}</h2><p>${e(row.user_email)} · ${e(row.plan_name)}</p></div><strong>${money(row.payable_amount)}</strong></div><div class="payment-facts"><span>Liste fiyatı <strong>${money(row.list_price)}</strong></span><span>İndirim <strong>${money(row.discount_amount)}</strong></span><span>Yöntem <strong>${row.payment_method === "instagram" ? "Instagram" : "Havale / site içi"}</strong></span><span>Oluşturuldu <strong>${date(row.created_at)}</strong></span><span>Mevcut üyelik bitişi <strong>${date(row.current_subscription_ends_at)}</strong></span></div>${receipt ? `<button class="button secondary" data-action="open-admin-receipt">Dekontu güvenli aç</button>` : `<p class="meta">Dekont dosyası yok.</p>`}${["pending","receipt_sent"].includes(row.status) ? `<div class="admin-review"><label class="field">Yönetici notu<textarea data-admin-note rows="2"></textarea></label><div class="button-row"><button class="button primary" data-action="approve-payment">Ödemeyi onayla</button><button class="button danger" data-action="reject-payment">Notla reddet</button></div><p data-review-status aria-live="polite"></p></div>` : row.admin_note ? `<p>Yönetici notu: ${e(row.admin_note)}</p>` : ""}</article>`;
}

export function formatBytes(bytes) { const n=Number(bytes||0); return n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(1)} MB`; }
export function formatIban(value) { return String(value || "").replace(/\s+/g, "").replace(/(.{4})(?=.)/g, "$1 "); }
export function validateReceiptFile(file) {
  if (!file || !["application/pdf","image/jpeg","image/png"].includes(file.type)) throw new Error("PDF, JPG veya PNG dosyası seç.");
  if (!file.size || file.size > 10*1024*1024) throw new Error("Dosya en fazla 10 MB olabilir.");
  return true;
}
