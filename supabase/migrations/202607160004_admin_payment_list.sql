create or replace function public.list_admin_payments()
returns table(
  id uuid, user_id uuid, user_email text, plan_code text, plan_name text,
  payment_code text, list_price numeric, discount_amount numeric, payable_amount numeric,
  payment_method text, instagram_username text, sender_name text, transfer_date date,
  status text, admin_note text, created_at timestamptz, reviewed_at timestamptz,
  current_subscription_ends_at timestamptz, receipts jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_poma_admin() then raise exception 'Yönetici yetkisi gerekli'; end if;
  return query
  select pr.id,pr.user_id,u.email::text,p.code,p.name,pr.payment_code,pr.list_price,
    pr.discount_amount,pr.payable_amount,pr.payment_method,pr.instagram_username,
    pr.sender_name,pr.transfer_date,pr.status,pr.admin_note,pr.created_at,pr.reviewed_at,
    (select max(s.ends_at) from public.subscriptions s where s.user_id=pr.user_id and s.status='active' and s.ends_at>now()),
    coalesce((select jsonb_agg(jsonb_build_object(
      'id',r.id,'storage_path',r.storage_path,'original_filename',r.original_filename,
      'mime_type',r.mime_type,'size_bytes',r.size_bytes,'created_at',r.created_at
    ) order by r.created_at desc) from public.payment_receipts r where r.payment_request_id=pr.id),'[]'::jsonb)
  from public.payment_requests pr
  join public.plans p on p.id=pr.plan_id
  join auth.users u on u.id=pr.user_id
  order by pr.created_at desc;
end
$$;

revoke all on function public.list_admin_payments() from public,anon,authenticated;
grant execute on function public.list_admin_payments() to authenticated;
