import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const sql=read("supabase/migrations/20260719000500_full_refund_access_termination.sql");
const service=read("js/payment-service.js");
const views=read("js/payment-views.js");
const entry=read("js/payment-entry.js");
const teacherViews=read("js/teacher-partner-views.js");
const matrix=read("docs/security/SECURITY_DEFINER_MATRIX_2026-07-18.md");
const rpcNames=["request_refund","admin_review_refund","admin_complete_refund","admin_resolve_refund_accounting_alert","list_admin_refunds"];

test("1 refund tabloları RLS ile kapalıdır",()=>{
  for(const table of ["refund_requests","refund_events","refund_accounting_alerts"])assert.match(sql,new RegExp(`alter table public\\.${table} enable row level security`));
});
test("2 client doğrudan refund mutasyonu yapmaz",()=>{
  assert.doesNotMatch(service,/from\("refund_(?:requests|events|accounting_alerts)"\)\.(?:insert|update|delete|upsert)/);
  assert.match(sql,/grant select on public\.refund_requests,public\.refund_events,public\.refund_accounting_alerts to authenticated/);
});
test("3 payment approved durumu korunur",()=>{assert.doesNotMatch(sql,/update public\.payment_requests set status='refunded'/);assert.doesNotMatch(sql,/add value.*refunded/i);});
test("4 refund tutarı server payable_amount değeridir",()=>{assert.match(sql,/values\(p\.id,auth\.uid\(\),p\.payable_amount,btrim\(p_reason\)\)/);assert.match(sql,/payable_amount=r\.refund_amount/);});
test("5 kullanıcı yalnız kendi ödemesine talep açar",()=>{assert.match(sql,/p\.user_id<>auth\.uid\(\)/);});
test("6 yalnız approved ödeme iade edilebilir",()=>{assert.match(sql,/p\.status<>'approved'/);assert.doesNotMatch(sql,/p\.status in\('pending','rejected','expired'\)/);});
test("7 sıfır tutarlı ödeme reddedilir",()=>{assert.match(sql,/p\.payable_amount<=0/);});
test("8 aynı ödeme için iki açık talep yoktur",()=>{assert.match(sql,/unique index refund_requests_one_open_idx[\s\S]*status in\('requested','approved'\)/);});
test("9 aynı ödeme yalnız bir kez completed olur",()=>{assert.match(sql,/unique index refund_requests_one_completed_idx[\s\S]*status='completed'/);});
test("10 aile planında deterministik son aktif dönem seçilir",()=>{assert.match(sql,/order by n\.ends_at desc,n\.created_at desc,n\.id desc limit 1/);});
test("11 sonraki subscription eski dönemi engeller",()=>{assert.match(sql,/s\.id<>\(select n\.id from public\.subscriptions/);});
test("12 yalnız kaynak latest subscription cancelled olur ve önceki satır korunur",()=>{const statement=sql.match(/update public\.subscriptions set status='cancelled'[^;]+;/)?.[0]||"";assert.match(statement,/where id=s\.id/);assert.doesNotMatch(statement,/where user_id=p\.user_id/);});
test("13 önceki üyelik yoksa kaynak ücretli erişim sona erer",()=>{assert.match(sql,/set status='cancelled',cancelled_at=now\(\),cancelled_by_refund_id=r\.id/);});
test("14 süresi geçmiş active subscription satırları expired olur",()=>{assert.match(sql,/set status='expired',updated_at=now\(\) where user_id=p\.user_id and status='active' and ends_at<=now\(\)/);});
test("15 teacher credit silinmez revoked olur",()=>{assert.match(sql,/teacher_access_credits set status='revoked'/);assert.doesNotMatch(sql,/delete from public\.teacher_access_credits/);});
test("16 yalnız kullanılmamış teacher access süresi geri alınır",()=>{assert.match(sql,/remaining:=greatest\(interval '0',c\.ends_at-greatest\(now\(\),c\.starts_at\)\)/);assert.match(sql,/removable:=least\(remaining,available\)/);});
test("17 referral credit refund ödeme kaynağıyla bulunur",()=>{assert.match(sql,/teacher_access_credits where source_payment_request_id=p\.id/);});
test("18 pending ve payable komisyon cancelled olur",()=>{assert.match(sql,/e\.status in\('pending','payable'\)[\s\S]*status='cancelled'/);assert.match(sql,/cancellation_reason='payment_refunded'/);});
test("19 pending_payout değişmez ve uyarı oluşur",()=>{const cancellation=sql.match(/update public\.teacher_commission_earnings set status='cancelled'[^;]+;/)?.[0]||"";assert.match(sql,/e\.status in\('pending_payout','paid'\)/);assert.match(sql,/commission_reserved_in_payout/);assert.doesNotMatch(cancellation,/pending_payout/);});
test("20 paid değişmez ve uyarı oluşur",()=>{assert.match(sql,/commission_already_paid/);assert.match(sql,/refund_accounting_alerts/);});
test("21 payout tutarı ve bağlı earning toplamları değişmez",()=>{assert.doesNotMatch(sql,/update public\.teacher_commission_payouts/);assert.doesNotMatch(sql,/set commission_amount/);});
test("22 completed çağrı idempotenttir",()=>{assert.match(sql,/if r\.status='completed' then return r;end if/);});
test("23 bütün refund geçişleri event üretir",()=>{for(const action of ["refund_requested","refund_approved","refund_rejected","refund_cancelled","refund_completed","refund_accounting_alert_created","refund_accounting_alert_resolved"])assert.match(sql,new RegExp(action));});
test("24 admin geçişleri ortak audit üretir",()=>{for(const action of ["refund_'\\|\\|p_decision","refund_completed","refund_accounting_alert_resolved"])assert.match(sql,new RegExp(`record_admin_audit\\('${action}`));});
test("25 geçersiz reminder delivery skipped olur",()=>{assert.match(sql,/status='skipped',skipped_at=now\(\),skip_reason='entitlement_refunded'/);assert.match(sql,/status in\('pending','failed'\)/);});
test("26 PUBLIC ve anon execute kapalıdır",()=>{assert.match(sql,/revoke all on function[\s\S]*from public,anon,authenticated,service_role/);assert.match(matrix,/PUBLIC execute \| 0/);assert.match(matrix,/anon execute \| 0/);});
test("27 yeni SECURITY DEFINER fonksiyonların search_path değeri boştur",()=>{for(const name of rpcNames)assert.match(sql,new RegExp(`function public\\.${name}\\([\\s\\S]*?security definer set search_path=''`));});
test("28 user ve admin frontend doğru RPC'leri çağırır",()=>{for(const name of rpcNames)assert.match(service,new RegExp(`rpc\\("${name}"`));for(const action of ["request-refund","approve-refund","reject-refund","cancel-refund","complete-refund","resolve-refund-alert"])assert.match(entry,new RegExp(action));});
test("29 kullanıcı amount veya status gönderemez",()=>{const requestCall=service.match(/rpc\("request_refund", \{([\s\S]*?)\}\)/)?.[1]||"";assert.match(requestCall,/p_payment_request_id/);assert.match(requestCall,/p_reason/);assert.doesNotMatch(requestCall,/amount|status/i);});
test("30 Türkçe metinler ve öğretmen cancelled etiketi bozuk değildir",()=>{for(const source of [sql,service,views,entry,teacherViews])assert.doesNotMatch(source,/Ã.|Ä.|Å.|â€|ï¸/);assert.match(teacherViews,/İade nedeniyle iptal edildi/);assert.match(views,/İade tamamlandı/);});
