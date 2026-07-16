import { getRoute, navigate } from "./router.js";
import { getSupabaseClient } from "./supabase-client.js";
import { createPaymentService } from "./payment-service.js";
import { adminPaymentsView, formatBytes, isAdminUser, paymentCenterView, paymentResult, validateReceiptFile } from "./payment-views.js";

const app = document.querySelector("#app");
const client = getSupabaseClient();
const payments = createPaymentService(client);
let screen = { userId:null, plans:[], paymentRows:[], subscription:null, adminRows:[], adminFilter:{ status:"pending", search:"" }, busy:new Set() };

function clearSensitiveState() {
  screen = { userId:null, plans:[], paymentRows:[], subscription:null, adminRows:[], adminFilter:{ status:"pending", search:"" }, busy:new Set() };
}

async function currentUser() {
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return data?.user || null;
}

function friendlyError(error, fallback="İşlem tamamlanamadı. Lütfen tekrar dene.") {
  console.error("Payment UI error", error);
  const message=String(error?.message||"");
  if (/daha önce incelendi|already/i.test(message)) return "Bu ödeme daha önce işlenmiş. Liste yenilendi.";
  if (/kupon|coupon/i.test(message)) return "Kupon geçersiz, süresi dolmuş veya kullanım limiti dolmuş.";
  if (/network|fetch|bağlantı/i.test(message)) return "Bağlantı kurulamadı. Yeniden deneyebilirsin; yeni kayıt oluştuğundan emin olmak için ödeme geçmişini kontrol et.";
  return fallback;
}

async function renderMembership() {
  const user = await currentUser();
  if (!user) return navigate("login");
  if (screen.userId !== user.id) clearSensitiveState();
  screen.userId = user.id;
  app.innerHTML = `<section class="card"><p>Üyelik bilgileri güvenli biçimde yükleniyor…</p></section>`;
  try {
    [screen.plans,screen.paymentRows,screen.subscription] = await Promise.all([
      payments.listPlans(), payments.listMyPayments(user.id), payments.getMySubscription(user.id)
    ]);
    app.innerHTML = paymentCenterView({ plans:screen.plans, payments:screen.paymentRows, subscription:screen.subscription });
    app.focus();
  } catch (error) { app.innerHTML=`<section class="card"><h1>Üyelik bilgileri yüklenemedi</h1><p>${friendlyError(error)}</p><button class="button secondary" data-action="reload-membership">Yeniden dene</button></section>`; }
}

async function renderAdmin() {
  const user = await currentUser();
  if (!user) return navigate("login");
  if (!isAdminUser(user)) { clearSensitiveState(); app.innerHTML=`<section class="card"><h1>Bu sayfaya erişim yetkin yok.</h1><button class="button secondary" data-route="account">Hesaba dön</button></section>`; return; }
  screen.userId=user.id;
  app.innerHTML=`<section class="card"><p>Bekleyen ödemeler yükleniyor…</p></section>`;
  try { screen.adminRows=await payments.listAdminPayments(); renderAdminRows(); }
  catch(error){app.innerHTML=`<section class="card"><h1>Ödemeler yüklenemedi</h1><p>${friendlyError(error)}</p><button class="button secondary" data-action="reload-admin">Yeniden dene</button></section>`;}
}

function renderAdminRows(){app.innerHTML=adminPaymentsView(screen.adminRows,screen.adminFilter);app.focus();}

async function routePaymentPage() {
  const route=getRoute();
  if (route === "membership") return renderMembership();
  if (route === "admin-payments") return renderAdmin();
  clearSensitiveState();
  if (route === "account") setTimeout(injectAccountLinks,0);
}

async function injectAccountLinks() {
  if (getRoute()!=="account") return;
  const user=await currentUser().catch(()=>null); if(!user || app.querySelector("[data-payment-account-card]")) return;
  const section=document.createElement("section"); section.className="card payment-account-card"; section.dataset.paymentAccountCard="";
  section.innerHTML=`<p class="eyebrow">ÜYELİK</p><h2>Üyelik ve Ödemeler</h2><p>Planını, aktif üyeliğini, dekontlarını ve ödeme geçmişini yönet.</p><div class="button-row"><button class="button primary" data-route="membership">Üyelik ve Ödemeler</button>${isAdminUser(user)?`<button class="button secondary" data-route="admin-payments">Ödeme inceleme</button>`:""}</div>`;
  app.append(section);
}

window.addEventListener("hashchange",()=>queueMicrotask(routePaymentPage));
setTimeout(routePaymentPage,0);
new MutationObserver(()=>{if(getRoute()==="account")injectAccountLinks();}).observe(app,{childList:true});

document.addEventListener("change",event=>{
  if(event.target.matches("[data-receipt-file]")){
    const file=event.target.files?.[0],panel=event.target.closest(".receipt-panel"),summary=panel?.querySelector("[data-file-summary]");
    if(summary) summary.textContent=file?`${file.name} · ${formatBytes(file.size)}`:"Dosya seçilmedi.";
  }
  if(event.target.matches("[data-admin-status]")){screen.adminFilter.status=event.target.value;renderAdminRows();}
});

document.addEventListener("input",event=>{
  if(event.target.matches("[data-admin-search]")){screen.adminFilter.search=event.target.value;renderAdminRows();app.querySelector("[data-admin-search]")?.focus();}
});

document.addEventListener("click",async event=>{
  const routeButton=event.target.closest("[data-route]");
  if(routeButton && (routeButton.closest("[data-payment-account-card]") || routeButton.closest(".payment-center") || getRoute()==="admin-payments")) { event.preventDefault(); navigate(routeButton.dataset.route); return; }
  const button=event.target.closest("[data-action]"); if(!button) return;
  const action=button.dataset.action;
  if(action==="reload-membership") return renderMembership(); if(action==="reload-admin") return renderAdmin();
  if(action==="select-payment-plan"){
    const plan=screen.plans.find(x=>x.code===button.dataset.planCode); if(!plan || plan.code==="FREE_STARTER")return;
    const panel=app.querySelector("[data-payment-request]"); panel.hidden=false; panel.querySelector("[name=planCode]").value=plan.code; panel.querySelector("[data-request-title]").textContent=`${plan.name} ödeme talebi`; panel.scrollIntoView({behavior:"smooth",block:"center"}); return;
  }
  if(action==="validate-coupon"){
    const form=button.closest("form"),result=form.querySelector("[data-coupon-result]"),code=form.couponCode.value.trim(); if(!code){result.textContent="Kupon kodu gir.";return;}
    button.disabled=true; try{const quote=await payments.validateCoupon(form.planCode.value,code);result.className="feedback correct";result.textContent=`Kupon geçerli. İndirim sunucu tarafından uygulandı; ödenecek tutar ${new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY"}).format(Number(quote.payable_amount||0))}.`;}
    catch(error){result.className="feedback incorrect";result.textContent=friendlyError(error,"Kupon doğrulanamadı.");}finally{button.disabled=false;} return;
  }
  if(action==="create-payment"){
    const form=button.closest("form"),key=`create:${form.planCode.value}`; if(screen.busy.has(key))return; screen.busy.add(key);button.disabled=true;
    try{const row=await payments.createPaymentRequest({planCode:form.planCode.value,paymentMethod:form.paymentMethod.value,couponCode:form.couponCode.value.trim()||null});await renderMembership();const panel=app.querySelector("[data-payment-request]");panel.hidden=false;panel.querySelector("[name=planCode]").value=row.plans?.code||form.planCode.value;panel.querySelector("[data-payment-result]").innerHTML=paymentResult(row);panel.scrollIntoView({behavior:"smooth",block:"center"});}
    catch(error){form.closest("[data-payment-request]").querySelector("[data-payment-result]").innerHTML=`<p class="feedback incorrect">${friendlyError(error)}</p>`;}finally{screen.busy.delete(key);button.disabled=false;} return;
  }
  if(action==="upload-receipt"){
    const panel=button.closest(".receipt-panel"),file=panel.querySelector("[data-receipt-file]").files?.[0],status=panel.querySelector("[data-receipt-status]"),progress=panel.querySelector("[data-upload-progress]"),key=`upload:${button.dataset.paymentId}`;
    try{validateReceiptFile(file);}catch(error){status.className="feedback incorrect";status.textContent=error.message;return;} if(screen.busy.has(key))return;screen.busy.add(key);button.disabled=true;progress.value=10;
    try{await payments.uploadPaymentReceipt({paymentRequestId:button.dataset.paymentId,userId:screen.userId,file});progress.value=100;status.className="feedback correct";status.textContent="Dekont güvenli biçimde yüklendi. İnceleme bekleniyor.";setTimeout(renderMembership,500);}
    catch(error){progress.value=0;status.className="feedback incorrect";status.textContent=friendlyError(error,"Dekont yüklenemedi.");}finally{screen.busy.delete(key);button.disabled=false;}return;
  }
  if(action==="instagram-sent"){
    const key=`instagram:${button.dataset.paymentId}`;if(screen.busy.has(key))return;screen.busy.add(key);button.disabled=true;
    try{await payments.markInstagramReceiptSent(button.dataset.paymentId,"");alert("Bildirim alındı. Ödeme onaylanmadı; inceleme bekleniyor.");await renderMembership();}catch(error){alert(friendlyError(error));}finally{screen.busy.delete(key);button.disabled=false;}return;
  }
  const reviewCard=button.closest(".admin-payment-row"),paymentId=reviewCard?.dataset.paymentId,key=`review:${paymentId}`;
  if(action==="open-admin-receipt"){
    const row=screen.adminRows.find(x=>x.id===paymentId),path=row?.receipts?.[0]?.storage_path;if(!path)return;button.disabled=true;
    try{const url=await payments.getReceiptSignedUrl(path,60);window.open(url,"_blank","noopener,noreferrer");}catch(error){alert(friendlyError(error,"Dekont açılamadı."));}finally{button.disabled=false;}return;
  }
  if(action==="approve-payment"||action==="reject-payment"){
    if(screen.busy.has(key))return;const note=reviewCard.querySelector("[data-admin-note]").value.trim(),status=reviewCard.querySelector("[data-review-status]");
    if(action==="reject-payment"&&!note){status.className="feedback incorrect";status.textContent="Reddetmek için yönetici notu zorunlu.";return;}
    if(!confirm(action==="approve-payment"?"Bu ödemeyi onaylayıp üyeliği açmak istiyor musun?":"Bu ödemeyi notla reddetmek istiyor musun?"))return;
    screen.busy.add(key);reviewCard.querySelectorAll("[data-action='approve-payment'],[data-action='reject-payment']").forEach(x=>x.disabled=true);
    try{if(action==="approve-payment")await payments.approvePayment(paymentId,note||null);else await payments.rejectPayment(paymentId,note);await renderAdmin();}
    catch(error){status.className="feedback incorrect";status.textContent=friendlyError(error);await renderAdmin();}finally{screen.busy.delete(key);}return;
  }
});

export { clearSensitiveState };
