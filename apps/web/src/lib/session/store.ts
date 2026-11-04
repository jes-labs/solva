import { isInstitutionType, type Institution } from "./types";

// The active wallet clears on sign-out; the institution record is keyed by
// wallet and survives it, so a returning operator skips KYB once approved.

const ACTIVE_WALLET_KEY = "solva.active-wallet";
const INSTITUTION_PREFIX = "solva.institution.";

export function loadActiveWallet(): string | null {
  try {
    return localStorage.getItem(ACTIVE_WALLET_KEY);
  } catch {
    return null;
  }
}

export function saveActiveWallet(wallet: string): void {
  try {
    localStorage.setItem(ACTIVE_WALLET_KEY, wallet);
  } catch {
    // Storage can be blocked; the session still holds in memory for this tab.
  }
}

export function clearActiveWallet(): void {
  try {
    localStorage.removeItem(ACTIVE_WALLET_KEY);
  } catch {
    // No-op.
  }
}

export function loadInstitution(wallet: string): Institution | null {
  try {
    const raw = localStorage.getItem(INSTITUTION_PREFIX + wallet);
    if (!raw) return null;
    const institution = JSON.parse(raw) as Institution;
    return isInstitutionType(institution.type) ? institution : null;
  } catch {
    return null;
  }
}

export function saveInstitution(wallet: string, institution: Institution): void {
  try {
    localStorage.setItem(INSTITUTION_PREFIX + wallet, JSON.stringify(institution));
  } catch {
    // No-op.
  }
}
