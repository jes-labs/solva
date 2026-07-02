import { Buffer } from "buffer";
import { Contract, Operation, StrKey, rpc } from "@stellar/stellar-sdk";
import { Client as PasskeyClient, type Signer } from "./bindings.gen";
import { payloadForAuthEntry } from "./challenge";
import { passkeyKitSignatureScVal, attachSignatureToEntry } from "./encoder";
import { NETWORK_PASSPHRASE, RPC_URL } from "./config";
import { buildTx, prepareSignSubmit } from "./tx";
import type { Session } from "./session";
import type { SignWithPasskeyResult } from "./webauthn";

const server = new rpc.Server(RPC_URL);

// The on-chain phases, reported so the UI can show where a run is or where it
// failed.
export type AddSignerPhase = "simulate" | "sign" | "submit";

export interface AddOrchestratorSignerArgs {
  session: Session;
  // The passkey smart wallet (C...) that owns the tenant's registry.
  walletAddress: string;
  // The orchestrator's Stellar account (G...), which is an Ed25519 public key.
  orchestratorAddress: string;
  // The registry (C...) the signer is scoped to.
  registryContract: string;
  signPayload: (payload: Uint8Array) => Promise<SignWithPasskeyResult>;
  onPhase?: (phase: AddSignerPhase) => void;
}

// Add the orchestrator's Ed25519 key as a wallet signer, scoped by SignerLimits
// to the registry contract, authorized by the passkey.
export async function addOrchestratorSigner(args: AddOrchestratorSignerArgs): Promise<string> {
  const pubKey = StrKey.decodeEd25519PublicKey(args.orchestratorAddress);

  // Ed25519(pubkey, expiration None, limits Some({registry: None}), Persistent):
  // the signer may only authorize calls to that one registry.
  const signer: Signer = {
    tag: "Ed25519",
    values: [
      Buffer.from(pubKey),
      [undefined],
      [new Map([[args.registryContract, undefined]])],
      { tag: "Persistent", values: undefined },
    ],
  };

  const client = new PasskeyClient({
    contractId: args.walletAddress,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
  });
  const callArgs = client.spec.funcArgsToScVals("add_signer", { signer });

  const unsignedTx = await buildTx(
    args.session,
    new Contract(args.walletAddress).call("add_signer", ...callArgs),
  );

  args.onPhase?.("simulate");
  const sim = await server.simulateTransaction(unsignedTx);
  if (rpc.Api.isSimulationError(sim)) throw new Error(`simulation failed: ${sim.error}`);
  const entry = sim.result?.auth?.[0];
  if (!entry) throw new Error("simulation returned no auth entry for the wallet");

  const latest = await server.getLatestLedger();
  entry.credentials().address().signatureExpirationLedger(latest.sequence + 100);

  const payload = payloadForAuthEntry(entry, NETWORK_PASSPHRASE);
  args.onPhase?.("sign");
  const assertion = await args.signPayload(payload);
  attachSignatureToEntry(
    entry,
    passkeyKitSignatureScVal({
      credentialId: assertion.credentialId,
      authenticatorData: assertion.authenticatorData,
      clientDataJSON: assertion.clientDataJSON,
      signature: assertion.signature,
    }),
  );

  const invokeOp = unsignedTx.operations[0] as Operation.InvokeHostFunction;
  const signedTx = await buildTx(
    args.session,
    Operation.invokeHostFunction({ func: invokeOp.func, auth: [entry] }),
  );
  args.onPhase?.("submit");
  return prepareSignSubmit(args.session, signedTx);
}
