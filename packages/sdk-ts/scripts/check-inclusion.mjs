// e2e Phase B: verify a customer's inclusion through the SDK, on-chain.
//
// Drives the real path a customer would: resolve the inclusion ref through the
// orchestrator, then call verify_inclusion on the proof-registry contract. A
// correct leaf must verify; the same path with a wrong balance must not.
//
// Config comes from env vars (the network passphrase has spaces, so positional
// args are not safe). Lives in the sdk-ts package so node resolves @solva/sdk-ts
// and its v16 stellar-sdk peer. Run via scripts/e2e.sh.

import { Solva } from "@solva/sdk-ts";

const {
  SOLVA_ORCH_URL,
  SOLVA_RPC_URL,
  SOLVA_CONTRACT_ID,
  SOLVA_NETWORK_PASSPHRASE,
  SOLVA_TENANT,
  SOLVA_PROOF_UUID,
  SOLVA_ID_HASH,
} = process.env;

if (!SOLVA_PROOF_UUID || !SOLVA_ID_HASH || !SOLVA_CONTRACT_ID) {
  console.error("missing required env: SOLVA_CONTRACT_ID, SOLVA_PROOF_UUID, SOLVA_ID_HASH");
  process.exit(2);
}

const solva = new Solva({
  network: "testnet",
  tenant: SOLVA_TENANT,
  endpoints: {
    orchestratorUrl: SOLVA_ORCH_URL,
    rpcUrl: SOLVA_RPC_URL,
    contractId: SOLVA_CONTRACT_ID,
    networkPassphrase: SOLVA_NETWORK_PASSPHRASE,
  },
});

const ref = `${SOLVA_PROOF_UUID}:${SOLVA_ID_HASH}`;

// The orchestrator confirms the publish and learns the chain id, but the RPC's
// read view can lag a few seconds behind the new ledger entry. A customer (or
// this check) verifying right after a proof lands hits that window, so retry the
// read for a short while before giving up.
async function verifyWithRetry(target, attempts = 8, delayMs = 3000) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      return await solva.verifyInclusion(target);
    } catch (err) {
      last = err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw last;
}

// The real leaf, resolved and verified through the full SDK path.
const real = await verifyWithRetry(ref);
if (!real.included) {
  console.error(`FAIL: real leaf ${SOLVA_ID_HASH} was not included in proof ${real.proofId}`);
  process.exit(1);
}
console.log(`ok: real leaf included on-chain (chain proof ${real.proofId})`);

// Same path, wrong balance: the contract recomputes a different root, so the
// check must fail. This is what stops an institution from faking a balance.
const dto = await fetch(
  `${SOLVA_ORCH_URL}/v1/proofs/inclusion/${encodeURIComponent(ref)}`,
  { headers: { "x-solva-tenant": SOLVA_TENANT } },
).then((r) => r.json());

const tampered = {
  proofId: dto.proof_id,
  customerIdHash: dto.customer_id_hash,
  balance: (BigInt(dto.balance) + 1n).toString(),
  path: dto.path.map((n) => ({
    hash: n.hash,
    sum: n.sum,
    position: n.sibling_is_left ? "left" : "right",
  })),
};

const bad = await solva.verifyInclusion(tampered);
if (bad.included) {
  console.error("FAIL: a tampered balance was accepted by verify_inclusion");
  process.exit(1);
}
console.log("ok: tampered balance rejected on-chain");
