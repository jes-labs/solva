import { TransactionBuilder, rpc, type Transaction } from "@stellar/stellar-sdk";
import { RPC_URL, NETWORK_PASSPHRASE } from "./config";
import type { Session } from "./session";

const server = new rpc.Server(RPC_URL);

// Single-op tx paid by the session account; the wallet authorizes via a signed
// auth entry, not the source signature.
export async function buildTx(
  session: Session,
  operation: Parameters<TransactionBuilder["addOperation"]>[0],
): Promise<Transaction> {
  return new TransactionBuilder(await server.getAccount(session.publicKey), {
    fee: "10000000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(300)
    .build();
}

// Prepare, sign as the session account, submit, and poll for settlement.
export async function prepareSignSubmit(session: Session, tx: Transaction): Promise<string> {
  const ready = (await server.prepareTransaction(tx)) as Transaction;
  ready.sign(session.keypair);

  const sent = await server.sendTransaction(ready);
  if (sent.status === "ERROR") {
    throw new Error(`submission rejected: ${JSON.stringify(sent.errorResult ?? sent.status)}`);
  }

  for (let i = 0; i < 90; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const got = await server.getTransaction(sent.hash);
    if (got.status === "SUCCESS") return sent.hash;
    if (got.status === "FAILED") throw new Error("the transaction failed on-chain");
  }
  throw new Error("the transaction did not settle in time");
}
