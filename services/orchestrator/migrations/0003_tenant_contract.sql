-- Each institution publishes to its own proof-registry contract (multi-tenancy,
-- epic #124). contract_id is null until the tenant is provisioned; consumers
-- treat a null as "not provisioned yet". network names the Stellar network the
-- contract lives on so reads and publishes target the right one.

ALTER TABLE tenants ADD COLUMN contract_id text;
ALTER TABLE tenants ADD COLUMN network text NOT NULL DEFAULT 'testnet';
