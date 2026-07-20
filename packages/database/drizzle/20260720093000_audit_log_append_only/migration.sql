-- WO-159 Part 1 — Append-only enforcement on audit_log
-- ISO 27001 A.8.15 (protect) / ISO 27701 (integrity of records)
--
-- Audit records are evidentiary: they must be immutable. This trigger makes
-- audit_log append-only at the storage layer, enforced for EVERY role
-- (including superusers, whom RLS does not constrain):
--   * UPDATE is always forbidden.
--   * DELETE is forbidden unless the privileged retention job first sets the
--     `app.audit_retention` session GUC (WO-159 Part 3 / ISO 27001 A.8.10
--     information deletion). The `app.*` prefix is reserved by PostgreSQL for
--     application-settable custom variables, so no server-side registration is
--     needed; `SET LOCAL app.audit_retention = 'on'` is transaction-scoped.

CREATE OR REPLACE FUNCTION audit_log_deny_modify()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  -- UPDATE is never permitted: audit records are immutable.
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'audit_log is append-only: UPDATE is forbidden'
      USING ERRCODE = '42501',
            HINT = 'WO-159 Part 1 — audit records are immutable; emit a new row instead of mutating.';
  END IF;

  -- DELETE is permitted only for the retention job that has armed the GUC.
  IF TG_OP = 'DELETE' THEN
    IF COALESCE(current_setting('app.audit_retention', true), '') <> 'on' THEN
      RAISE EXCEPTION 'audit_log is append-only: DELETE requires app.audit_retention = ''on'''
        USING ERRCODE = '42501',
              HINT = 'WO-159 Part 1 — set SET LOCAL app.audit_retention = ''on'' in the retention job before pruning.';
    END IF;
  END IF;

  RETURN NULL; -- statement-level BEFORE trigger: return value is ignored
END;
$fn$;

DROP TRIGGER IF EXISTS audit_log_deny_modify ON audit_log;
CREATE TRIGGER audit_log_deny_modify
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH STATEMENT
  EXECUTE FUNCTION audit_log_deny_modify();
