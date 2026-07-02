import { Keypair, rpc } from "@stellar/stellar-sdk";
import { RPC_URL } from "./config";

// The deployer that pays to put a wallet on-chain. On testnet this is an
// ephemeral keypair funded by friendbot and cached per browser, so a passkey's
// derived wallet address stays stable across reloads with no server and no
// stored institutional secret. Testnet only.
export interface Session {
  keypair: Keypair;
  publicKey: string;
}

const SESSION_STORAGE_KEY = "solva:passkey:deployer-secret";
const server = new rpc.Server(RPC_URL);

let sessionPromise: Promise<Session> | undefined;

export function getSession(): Promise<Session> {
  if (!sessionPromise) sessionPromise = createSession();
  return sessionPromise;
}

async function createSession(): Promise<Session> {
  const keypair = restore() ?? Keypair.random();
  const publicKey = keypair.publicKey();

  // Fund only when the account does not exist yet.
  try {
    await server.getAccount(publicKey);
    persist(keypair);
    return { keypair, publicKey };
  } catch {
    // not funded yet
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
      if (res.ok) {
        persist(keypair);
        return { keypair, publicKey };
      }
    } catch {
      // retry below
    }
    await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
  }
  throw new Error("Could not fund the deployer account via friendbot. Try again.");
}

function restore(): Keypair | undefined {
  try {
    const secret = localStorage.getItem(SESSION_STORAGE_KEY);
    return secret ? Keypair.fromSecret(secret) : undefined;
  } catch {
    return undefined;
  }
}

function persist(keypair: Keypair): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, keypair.secret());
  } catch {
    // Private mode: the session simply will not survive a reload.
  }
}
