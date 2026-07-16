import { trackEvent } from "./analytics.js";
import { createPaymentService } from "./payment-service.js";
import { getRoute, navigate } from "./router.js";
import { getSupabaseClient } from "./supabase-client.js";
import { readPricingSelection, savePricingSelection } from "./pricing-state.js";
import { pricingErrorView, pricingPlansView, pricingSectionShell } from "./pricing-views.js";

const app=document.querySelector("#app"),client=getSupabaseClient(),payments=createPaymentService(client);
let loading=false,viewTracked=false,continuing=false;

async function loadPricing() {
  const section=app.querySelector("[data-pricing-section]"),content=section?.querySelector("[data-pricing-content]");if(!content||loading)return;
  loading=true;content.innerHTML=`<p class="pricing-loading" role="status">Planlar yükleniyor…</p>`;
  try { const plans=await payments.listPlans();if(!Array.isArray(plans)||plans.length<3)throw new Error("Eksik plan verisi");content.innerHTML=pricingPlansView(plans); }
  catch { content.innerHTML=pricingErrorView(); }
  finally { loading=false; }
}

function injectPricing() {
  if(getRoute()!=="home"||app.querySelector("[data-pricing-section]"))return;
  const anchor=app.querySelector(".seo-landing .landing-hero");if(!anchor)return;
  const host=document.createElement("div");host.innerHTML=pricingSectionShell();const section=host.firstElementChild;
  anchor.insertAdjacentElement("afterend",section);loadPricing();
  if(!viewTracked){viewTracked=true;trackEvent("pricing_section_view",{source:"landing"});}
}

async function continueAfterAuth() {
  if(continuing||!readPricingSelection()||!["profiles","account","home"].includes(getRoute()))return;
  continuing=true;try{const user=(await client.auth.getUser().catch(()=>({data:{user:null}}))).data?.user;if(user)navigate("membership");}finally{continuing=false;}
}

document.addEventListener("click",async event=>{
  const button=event.target.closest("[data-action]");if(!button)return;
  if(button.dataset.action==="retry-pricing"){loadPricing();return;}
  if(button.dataset.action!=="choose-pricing-plan")return;
  const planCode=button.dataset.planCode;trackEvent("pricing_plan_selected",{plan_code:planCode,source:"landing"});
  const user=(await client.auth.getUser().catch(()=>({data:{user:null}}))).data?.user;
  if(planCode==="FREE_STARTER"){if(user)navigate("profiles");else{trackEvent("signup_started_from_pricing",{plan_code:planCode,source:"landing"});navigate("signup");}return;}
  if(!savePricingSelection(planCode))return;
  if(user)navigate("membership");else{trackEvent("signup_started_from_pricing",{plan_code:planCode,source:"landing"});navigate("signup");}
});

window.addEventListener("hashchange",()=>queueMicrotask(()=>{injectPricing();continueAfterAuth();}));
new MutationObserver(()=>{injectPricing();continueAfterAuth();}).observe(app,{childList:true});
setTimeout(()=>{injectPricing();continueAfterAuth();},0);
