const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const amount=value=>new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY"}).format(Number(value||0));
const date=value=>value?new Intl.DateTimeFormat("tr-TR",{dateStyle:"long",timeStyle:"short",timeZone:"Europe/Istanbul"}).format(new Date(value)):"—";
const LINK="https://pomante.com.tr/#/membership";

export function renderPaymentDecisionEmail(delivery){
  const approved=delivery.decision==="approved",subject=approved?"Ödemeniz onaylandı — Poma Academy":"Ödeme talebiniz hakkında — Poma Academy";
  const plan=String(delivery.plan_name??""),code=String(delivery.payment_code??""),price=amount(delivery.payable_amount),note=String(delivery.admin_note??"");
  const detail=approved?`Üyelik/öğretmen erişim bitiş tarihi: ${date(delivery.membership_ends_at)}`:`Yönetici notu: ${note}`;
  const text=[approved?"Ödemeniz onaylandı.":"Ödeme talebiniz onaylanamadı.",`Plan: ${plan}`,`Tutar: ${price}`,`Ödeme kodu: ${code}`,detail,approved?"Poma Academy’ye Git":"Yeni ödeme talebi oluştur",LINK,approved?"Bu e-posta otomatik bir işlem bildirimidir.":"Sorularınız için bu e-postaya yanıt verebilirsiniz."].join("\n");
  const html=`<!doctype html><html lang="tr"><body style="margin:0;background:#f5f7fb;color:#172033;font-family:Arial,sans-serif"><main style="max-width:600px;margin:0 auto;padding:24px"><section style="background:#fff;border-radius:12px;padding:24px"><h1 style="font-size:24px">${approved?"Ödemeniz onaylandı":"Ödeme talebiniz onaylanamadı"}</h1><p><strong>Plan:</strong> ${escapeHtml(plan)}</p><p><strong>Tutar:</strong> ${escapeHtml(price)}</p><p><strong>Ödeme kodu:</strong> ${escapeHtml(code)}</p>${approved?`<p><strong>Üyelik/öğretmen erişim bitiş tarihi:</strong> ${escapeHtml(date(delivery.membership_ends_at))}</p>`:`<p><strong>Yönetici notu:</strong> ${escapeHtml(note)}</p>`}<p><a href="${LINK}" style="display:inline-block;background:#3157d5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px">${approved?"Poma Academy’ye Git":"Yeni ödeme talebi oluştur"}</a></p><p style="color:#667085;font-size:14px">${approved?"Bu e-posta otomatik bir işlem bildirimidir.":"Sorularınız için bu e-postaya yanıt verebilirsiniz."}</p></section></main></body></html>`;
  return {subject,text,html};
}
