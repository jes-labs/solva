# proof-registry

Single Soroban contract for the Solva proof registry. It holds the embedded
UltraHonk verifying key, runs BN254 proof verification, records published
proofs, and serves the public Poseidon2 inclusion check. No cross-contract
calls.

## Single-contract design

The design forks `yugocabrio/rs-soroban-ultrahonk`, with
`indextree/ultrahonk_soroban_contract` as a second reference. The verifying key is
stored once at deploy through `__constructor` and is immutable after that.
`publish_proof` verifies a proof against the stored key, re-asserts `R >= L`
using CAP-0082 checked 256-bit integers, records `ProofMeta`, and emits
`ProofPublished(id, R, L, ts)`. Reads come from `get_latest_proof` and
`get_proof`. `verify_inclusion` recomputes a Poseidon2 sum-tree path for a leaf
and compares it against the stored root.

Keeping verification, the registry, and the inclusion check in one contract
avoids cross-contract calls and keeps the Poseidon2 used on chain in the same
place as the proof it checks.

### Storage

- Instance: `owner`, `vk`, `latest_id`.
- Persistent: `proofs: Map<u64, ProofMeta>` where `ProofMeta = { root_h, R, L, timestamp }`.

## Testnet validation of the reference verifier

Before building the registry on top of `yugocabrio/rs-soroban-ultrahonk`, we
deployed the reference verifier as-is to Stellar Testnet and ran a known-good
proof through it. This confirmed the one external risk for the project: the
BN254 and Poseidon host functions the verifier depends on are live on the
network and a verification costs what we budgeted.

We fork from this exact reference commit:

- `yugocabrio/rs-soroban-ultrahonk` at
  `661db07200f890b1bd9a7349ed787c70a706dd12` (2026-06-09).
- Cross-checked against `indextree/ultrahonk_soroban_contract` at
  `5c32a280f0b2eaf1563c7096d81d25de8b315572`. Both expose the same
  `verify_proof(public_inputs, proof_bytes)` entrypoint, store the verifying
  key once through `__constructor`, and prove with the keccak oracle hash.
  yugocabrio is the superset we adopt: it ships the full Rust verifier crate,
  the testnet orchestrator, and the cost-measurement script.

### What ran on Testnet

The reference `simple_circuit` (`assert(x != y)`, with `x = 1`, `y = 2`) was
compiled with Noir `1.0.0-beta.9` and proved with Barretenberg `0.87.0`
(`--scheme ultra_honk --oracle_hash keccak`). That produced a 14592-byte proof
(456 fields), a 1760-byte verifying key, and 32 bytes of public input. The
verifier wasm was built with `soroban-sdk` 26.0.1 (`soroban-env` 26.1.3) and
deployed with `stellar-cli` 23.0.1.

- Network: Testnet, protocol 27. The BN254 and Poseidon2 host functions added
  in protocol 25 (X-Ray) are available, so the verifier runs natively.
- Contract id: `CA3KQYYAGUEIURJSB5CSWVMNIY2FF2EG3YTM7SBBRSN7DQWZXCCXWXN3`
  ([explorer](https://stellar.expert/explorer/testnet/contract/CA3KQYYAGUEIURJSB5CSWVMNIY2FF2EG3YTM7SBBRSN7DQWZXCCXWXN3)).
- Wasm hash: `f271e16470a46b30eb9ab9f450b510202b5fcdb09e0ee68bbec1429ebc5e3c6f`.
- A known-good proof verified on-chain, returning `Ok`
  ([verify tx](https://stellar.expert/explorer/testnet/tx/de9c70fcf69d9327eef127c9260993ac9551a3b42bc901d9910188b8fded2901),
  ledger 3191042). A second run produced the identical fee. A proof with one
  flipped byte was rejected with contract error 4 (`VerificationFailed`), so
  the verifier discriminates rather than always passing.

### Measured cost

| Transaction              | Fee charged                  | Frequency        |
|--------------------------|------------------------------|------------------|
| `verify_proof`           | 122514 stroops (0.0122514 XLM) | per verification |
| Contract deploy + init   | 210822 stroops (0.0210822 XLM) | once             |
| Wasm install (upload)    | 16567513 stroops (1.6567513 XLM) | once per code   |

The per-verification fee is `0.0123 XLM`, just under the `~0.014 XLM` budget,
and is deterministic across runs. The external risk is cleared: the reference
verifier deploys and verifies on Testnet at the expected cost.

Reproduce with the reference repo's pipeline:

```bash
export STELLAR_NETWORK_NAME=testnet
just fund    # friendbot-funds the source account
just deploy  # builds circuits + contract, deploys, writes .contract_id
just verify  # invokes verify_proof against the deployed contract
```

## Verifier

`verify_ultrahonk` runs the real UltraHonk over BN254 verifier, vendored into
`crates/ultrahonk-soroban-verifier` from `yugocabrio/rs-soroban-ultrahonk` at
commit `661db07200f890b1bd9a7349ed787c70a706dd12`. See that crate's `VENDORED.md`
for the exact provenance. `publish_proof` rebuilds the circuit's public inputs
from `PubInputs` as four 32-byte big-endian field elements in the order
`R, root_h, L, R_prev` (the layout `circuits/solvency` declares), then verifies
the proof against the stored key. Proofs and the key must use the keccak
transcript; see `circuits/README.md`.

### Testnet record

Deployed to Testnet (protocol 27) with the solvency verifying key and exercised
with the sample proof from `circuits/solvency`:

- Contract id: `CD3Q35TI5OLJISJ6RGXOMLYOWVO47QP6LARCK4SULBZ5OKHALBEEHCHI`
  ([explorer](https://stellar.expert/explorer/testnet/contract/CD3Q35TI5OLJISJ6RGXOMLYOWVO47QP6LARCK4SULBZ5OKHALBEEHCHI)).
- A genuine proof published successfully, returning id 1 and emitting
  `ProofPublished`
  ([tx](https://stellar.expert/explorer/testnet/tx/8319c77d9cdff121c6f9e3d2fa532c31c188d2fc215eb5d9653d31b8cc029aef)).
  A proof with one flipped byte was rejected on-chain with error 3
  (`ProofInvalid`).
- `publish_proof` fee: 240693 stroops (0.0240693 XLM). The BN254 verification
  portion is consistent with the 0.0122514 XLM measured for the bare reference
  verifier in the Testnet validation; the rest is the registry's persistent
  write, the event, and the bound re-check.

## Hardening note

The base reference verifier is not audited, and this contract is not audited
yet. Before mainnet, run the OpenZeppelin Soroban security detectors over
`proof-registry` and apply the audited OpenZeppelin contract patterns. The
`poseidon2_leaf` and `poseidon2_node` functions use the native protocol-25
Poseidon2 host function (via `soroban-poseidon`), and `verify_inclusion` checks
both the recomputed root hash and the sum against the committed values.
