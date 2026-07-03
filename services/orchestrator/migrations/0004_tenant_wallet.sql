-- The tenant's passkey smart-wallet account (#131). The wallet owns the tenant's
-- proof-registry, so publishing is authorized through it. Null until the wallet
-- is provisioned.

ALTER TABLE tenants ADD COLUMN wallet_address text;
