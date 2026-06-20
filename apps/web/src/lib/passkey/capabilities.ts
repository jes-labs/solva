// A focused passkey support check for graceful fallback. The reference project
// ships a full, compat-matrix-driven capability engine; Solva needs the gating
// essentials: a secure context, WebAuthn, and a platform authenticator.

export interface PasskeySupport {
  supported: boolean;
  reason?: string;
}

export async function detectPasskeySupport(): Promise<PasskeySupport> {
  if (typeof window === "undefined") {
    return { supported: false, reason: "Passkeys are only available in the browser." };
  }
  if (!window.isSecureContext) {
    return { supported: false, reason: "Passkeys require a secure (https) connection." };
  }
  if (!("credentials" in navigator) || typeof PublicKeyCredential === "undefined") {
    return { supported: false, reason: "This browser does not support passkeys." };
  }
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.();
    if (available === false) {
      return {
        supported: false,
        reason: "No passkey authenticator (Face ID, Touch ID, or Windows Hello) is set up on this device.",
      };
    }
  } catch {
    // A probe that throws is treated as inconclusive, not a hard block.
  }
  return { supported: true };
}
