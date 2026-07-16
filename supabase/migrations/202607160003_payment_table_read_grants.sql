-- PostgREST requires table-level privileges before RLS can filter rows.
-- Deliberately grant read only; all mutations remain RPC-controlled.
grant select on
  public.plans,
  public.payment_requests,
  public.payment_receipts,
  public.subscriptions,
  public.coupons,
  public.coupon_redemptions
to authenticated;

revoke insert, update, delete, truncate, references, trigger on
  public.plans,
  public.payment_requests,
  public.payment_receipts,
  public.subscriptions,
  public.coupons,
  public.coupon_redemptions
from authenticated, anon;
