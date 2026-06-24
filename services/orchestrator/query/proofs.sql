-- Proof and Merkle-tree queries. sqlc reads the schema from migrations/ and
-- generates type-safe Go into internal/repo.

-- name: CreateProof :one
INSERT INTO proofs (tenant_id, chain_proof_id, root_h, r, l, proof_blob)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id;

-- name: GetProof :one
SELECT id, tenant_id, chain_proof_id, root_h, r, l, "timestamp", proof_blob
FROM proofs
WHERE id = $1;

-- name: GetLatestProof :one
SELECT id, tenant_id, chain_proof_id, root_h, r, l, "timestamp", proof_blob
FROM proofs
WHERE tenant_id = $1
ORDER BY "timestamp" DESC
LIMIT 1;

-- name: GetLatestReservesTotal :one
-- The previous cycle's reserve total, which the fraud bound (R <= 1.1 * R_prev)
-- needs. It is just the most recent proof's R for the tenant.
SELECT r
FROM proofs
WHERE tenant_id = $1
ORDER BY "timestamp" DESC
LIMIT 1;

-- name: CreateMerkleTree :exec
INSERT INTO merkle_trees (proof_id, depth, serialized)
VALUES ($1, $2, $3);

-- name: GetMerkleTreeByProof :one
SELECT id, proof_id, depth, serialized
FROM merkle_trees
WHERE proof_id = $1;
