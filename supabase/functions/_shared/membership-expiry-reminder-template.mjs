const LINK="https://academy.pomante.com.tr/#/membership";
const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
const formatDate=value=>new Intl.DateTimeFormat("tr-TR",{timeZone:"Europe/Istanbul",dateStyle:"long",timeStyle:"short"}).format(new Date(value));

export function renderMembershipExpiryReminder(delivery){
  const teacher=delivery.entitlement_type==="teacher_access",seven=delivery.reminder_kind==="days_7";
  const subject=teacher
    ?(seven?"\u00d6\u011fretmen eri\u015fiminiz 7 g\u00fcn sonra sona eriyor \u2014 Poma Academy":"\u00d6\u011fretmen eri\u015fiminiz yar\u0131n sona eriyor \u2014 Poma Academy")
    :(seven?"\u00dcyeli\u011finiz 7 g\u00fcn sonra sona eriyor \u2014 Poma Academy":"\u00dcyeli\u011finiz yar\u0131n sona eriyor \u2014 Poma Academy");
  const heading=teacher?"\u00d6\u011fretmen eri\u015fimi hat\u0131rlatmas\u0131":"\u00dcyelik hat\u0131rlatmas\u0131";
  const remaining=seven?"7 g\u00fcn":"1 g\u00fcn";
  const planName=String(delivery.plan_name??""),planCode=String(delivery.plan_code??""),endsAt=formatDate(delivery.entitlement_ends_at);
  const cta=teacher?"Eri\u015fimi Yenile":"\u00dcyeli\u011fi Yenile";
  const text=[heading,`Kalan s\u00fcre: ${remaining}`,`Plan: ${planName} (${planCode})`,`Biti\u015f tarihi: ${endsAt}`,"Bu eri\u015fim otomatik olarak yenilenmez.",cta,LINK,"Sorular\u0131n\u0131z i\u00e7in bu e-postaya yan\u0131t verebilirsiniz."].join("\n");
  const html=`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f5f7fb;color:#172033;font-family:Arial,sans-serif"><main style="max-width:600px;margin:0 auto;padding:20px"><section style="background:#fff;border-radius:12px;padding:24px"><h1 style="font-size:24px">${heading}</h1><p><strong>Kalan s\u00fcre:</strong> ${remaining}</p><p><strong>Plan:</strong> ${escapeHtml(planName)} (${escapeHtml(planCode)})</p><p><strong>Biti\u015f tarihi:</strong> ${escapeHtml(endsAt)}</p><p>Bu eri\u015fim otomatik olarak yenilenmez.</p><p><a href="${LINK}" style="display:inline-block;background:#3157d5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px">${cta}</a></p><p style="color:#667085;font-size:14px">Sorular\u0131n\u0131z i\u00e7in bu e-postaya yan\u0131t verebilirsiniz.</p></section></main></body></html>`;
  return {subject,text,html};
}
