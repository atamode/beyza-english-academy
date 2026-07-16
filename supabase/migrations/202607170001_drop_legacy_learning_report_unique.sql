-- Remove the legacy child-only uniqueness rule left behind by its truncated
-- PostgreSQL-generated constraint name. Parent-owned uniqueness is enforced by
-- learning_report_snapshots_parent_child_period_key.
alter table public.learning_report_snapshots
  drop constraint if exists learning_report_snapshots_child_id_period_type_period_start_key;
