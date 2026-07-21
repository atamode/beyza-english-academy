const e = value => String(value ?? "").replace(/[&<>\"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
const money = value => new Intl.NumberFormat("tr-TR", { style:"currency", currency:"TRY" }).format(Number(value || 0));
const ORDER = ["FREE_STARTER", "FAMILY_MONTHLY", "FAMILY_YEARLY"];

export function annualSaving(plans) {
  const monthly=plans.find(plan=>plan.code==="FAMILY_MONTHLY"),yearly=plans.find(plan=>plan.code==="FAMILY_YEARLY");
  return monthly&&yearly?Math.max(0,Number(monthly.price)*12-Number(yearly.price)):0;
}

function planCard(plan, saving) {
  const free=plan.code==="FREE_STARTER",yearly=plan.code==="FAMILY_YEARLY";
  const duration=free?"Ücretsiz deneme ve başlangıç içerikleri":yearly?"Takvimsel 12 aylık kullanım":`${Number(plan.duration_days)||30} günlük kullanım`;
  const cta=free?"Ücretsiz Başla":yearly?"Yıllık Üyeliği Seç":"Aylık Üyeliği Seç";
  return `<article class="card landing-pricing-card ${yearly?"is-featured":""}" data-pricing-plan="${e(plan.code)}">${yearly?`<span class="pricing-badge">En avantajlı</span>`:""}<p class="eyebrow">ÜYELİK PLANI</p><h3>${e(plan.name)}</h3><p class="landing-price">${free?"Ücretsiz":money(plan.price)}</p><p>${duration}</p><ul class="landing-plan-features"><li>${free?"Seçili başlangıç dersleri, hikâyeler ve oyunlar":"Oyunlarla İngilizce öğrenme ve veli panelinde ilerleme görünürlüğü"}</li><li>${Number(plan.child_limit)||1} çocuk profiline kadar kullanım</li><li>${plan.active===false?"Plan kullanıma kapalı":"Plan şu anda aktif"}</li></ul>${yearly&&saving>0?`<p class="pricing-saving">Aylık plana göre ${money(saving)} gerçek avantaj</p>`:""}<button type="button" class="button ${yearly?"primary":"secondary"}" data-action="choose-pricing-plan" data-plan-code="${e(plan.code)}" aria-label="${e(cta)}">${e(cta)}</button></article>`;
}

export function pricingPlansView(plans) {
  const rows=[...plans].filter(plan=>ORDER.includes(plan.code)).sort((a,b)=>ORDER.indexOf(a.code)-ORDER.indexOf(b.code)),saving=annualSaving(rows);
  return `<div class="landing-pricing-grid">${rows.map(plan=>planCard(plan,saving)).join("")}</div>`;
}

export function pricingSectionShell(content = `<p class="pricing-loading" role="status">Planlar yükleniyor…</p>`) {
  return `<section class="landing-pricing-section" data-pricing-section aria-labelledby="pricing-title"><div class="landing-pricing-heading"><p class="eyebrow">AİLE ÜYELİĞİ</p><h2 id="pricing-title">Çocuğunuz için uygun planı seçin</h2><p class="lead">Oyunlar, hikâyeler ve derslerle öğrenmeyi destekleyin; mevcut veli panelinden ilerlemeyi takip edin.</p></div><div data-pricing-content>${content}</div><aside class="pricing-trust" aria-label="Ödeme güvenliği"><strong>Güvenli manuel ödeme</strong><span>Site içinden dekont yükleme</span><span>Yönetici kontrolünden sonra üyelik açılışı</span><span>Ödeme ve üyelik geçmişi kullanıcı panelinde saklanır</span></aside></section>`;
}

export function pricingErrorView() { return `<div class="card pricing-error" role="alert"><h3>Planlar şu anda yüklenemedi</h3><p>Fiyat bilgileri geçici olarak gösterilemiyor. Lütfen yeniden deneyin.</p><button type="button" class="button secondary" data-action="retry-pricing">Tekrar dene</button></div>`; }
