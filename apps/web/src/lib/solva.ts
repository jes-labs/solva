// Single place that constructs the SDK client for the web app. Network comes
// from an env var so the same build runs against testnet or a local stack.

import { Solva } from "@solva/sdk-ts";

type Network = "testnet" | "mainnet" | "local";

function network(): Network {
  const n = process.env.NEXT_PUBLIC_SOLVA_NETWORK;
  if (n === "mainnet" || n === "local" || n === "testnet") return n;
  return "testnet";
}

/** Build an SDK client for a tenant. The dashboard passes the signed-in tenant. */
export function solvaClient(tenant: string): Solva {
  return new Solva({ network: network(), tenant });
}
