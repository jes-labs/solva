-- Representative named queries for sqlc. sqlc reads the schema from
-- migrations/ and generates type-safe Go into internal/repo.

-- name: GetLatestProof :one
SELECT id, tenant_id, chain_proof_id, root_h, r, l, "timestamp", proof_blob
FROM proofs
WHERE tenant_id = $1
ORDER BY "timestamp" DESC
LIMIT 1;

-- name: GetProof :one
SELECT id, tenant_id, chain_proof_id, root_h, r, l, "timestamp", proof_blob
FROM proofs
WHERE id = $1;

-- name: CreateProof :one
INSERT INTO proofs (tenant_id, chain_proof_id, root_h, r, l, proof_blob)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id;

-- name: CreateMerkleTree :exec
INSERT INTO merkle_trees (proof_id, depth, serialized)
VALUES ($1, $2, $3);

-- name: ListLiabilities :many
SELECT l.id, l.customer_id, c.id_hash, l.balance, l.as_of
FROM liabilities l
JOIN customers c ON c.id = l.customer_id
WHERE l.tenant_id = $1;

-- name: GetLatestReservesTotal :one
SELECT r
FROM proofs
WHERE tenant_id = $1
ORDER BY "timestamp" DESC
LIMIT 1;
