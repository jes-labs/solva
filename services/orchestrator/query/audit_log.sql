-- Audit-log queries. The append-only log records each cycle event, including
-- reserve snapshots, with a jsonb payload. Retention (180 days) is enforced by a
-- scheduled purge, not here.

-- name: CreateAuditLog :exec
INSERT INTO audit_log (tenant_id, event, payload)
VALUES ($1, $2, $3);

-- name: ListAuditLog :many
SELECT id, tenant_id, event, payload, created_at
FROM audit_log
WHERE tenant_id = $1
ORDER BY created_at DESC
LIMIT $2;
