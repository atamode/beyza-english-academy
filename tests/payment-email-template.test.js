import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {renderPaymentDecisionEmail} from "../supabase/functions/_shared/payment-email-template.mjs";

const base={plan_name:"Aile <script>alert(1)</script>",payment_code:'POMA-<b>"42"</b>',payable_amount:1299.5,membership_ends_at:"2026-08-19T12:00:00Z",admin_note:"<img src=x onerror=alert(1)> Lütfen tekrar deneyin"};
const mojibake=["Ãƒ","Ã„","Ã…","Ã‚","Ã¢â‚¬","ï¿½"];
const deploySources=["../supabase/functions/send-payment-decision-email/index.ts","../supabase/functions/_shared/payment-email-template.mjs"];

function assertCleanOutput(result){
  for(const token of mojibake)assert.doesNotMatch(`${result.subject}\n${result.text}\n${result.html}`,new RegExp(token));
}

test("approved payment email renders exact Turkish in text and HTML",()=>{
  const result=renderPaymentDecisionEmail({...base,decision:"approved"});
  assert.equal(result.subject,"Ödemeniz onaylandı — Poma Academy");
  assert.match(result.text,/Ödemeniz onaylandı/);assert.match(result.text,/Ödeme kodu: POMA-<b>"42"<\/b>/);assert.match(result.text,/1\.299,50/);assert.match(result.text,/Üyelik\/öğretmen erişim bitiş tarihi/);assert.match(result.text,/Poma Academy’ye Git/);assert.match(result.text,/Bu e-posta otomatik bir işlem bildirimidir\./);
  assert.match(result.html,/<meta charset="utf-8">/);assert.match(result.html,/<meta name="viewport" content="width=device-width,initial-scale=1">/);assert.match(result.html,/<h1[^>]*>Ödemeniz onaylandı<\/h1>/);assert.match(result.html,/Aile &lt;script&gt;alert\(1\)&lt;\/script&gt;/);assert.doesNotMatch(result.html,/<script>|<b>"42"<\/b>/);assert.match(result.html,/https:\/\/academy\.pomante\.com\.tr\/#\/membership/);
  assertCleanOutput(result);
});

test("rejected payment email renders exact Turkish and escaped admin note",()=>{
  const result=renderPaymentDecisionEmail({...base,decision:"rejected",membership_ends_at:null});
  assert.equal(result.subject,"Ödeme talebiniz hakkında — Poma Academy");
  assert.match(result.text,/Ödeme talebiniz onaylanamadı/);assert.match(result.text,/Yönetici notu: <img/);assert.match(result.text,/Sorularınız için bu e-postaya yanıt verebilirsiniz/);
  assert.match(result.html,/<h1[^>]*>Ödeme talebiniz onaylanamadı<\/h1>/);assert.match(result.html,/&lt;img src=x onerror=alert\(1\)&gt;/);assert.doesNotMatch(result.html,/<img src=x/);assert.doesNotMatch(`${result.text}${result.html}`,/kampanya|indirim fırsatı|pazarlama/i);assertCleanOutput(result);
});

test("deployed Edge Function sources are byte-level ASCII only",()=>{
  let combined="";for(const relative of deploySources){const bytes=fs.readFileSync(new URL(relative,import.meta.url));assert.equal([...bytes].every(byte=>byte<=127),true,relative);const source=bytes.toString("ascii");combined+=source;for(const token of mojibake)assert.equal(source.includes(token),false);}assert.match(combined,/\\u00d6/);assert.match(combined,/\\u0131/);
});
