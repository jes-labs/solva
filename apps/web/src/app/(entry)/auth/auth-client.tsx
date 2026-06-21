"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@solva/ui";
import { useSession } from "@/lib/session/provider";
import { detectPasskeySupport } from "@/lib/passkey/capabilities";
import { Spinner } from "@/components/spinner";
import type { PasskeyPhase } from "@/lib/auth";

const PHASE_LABEL: Record<PasskeyPhase, string> = {
  checking: "Checking your device…",
  registering: "Waiting for your passkey…",
  authenticating: "Waiting for your passkey…",
  provisioning: "Provisioning your wallet…",
};

// The dedicated auth surface. Operators sign in with a passkey; on success we
// route to onboarding (KYB pending) or straight to the console once approved.
export function AuthClient() {
  const router = useRouter();
  const { status, signIn } = useSession();
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<PasskeyPhase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState<string | null>(null);

  // Already signed in: bounce to where they belong.
  useEffect(() => {
    if (status === "active") router.replace("/");
    else if (status === "onboarding") router.replace("/onboarding");
  }, [status, router]);

  useEffect(() => {
    let active = true;
    void detectPasskeySupport().then((support) => {
      if (active && !support.supported) setUnsupported(support.reason ?? "Passkeys are unavailable.");
    });
    return () => {
      active = false;
    };
  }, []);

  async function signInWithPasskey() {
    setBusy(true);
    setError(null);
    try {
      const next = await signIn({ onPhase: setPhase });
      router.replace(next.institution.kybStatus === "approved" ? "/" : "/onboarding");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Sign-in failed.";
      setError(
        message.includes("NotAllowed") || message.toLowerCase().includes("cancel")
          ? "The passkey prompt was dismissed. Try again."
          : message,
      );
      setBusy(false);
      setPhase(null);
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      <div className="rounded-card border border-hair bg-surface p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full border border-hair text-acc-text">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <rect x="4" y="11" width="16" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <h1 className="mt-4 font-display text-[24px] font-bold tracking-tight">
          Sign in to Solva
        </h1>
        <p className="mx-auto mt-2 max-w-[320px] text-sm leading-relaxed text-sec">
          Use your passkey. No seed phrase. We provision a smart wallet for your institution on
          first sign-in.
        </p>

        {unsupported ? (
          <p className="mt-6 rounded-btn border border-hair bg-bg px-4 py-3 text-[13.5px] text-amber" role="alert">
            {unsupported}
          </p>
        ) : (
          <>
            <Button onClick={signInWithPasskey} disabled={busy} className="mt-6 w-full">
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner /> {phase ? PHASE_LABEL[phase] : "Signing in…"}
                </span>
              ) : (
                "Sign in with passkey"
              )}
            </Button>
            {error && (
              <p className="mt-3 text-[13px] text-amber" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </div>
      <p className="mt-4 text-center text-[12.5px] text-sec">
        New institution? Signing in starts your onboarding.
      </p>
    </div>
  );
}
