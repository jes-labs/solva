-- Reverse 0001_init. Drop in dependency order so foreign keys never block.

DROP INDEX IF EXISTS idx_audit_log_tenant_time;
DROP INDEX IF EXISTS idx_liabilities_tenant;
DROP INDEX IF EXISTS idx_proofs_tenant_time;

DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS merkle_trees;
DROP TABLE IF EXISTS proofs;
DROP TABLE IF EXISTS liabilities;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS reserve_sources;
DROP TABLE IF EXISTS tenants;
