-- Customer queries. id_hash is the Poseidon2 hash of external_ref, computed by
-- the prover stack. The orchestrator only stores and reads it.

-- name: CreateCustomer :one
INSERT INTO customers (tenant_id, external_ref, id_hash)
VALUES ($1, $2, $3)
RETURNING id;
