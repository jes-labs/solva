import { detectPasskeySupport } from "./capabilities";

// A Stellar Wallets Kit adapter for the Solva passkey wallet. The kit's passkey
// smart-wallet module is not in stock SWK yet (it lives in an upstream PR), so
// the ModuleInterface is declared locally and Solva stays SWK-ready without the
// dependency. When SWK ships the module, swap this interface for its export and
// register PasskeyModule via StellarWalletsKit.init({ modules: [...] }).
//
// A passkey smart wallet differs from a classic account: the address is a
// C-address contract, and authorization is signing Soroban auth entries the
// contract verifies on-chain. So the signing methods are delegated to the
// integration, which holds the contract bindings.

export enum ModuleType {
  HOT_WALLET = "HOT_WALLET",
}

export interface SignOptions {
  networkPassphrase?: string;
  address?: string;
}

export interface ModuleInterface {
  moduleType: ModuleType;
  productId: string;
  productName: string;
  productUrl: string;
  productIcon: string;
  isAvailable(): Promise<boolean>;
  getAddress(): Promise<{ address: string }>;
  signTransaction(xdr: string, opts?: SignOptions): Promise<{ signedTxXdr: string; signerAddress?: string }>;
  signAuthEntry(authEntry: string, opts?: SignOptions): Promise<{ signedAuthEntry: string; signerAddress?: string }>;
}

const PASSKEY_ICON = `data:image/svg+xml;base64,${typeof btoa === "function" ? btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#cfe524" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M9 12v9l2-2 2 2v-4"/><path d="M16 8a4 4 0 0 0-4-4"/></svg>') : ""}`;

export const PASSKEY_MODULE_ID = "solva-passkey";

export interface PasskeyModuleConfig {
  network: string;
  networkPassphrase: string;
  // The connected smart-wallet address (C...), or null when not connected.
  getWalletAddress: () => string | null | Promise<string | null>;
  // Sign provided by the integration once the contract bindings exist.
  signTransaction?: (xdr: string, opts?: SignOptions) => Promise<{ signedTxXdr: string; signerAddress?: string }>;
  signAuthEntry?: (authEntry: string, opts?: SignOptions) => Promise<{ signedAuthEntry: string; signerAddress?: string }>;
}

export class PasskeyModule implements ModuleInterface {
  readonly moduleType = ModuleType.HOT_WALLET;
  readonly productId = PASSKEY_MODULE_ID;
  readonly productName = "Passkey";
  readonly productUrl = "https://app.joinsolva.xyz";
  readonly productIcon = PASSKEY_ICON;

  constructor(private readonly config: PasskeyModuleConfig) {}

  async isAvailable(): Promise<boolean> {
    return (await detectPasskeySupport()).supported;
  }

  async getAddress(): Promise<{ address: string }> {
    const address = await this.config.getWalletAddress();
    if (!address) throw new Error("No passkey wallet is connected. Sign in first.");
    return { address };
  }

  async signTransaction(xdr: string, opts?: SignOptions) {
    if (!this.config.signTransaction) {
      throw new Error("signTransaction is not configured; wire the contract-binding signer in.");
    }
    return this.config.signTransaction(xdr, opts);
  }

  async signAuthEntry(authEntry: string, opts?: SignOptions) {
    if (!this.config.signAuthEntry) {
      throw new Error("signAuthEntry is not configured; wire the contract-binding signer in.");
    }
    return this.config.signAuthEntry(authEntry, opts);
  }
}
