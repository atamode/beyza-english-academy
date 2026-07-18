-- Salt-okunur SECURITY DEFINER ve public şema yetki denetimi.
-- Bu dosya yalnız SELECT/CTE kullanır; DDL veya veri değişikliği içermez.
with security_definer_functions as (
  select
    p.oid,
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as identity_arguments,
    pg_get_userbyid(p.proowner) as owner_name,
    l.lanname as language_name,
    p.prosecdef as security_definer,
    has_function_privilege('public', p.oid, 'execute') as public_execute,
    has_function_privilege('anon', p.oid, 'execute') as anon_execute,
    has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute,
    has_function_privilege('service_role', p.oid, 'execute') as service_role_execute,
    p.proconfig,
    coalesce(
      (select split_part(config_item, '=', 2)
       from unnest(p.proconfig) as config_item
       where config_item like 'search_path=%'
       limit 1),
      '<missing>'
    ) as search_path,
    position('auth.uid' in lower(pg_get_functiondef(p.oid))) > 0 as definition_checks_auth_uid,
    position('auth.jwt' in lower(pg_get_functiondef(p.oid))) > 0 as definition_checks_auth_jwt,
    position('is_poma_admin' in lower(pg_get_functiondef(p.oid))) > 0 as definition_checks_is_poma_admin,
    position('service_role' in lower(pg_get_functiondef(p.oid))) > 0 as definition_checks_service_role
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join pg_language l on l.oid = p.prolang
  where n.nspname = 'public'
    and p.prosecdef
),
public_schema_create_privileges as (
  select
    has_schema_privilege('public', 'public', 'create') as public_schema_create,
    has_schema_privilege('anon', 'public', 'create') as anon_schema_create,
    has_schema_privilege('authenticated', 'public', 'create') as authenticated_schema_create,
    has_schema_privilege('service_role', 'public', 'create') as service_role_schema_create
)
select
  f.schema_name,
  f.function_name,
  f.identity_arguments,
  f.owner_name,
  f.language_name,
  f.security_definer,
  f.public_execute,
  f.anon_execute,
  f.authenticated_execute,
  f.service_role_execute,
  f.proconfig,
  f.search_path,
  f.definition_checks_auth_uid,
  f.definition_checks_auth_jwt,
  f.definition_checks_is_poma_admin,
  f.definition_checks_service_role,
  s.public_schema_create,
  s.anon_schema_create,
  s.authenticated_schema_create,
  s.service_role_schema_create
from security_definer_functions f
cross join public_schema_create_privileges s
order by f.function_name, f.identity_arguments;
