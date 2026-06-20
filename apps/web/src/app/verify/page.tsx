import type { Metadata } from "next";
import { VerifyClient } from "./verify-client";

export const metadata: Metadata = {
  title: "Verify a proof",
};

export default function VerifyPage() {
  return <VerifyClient />;
}
