-- Durable idempotency for proof cycles. A (tenant, request_key) pair can be
-- claimed exactly once: a replayed key violates the unique constraint and is
-- rejected, independent of the Redis lock. This is the second idempotency layer
-- from PRD 2 section 7.3.

CREATE TABLE cycle_runs (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    -- The caller-supplied idempotency key for this cycle.
    request_key text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, request_key)
);

CREATE INDEX idx_cycle_runs_tenant ON cycle_runs (tenant_id);
