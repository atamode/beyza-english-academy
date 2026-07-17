-- Server-side gate for teacher classroom mutations (live migration 20260717081217).
create or replace function public.has_active_teacher_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.teacher_profiles tp
      join public.teacher_partner_profiles pp on pp.teacher_id = tp.id
      where tp.id = (select auth.uid())
        and tp.approval_status = 'approved'
        and pp.status = 'active'
        and pp.access_ends_at > now()
    );
$$;

revoke all on function public.has_active_teacher_access() from public, anon, authenticated;
grant execute on function public.has_active_teacher_access() to authenticated;

drop policy if exists "classes_insert_own" on public.classes;
create policy "classes_insert_own" on public.classes
for insert to authenticated
with check (
  teacher_id = (select auth.uid())
  and (select public.has_active_teacher_access())
);

drop policy if exists "classes_update_own" on public.classes;
create policy "classes_update_own" on public.classes
for update to authenticated
using (
  public.is_teacher_of_class(id)
  and (select public.has_active_teacher_access())
)
with check (
  teacher_id = (select auth.uid())
  and (select public.has_active_teacher_access())
);

drop policy if exists "classes_delete_own" on public.classes;
create policy "classes_delete_own" on public.classes
for delete to authenticated
using (
  public.is_teacher_of_class(id)
  and (select public.has_active_teacher_access())
);

drop policy if exists "assignments_insert_teacher" on public.assignments;
create policy "assignments_insert_teacher" on public.assignments
for insert to authenticated
with check (
  public.is_teacher_of_class(class_id)
  and (select public.has_active_teacher_access())
);

drop policy if exists "assignments_update_teacher" on public.assignments;
create policy "assignments_update_teacher" on public.assignments
for update to authenticated
using (
  public.is_teacher_of_class(class_id)
  and (select public.has_active_teacher_access())
)
with check (
  public.is_teacher_of_class(class_id)
  and (select public.has_active_teacher_access())
);

drop policy if exists "assignments_delete_teacher" on public.assignments;
create policy "assignments_delete_teacher" on public.assignments
for delete to authenticated
using (
  public.is_teacher_of_class(class_id)
  and (select public.has_active_teacher_access())
);

drop policy if exists "teacher_notes_insert_own" on public.teacher_notes;
create policy "teacher_notes_insert_own" on public.teacher_notes
for insert to authenticated
with check (
  teacher_id = (select auth.uid())
  and public.is_teacher_of_child(child_id)
  and (select public.has_active_teacher_access())
);

drop policy if exists "teacher_notes_update_own" on public.teacher_notes;
create policy "teacher_notes_update_own" on public.teacher_notes
for update to authenticated
using (
  teacher_id = (select auth.uid())
  and public.is_teacher_of_child(child_id)
  and (select public.has_active_teacher_access())
)
with check (
  teacher_id = (select auth.uid())
  and public.is_teacher_of_child(child_id)
  and (select public.has_active_teacher_access())
);

drop policy if exists "teacher_notes_delete_own" on public.teacher_notes;
create policy "teacher_notes_delete_own" on public.teacher_notes
for delete to authenticated
using (
  teacher_id = (select auth.uid())
  and public.is_teacher_of_child(child_id)
  and (select public.has_active_teacher_access())
);

drop policy if exists "class_students_delete_allowed" on public.class_students;
create policy "class_students_delete_allowed" on public.class_students
for delete to authenticated
using (
  (
    public.is_teacher_of_class(class_id)
    and (select public.has_active_teacher_access())
  )
  or public.can_manage_child(child_id)
);

-- The event trigger invokes this internally; API roles do not need EXECUTE.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
