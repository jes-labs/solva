import { Buffer } from "buffer";
import { hash, rpc, xdr } from "@stellar/stellar-sdk";
import { basicNodeSigner } from "@stellar/stellar-sdk/contract";
import { Client as PasskeyClient } from "./bindings.gen";
import { deriveWalletAddress } from "./address";
import { NETWORK_PASSPHRASE, RPC_URL, WALLET_WASM_HASH } from "./config";
import type { Session } from "./session";

const server = new rpc.Server(RPC_URL);

// The wallet address is derived from the deployer and the credential id, so it
// is known before deploy and stable per browser.
export function walletAddressFor(session: Session, credentialId: Uint8Array): string {
  return deriveWalletAddress({
    deployer: session.publicKey,
    keyId: credentialId,
    networkPassphrase: NETWORK_PASSPHRASE,
  });
}

export async function contractExists(contractId: string): Promise<boolean> {
  try {
    await server.getContractData(
      contractId,
      xdr.ScVal.scvLedgerKeyContractInstance(),
      rpc.Durability.Persistent,
    );
    return true;
  } catch {
    return false;
  }
}

export interface DeployResult {
  walletAddress: string;
  // True when this call deployed the wallet; false when it already existed.
  deployed: boolean;
}

// Deploy the passkey smart wallet at its derived address, with the passkey's
// P-256 key as the first Secp256r1 signer. Idempotent: the address is
// deterministic, so an already-deployed wallet returns immediately.
export async function deployWallet(
  session: Session,
  credentialId: Uint8Array,
  publicKey: Uint8Array,
): Promise<DeployResult> {
  const walletAddress = walletAddressFor(session, credentialId);
  if (await contractExists(walletAddress)) return { walletAddress, deployed: false };

  const signer = basicNodeSigner(session.keypair, NETWORK_PASSPHRASE);
  const deployTx = await PasskeyClient.deploy(
    {
      signer: {
        tag: "Secp256r1",
        values: [
          Buffer.from(credentialId),
          Buffer.from(publicKey),
          [undefined],
          [undefined],
          { tag: "Persistent", values: undefined },
        ],
      },
    },
    {
      rpcUrl: RPC_URL,
      networkPassphrase: NETWORK_PASSPHRASE,
      wasmHash: WALLET_WASM_HASH,
      salt: hash(Buffer.from(credentialId)),
      publicKey: session.publicKey,
      signTransaction: signer.signTransaction,
      // The bindings default to a 100-stroop fee that strands the tx when
      // testnet is busy. Bid properly.
      fee: "1000000",
      timeoutInSeconds: 120,
    },
  );

  try {
    await deployTx.signAndSend();
  } catch (e) {
    // The bindings stop polling after their window even while the tx is still
    // pending; the existence poll below is the real check.
    console.warn("deploy signAndSend did not confirm; polling for the contract", e);
  }

  for (let i = 0; i < 45; i++) {
    if (await contractExists(walletAddress)) return { walletAddress, deployed: true };
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("Wallet deployment has not confirmed yet. Testnet may be busy; try again.");
}
