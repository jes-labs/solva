"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authProvider, type PasskeyPhase } from "@/lib/auth";
import {
  clearActiveWallet,
  loadActiveWallet,
  loadInstitution,
  saveActiveWallet,
  saveInstitution,
} from "./store";
import type { Institution, KybInput, Session, SessionStatus } from "./types";

interface SessionContextValue {
  status: SessionStatus;
  session: Session | null;
  signIn: (options?: { onPhase?: (phase: PasskeyPhase) => void }) => Promise<Session>;
  submitKyb: (input: KybInput) => void;
  /** Stand-in for the Solva system-operator approval, which happens out-of-band. */
  approveKyb: () => void;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function freshInstitution(): Institution {
  return {
    id: `inst_${Date.now().toString(36)}`,
    legalName: "",
    type: "bank",
    jurisdiction: "",
    registrationNumber: "",
    contactName: "",
    contactEmail: "",
    kybStatus: "not_started",
  };
}

function shortAddress(address: string): string {
  return address.length > 10 ? `${address.slice(0, 5)}…${address.slice(-4)}` : address;
}

function buildSession(wallet: string, label: string, institution: Institution): Session {
  // Single-operator mock: the signed-in operator is the owner. The role still
  // drives RBAC throughout, so multi-role lands without UI changes.
  return { walletAddress: wallet, operatorLabel: label, role: "owner", institution };
}

function deriveStatus(session: Session | null, loading: boolean): SessionStatus {
  if (loading) return "loading";
  if (!session) return "unauthenticated";
  if (session.institution.kybStatus !== "approved") return "onboarding";
  return "active";
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Resume an active wallet on load so a reload keeps the operator in place.
  useEffect(() => {
    const wallet = loadActiveWallet();
    if (wallet) {
      const institution = loadInstitution(wallet) ?? freshInstitution();
      setSession(buildSession(wallet, shortAddress(wallet), institution));
    }
    setLoading(false);
  }, []);

  const signIn = useCallback<SessionContextValue["signIn"]>(async (options) => {
    const auth = await authProvider.signIn({ onPhase: options?.onPhase });
    const wallet = auth.contractAddress;
    const institution = loadInstitution(wallet) ?? freshInstitution();
    saveInstitution(wallet, institution);
    saveActiveWallet(wallet);
    const next = buildSession(wallet, auth.label, institution);
    setSession(next);
    return next;
  }, []);

  const submitKyb = useCallback<SessionContextValue["submitKyb"]>((input) => {
    setSession((prev) => {
      if (!prev) return prev;
      const institution: Institution = {
        ...prev.institution,
        ...input,
        kybStatus: "in_review",
        submittedAt: Date.now(),
      };
      saveInstitution(prev.walletAddress, institution);
      return { ...prev, institution };
    });
  }, []);

  const approveKyb = useCallback<SessionContextValue["approveKyb"]>(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const institution: Institution = { ...prev.institution, kybStatus: "approved" };
      saveInstitution(prev.walletAddress, institution);
      return { ...prev, institution };
    });
  }, []);

  const signOut = useCallback<SessionContextValue["signOut"]>(async () => {
    await authProvider.signOut();
    clearActiveWallet();
    setSession(null);
  }, []);

  const value: SessionContextValue = {
    status: deriveStatus(session, loading),
    session,
    signIn,
    submitKyb,
    approveKyb,
    signOut,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
