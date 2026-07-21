-- Public pricing is read-only and limited to active plans.
grant select on table public.plans to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.plans from anon, authenticated;

drop policy if exists "active plans are readable" on public.plans;
drop policy if exists "admins can read all plans" on public.plans;

create policy "active plans are readable"
on public.plans
for select
to anon, authenticated
using (active = true);

create policy "admins can read all plans"
on public.plans
for select
to authenticated
using (public.is_poma_admin());
