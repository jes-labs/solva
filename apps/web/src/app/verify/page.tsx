import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyClient } from "./verify-client";

export const metadata: Metadata = {
  title: "Verify a proof",
};

export default function VerifyPage() {
  // Suspense boundary because VerifyClient reads ?id= via useSearchParams.
  return (
    <Suspense>
      <VerifyClient />
    </Suspense>
  );
}
