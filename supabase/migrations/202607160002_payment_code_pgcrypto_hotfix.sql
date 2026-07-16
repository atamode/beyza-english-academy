-- Supabase installs pgcrypto in the extensions schema. Keep the SECURITY DEFINER
-- search_path narrow and qualify digest explicitly.
create or replace function public.generate_payment_code()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare token text;
begin
  token := upper(substr(encode(extensions.digest(
    nextval('public.payment_code_seq')::text || clock_timestamp()::text || gen_random_uuid()::text,
    'sha256'
  ), 'hex'), 1, 6));
  return 'POMA-' || token;
end
$$;

revoke all on function public.generate_payment_code() from public, anon, authenticated;
