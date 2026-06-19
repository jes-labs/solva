-- Initial schema for the Solva orchestrator. Money is numeric, never float.
-- Serialized trees, source config, and audit payloads are jsonb. Timestamps
-- are timestamptz. Matches PRD 2 section 12.

CREATE TABLE tenants (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    plan       text NOT NULL DEFAULT 'free',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reserve_sources (
    id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    -- type is 'openbanking' or 'onchain'.
    type      text NOT NULL,
    config    jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE customers (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    external_ref text NOT NULL,
    -- id_hash is the Poseidon2 hash of external_ref, computed by the prover
    -- stack, hex. The orchestrator only stores it.
    id_hash      text NOT NULL,
    UNIQUE (tenant_id, external_ref)
);

CREATE TABLE liabilities (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
    -- balance is integer minor units stored as numeric for exactness.
    balance     numeric(38, 0) NOT NULL,
    as_of       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE proofs (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    -- chain_proof_id is the monotonic id from the Soroban registry.
    chain_proof_id bigint NOT NULL,
    root_h         text NOT NULL,
    -- r and l are the reserve and liability totals, integer minor units.
    r              numeric(38, 0) NOT NULL,
    l              numeric(38, 0) NOT NULL,
    "timestamp"    timestamptz NOT NULL DEFAULT now(),
    proof_blob     bytea NOT NULL
);

CREATE TABLE merkle_trees (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- one tree per proof.
    proof_id   uuid NOT NULL UNIQUE REFERENCES proofs (id) ON DELETE CASCADE,
    depth      integer NOT NULL,
    serialized jsonb NOT NULL
);

CREATE TABLE audit_log (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    event      text NOT NULL,
    payload    jsonb NOT NULL DEFAULT '{}'::jsonb,
    -- 180-day retention is enforced by a scheduled purge, not by the schema.
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_proofs_tenant_time ON proofs (tenant_id, "timestamp" DESC);
CREATE INDEX idx_liabilities_tenant ON liabilities (tenant_id);
CREATE INDEX idx_audit_log_tenant_time ON audit_log (tenant_id, created_at DESC);
