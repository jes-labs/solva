// Public surface of the Solva passkey layer.
export { createPasskey, signWithPasskey } from "./webauthn";
export type { CreatePasskeyResult, SignWithPasskeyResult } from "./webauthn";
export { deriveWalletAddress } from "./address";
export { provisionWallet } from "./provision";
export type { ProvisionResult } from "./provision";
export { detectPasskeySupport } from "./capabilities";
export type { PasskeySupport } from "./capabilities";
export { PasskeyModule, PASSKEY_MODULE_ID, ModuleType } from "./swk-module";
export type { PasskeyModuleConfig, ModuleInterface, SignOptions } from "./swk-module";
export { toBase64Url, fromBase64Url } from "./bytes";

// Smart-wallet deploy and signing surface.
export { getSession } from "./session";
export type { Session } from "./session";
export { deployWallet, walletAddressFor, contractExists } from "./wallet";
export type { DeployResult } from "./wallet";
export { addOrchestratorSigner } from "./signer";
export type { AddOrchestratorSignerArgs } from "./signer";
export { payloadForAuthEntry, authorizationPayload } from "./challenge";
export { passkeyKitSignatureScVal, attachSignatureToEntry } from "./encoder";
export type { WebAuthnSignatureParts } from "./encoder";
export { rpcWalletStateReader, secp256r1SignerLedgerKey } from "./wallet-state";
export type { WalletStateReader, LedgerEntriesRpc } from "./wallet-state";
export {
  RPC_URL,
  NETWORK_PASSPHRASE,
  WALLET_WASM_HASH,
  NATIVE_SAC,
  EXPLORER,
} from "./config";
