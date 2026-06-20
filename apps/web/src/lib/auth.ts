// Passkey smart-wallet auth for Solva.
//
// Operators sign in with a passkey (no seed phrase). On first sign-in we register
// a passkey whose secp256r1 public key is the wallet's signer, derive the
// deterministic Soroban contract address, and provision the account. On later
// sign-ins we run a passkey assertion to confirm possession. The provisioned
// contract account is the publish owner, so the dashboard gates publishing behind
// a session.
//
// The WebAuthn ceremony is real and runs in the browser. The on-chain deploy and
// transaction signing sit behind the provision boundary and the SWK module
// adapter (see lib/passkey), mocked until Solva's smart-wallet contract and
// bindings deploy. Nothing about this interface changes when they land.

import { fromBase64Url } from "./passkey/bytes";
import { detectPasskeySupport } from "./passkey/capabilities";
import { createPasskey, signWithPasskey } from "./passkey/webauthn";
// provisionWallet pulls in @stellar/stellar-sdk, so it is imported lazily inside
// signIn to keep it out of the dashboard's initial bundle.

export interface SmartWalletSession {
  /** The provisioned Soroban contract account address (C...). */
  contractAddress: string;
  /** Tenant the operator is acting for. */
  tenant: string;
  /** Human label for the signed-in operator. */
  label: string;
}

export type PasskeyPhase = "checking" | "registering" | "authenticating" | "provisioning";

export interface SignInOptions {
  tenant?: string;
  /** Progress callback so the UI can narrate the ceremony. */
  onPhase?: (phase: PasskeyPhase) => void;
}

export interface AuthProvider {
  /** Run the passkey flow and return the active session. */
  signIn(options?: SignInOptions): Promise<SmartWalletSession>;
  /** Drop the local session. The passkey and on-chain account are untouched. */
  signOut(): Promise<void>;
  /** The current session, or null when signed out. */
  getSession(): SmartWalletSession | null;
}

const DEFAULT_TENANT = "demo-institution";

interface StoredWallet {
  credentialIdBase64Url: string;
  contractAddress: string;
}

function storageKey(tenant: string): string {
  return `solva.passkey.${tenant}`;
}

function loadWallet(tenant: string): StoredWallet | null {
  try {
    const raw = localStorage.getItem(storageKey(tenant));
    return raw ? (JSON.parse(raw) as StoredWallet) : null;
  } catch {
    return null;
  }
}

function saveWallet(tenant: string, wallet: StoredWallet): void {
  try {
    localStorage.setItem(storageKey(tenant), JSON.stringify(wallet));
  } catch {
    // Storage can be blocked; the session still holds for this tab.
  }
}

function shortAddress(address: string): string {
  return address.length > 10 ? `${address.slice(0, 5)}…${address.slice(-4)}` : address;
}

export class PasskeyAuthProvider implements AuthProvider {
  private session: SmartWalletSession | null = null;

  async signIn(options: SignInOptions = {}): Promise<SmartWalletSession> {
    const tenant = options.tenant ?? DEFAULT_TENANT;
    const phase = options.onPhase ?? (() => {});

    phase("checking");
    const support = await detectPasskeySupport();
    if (!support.supported) {
      throw new Error(support.reason ?? "Passkeys are not available on this device.");
    }

    const existing = loadWallet(tenant);
    let contractAddress: string;

    if (existing) {
      // Returning operator: prove possession of the passkey with an assertion.
      phase("authenticating");
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      await signWithPasskey({
        challenge,
        allowCredentials: [fromBase64Url(existing.credentialIdBase64Url)],
      });
      contractAddress = existing.contractAddress;
    } else {
      // First sign-in: register the passkey and provision the smart wallet.
      phase("registering");
      const passkey = await createPasskey({
        rp: { name: "Solva" },
        user: {
          id: new TextEncoder().encode(`${tenant}:operator`),
          name: `operator@${tenant}`,
          displayName: "Solva Operator",
        },
      });

      phase("provisioning");
      const { provisionWallet } = await import("./passkey/provision");
      const provisioned = await provisionWallet({
        credentialId: passkey.credentialId,
        publicKey: passkey.publicKey,
      });
      contractAddress = provisioned.contractAddress;
      saveWallet(tenant, {
        credentialIdBase64Url: passkey.credentialIdBase64Url,
        contractAddress,
      });
    }

    this.session = { contractAddress, tenant, label: shortAddress(contractAddress) };
    return this.session;
  }

  async signOut(): Promise<void> {
    this.session = null;
  }

  getSession(): SmartWalletSession | null {
    return this.session;
  }
}

export const authProvider: AuthProvider = new PasskeyAuthProvider();
