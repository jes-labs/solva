import type { Metadata } from "next";
import { AuthClient } from "./auth-client";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function AuthPage() {
  return <AuthClient />;
}
