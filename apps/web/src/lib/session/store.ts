import type { Institution } from "./types";

// Persistence for the session layer. The active wallet marks who is signed in
// (cleared on sign-out); the institution record is keyed by wallet and survives
// sign-out, so a returning operator resumes where they left off (skips KYB once
// approved). Mock storage now; the orchestrator owns this server-side later.

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
    return raw ? (JSON.parse(raw) as Institution) : null;
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
