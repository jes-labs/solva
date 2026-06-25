-- Cycle idempotency claims. ClaimCycle inserts the request key; on a conflict
-- (the key was already claimed) it returns no row, which the repo maps to a
-- "duplicate" result rather than an error.

-- name: ClaimCycle :one
INSERT INTO cycle_runs (tenant_id, request_key)
VALUES ($1, $2)
ON CONFLICT (tenant_id, request_key) DO NOTHING
RETURNING id;
