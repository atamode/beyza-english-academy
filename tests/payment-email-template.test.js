import test from "node:test";
import assert from "node:assert/strict";
import {renderPaymentDecisionEmail} from "../supabase/functions/_shared/payment-email-template.mjs";

const base={plan_name:"Aile <script>alert(1)</script>",payment_code:'POMA-<b>"42"</b>',payable_amount:1299.5,membership_ends_at:"2026-08-19T12:00:00Z",admin_note:"<img src=x onerror=alert(1)> Lütfen tekrar deneyin"};

test("approved payment email has transactional text and escaped HTML",()=>{
  const result=renderPaymentDecisionEmail({...base,decision:"approved"});
  assert.equal(result.subject,"Ödemeniz onaylandı — Poma Academy");
  assert.match(result.text,/Ödemeniz onaylandı/);assert.match(result.text,/POMA-<b>"42"<\/b>/);assert.match(result.text,/1\.299,50/);assert.match(result.text,/2026/);assert.match(result.text,/otomatik bir işlem bildirimidir/);
  assert.match(result.html,/Aile &lt;script&gt;alert\(1\)&lt;\/script&gt;/);assert.doesNotMatch(result.html,/<script>|<b>"42"<\/b>/);assert.match(result.html,/https:\/\/pomante\.com\.tr\/#\/membership/);
});

test("rejected payment email includes escaped admin note and text alternative",()=>{
  const result=renderPaymentDecisionEmail({...base,decision:"rejected",membership_ends_at:null});
  assert.equal(result.subject,"Ödeme talebiniz hakkında — Poma Academy");
  assert.match(result.text,/onaylanamadı/);assert.match(result.text,/Yönetici notu: <img/);assert.match(result.text,/yanıt verebilirsiniz/);
  assert.match(result.html,/&lt;img src=x onerror=alert\(1\)&gt;/);assert.doesNotMatch(result.html,/<img src=x/);assert.doesNotMatch(`${result.text}${result.html}`,/kampanya|indirim fırsatı|pazarlama/i);
});
