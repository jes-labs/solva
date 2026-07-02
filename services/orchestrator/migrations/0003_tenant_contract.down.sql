-- Reverse 0003_tenant_contract.

ALTER TABLE tenants DROP COLUMN IF EXISTS network;
ALTER TABLE tenants DROP COLUMN IF EXISTS contract_id;
