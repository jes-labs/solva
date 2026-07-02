-- Tenant queries. The orchestrator does not own tenant creation in production
-- (that is the control plane), but the repo and tests need to insert one so the
-- foreign keys on proofs, customers, and liabilities resolve.

-- name: CreateTenant :one
INSERT INTO tenants (name, plan)
VALUES ($1, $2)
RETURNING id;

-- name: GetTenantContract :one
SELECT contract_id, network
FROM tenants
WHERE id = $1;

-- name: SetTenantContract :exec
UPDATE tenants
SET contract_id = $2, network = $3
WHERE id = $1;
