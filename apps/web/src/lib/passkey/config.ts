import { Networks } from "@stellar/stellar-sdk";

// Testnet smart-wallet config. WALLET_WASM_HASH is the passkey-kit smart-wallet,
// built unmodified and installed on testnet; pinning it means every wallet we
// deploy runs the audited code. NATIVE_SAC is the native XLM Stellar Asset
// Contract, used to fund a wallet.
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const WALLET_WASM_HASH =
  "8991e3262e6099e2a18acb3583af4d9d1da886403609e7170467df4337450dca";
export const NATIVE_SAC = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
export const EXPLORER = "https://stellar.expert/explorer/testnet";
