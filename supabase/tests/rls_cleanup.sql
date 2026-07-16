-- Manual, narrow cleanup only. Replace the two UUID placeholders with the dedicated RLS test user IDs.
-- Review the selected rows before executing the DELETE section.
begin;
do $$
declare
  user_a uuid := '00000000-0000-0000-0000-000000000000';
  user_b uuid := '00000000-0000-0000-0000-000000000000';
begin
  if user_a='00000000-0000-0000-0000-000000000000' or user_b='00000000-0000-0000-0000-000000000000' then
    raise exception 'Set the dedicated RLS test user UUIDs before cleanup';
  end if;
  delete from storage.objects where bucket_id='payment-receipts' and (name like user_a::text||'/%' or name like user_b::text||'/%');
  delete from public.subscriptions where user_id in (user_a,user_b)
    and source_payment_request_id in (select id from public.payment_requests where user_id in(user_a,user_b) and sender_name like 'RLS-%');
  delete from public.payment_requests where user_id in(user_a,user_b) and sender_name like 'RLS-%';
end $$;
rollback; -- Change to COMMIT only after reviewing the scoped statements.
