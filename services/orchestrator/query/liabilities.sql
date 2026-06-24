-- Liability queries. balance is integer minor units stored as numeric(38,0) for
-- exactness. as_of defaults to now() at insert.

-- name: CreateLiability :exec
INSERT INTO liabilities (tenant_id, customer_id, balance)
VALUES ($1, $2, $3);

-- name: ListLiabilities :many
-- The tenant's current customer balances, joined to the customer id_hash the
-- prover witnesses into the Merkle Sum Tree.
SELECT l.id, l.customer_id, c.id_hash, l.balance, l.as_of
FROM liabilities l
JOIN customers c ON c.id = l.customer_id
WHERE l.tenant_id = $1
ORDER BY l.as_of;
