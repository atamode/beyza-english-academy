-- Optional live-RLS fixture. Run manually in SQL Editor with an authorized role.
-- It is intentionally narrow and does not create invitation/class codes.
insert into public.coupons
  (code,discount_type,discount_value,valid_plan_codes,max_redemptions,per_user_limit,starts_at,ends_at,active)
values
  ('RLS_PERCENT_5','percent',5,array['FAMILY_MONTHLY'],100,10,now()-interval '1 day',now()+interval '7 days',true),
  ('RLS_EXPIRED','fixed',10,array['FAMILY_MONTHLY'],100,10,now()-interval '7 days',now()-interval '1 day',true),
  ('RLS_WRONG_PLAN','fixed',10,array['FAMILY_YEARLY'],100,10,now()-interval '1 day',now()+interval '7 days',true)
on conflict (code) do update set
 discount_type=excluded.discount_type,discount_value=excluded.discount_value,
 valid_plan_codes=excluded.valid_plan_codes,max_redemptions=excluded.max_redemptions,
 per_user_limit=excluded.per_user_limit,starts_at=excluded.starts_at,ends_at=excluded.ends_at,active=excluded.active;
