// Passkey smart-wallet auth interface.
//
// Operators sign in with a passkey (no seed phrase). On first sign-in the app
// provisions a Soroban contract account whose signer is a secp256r1 key bound to
// the passkey, following the Stellar Wallets Kit pattern. The webauthn ceremony
// and the contract deployment are not implemented here; this module defines the
// clean interface and ships a stub provider so the dashboard can compile and the
// real provider can drop in without touching call sites.

export interface SmartWalletSession {
  /** The provisioned Soroban contract account address (C...). */
  contractAddress: string;
  /** Tenant the operator is acting for. */
  tenant: string;
  /** Human label for the signed-in operator. */
  label: string;
}

export interface AuthProvider {
  /**
   * Run the passkey ceremony and, on first use, provision the smart-wallet
   * contract account via a secp256r1 passkey. Returns the active session.
   */
  signIn(): Promise<SmartWalletSession>;
  /** Drop the local session. The on-chain account is untouched. */
  signOut(): Promise<void>;
  /** The current session, or null when signed out. */
  getSession(): SmartWalletSession | null;
}

/**
 * Stub provider. It returns a fixed session so the dashboard renders during
 * development. Replace with a Stellar Wallets Kit backed implementation that
 * performs the secp256r1 passkey registration and contract account deploy.
 */
export class StubAuthProvider implements AuthProvider {
  private session: SmartWalletSession | null = null;

  async signIn(): Promise<SmartWalletSession> {
    // Real flow: navigator.credentials.create -> derive secp256r1 key ->
    // deploy/provision the Soroban contract account -> store the address.
    this.session = {
      contractAddress: "CDEMO000000000000000000000000000000000000000000000000000",
      tenant: "demo-institution",
      label: "Demo Operator",
    };
    return this.session;
  }

  async signOut(): Promise<void> {
    this.session = null;
  }

  getSession(): SmartWalletSession | null {
    return this.session;
  }
}

export const authProvider: AuthProvider = new StubAuthProvider();
