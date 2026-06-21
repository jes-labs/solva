// The institution session model. Auth (the passkey wallet) is one layer; on top
// sit the institution identity, the operator's role, and the KYB status that
// gates access. All mock-backed now, but the shape is what the SDK/orchestrator
// will fill, so nothing here changes when the backend lands.

export type Role = "owner" | "compliance" | "operator" | "viewer";

export type InstitutionType = "bank" | "fintech" | "exchange" | "stablecoin" | "custodian";

// KYB is operator-reviewed, never self-serve: an institution submits, a Solva
// system operator approves out-of-band. "in_review" is the waiting state.
export type KybStatus = "not_started" | "in_review" | "approved" | "rejected";

// The fields an institution submits for Know-Your-Business review.
export interface KybInput {
  legalName: string;
  type: InstitutionType;
  jurisdiction: string;
  registrationNumber: string;
  contactName: string;
  contactEmail: string;
}

export interface Institution extends KybInput {
  id: string;
  kybStatus: KybStatus;
  submittedAt?: number;
}

export interface Session {
  /** The passkey smart-wallet address (C...). */
  walletAddress: string;
  /** Short human label for the signed-in operator. */
  operatorLabel: string;
  role: Role;
  institution: Institution;
}

// loading: hydrating from storage. unauthenticated: no passkey session.
// onboarding: authenticated but KYB not approved. active: ready for the dashboard.
export type SessionStatus = "loading" | "unauthenticated" | "onboarding" | "active";

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  bank: "Bank",
  fintech: "Fintech",
  exchange: "Exchange",
  stablecoin: "Stablecoin issuer",
  custodian: "Custodian",
};
