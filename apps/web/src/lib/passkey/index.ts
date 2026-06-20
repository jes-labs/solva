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
