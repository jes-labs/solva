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

## Verifier

`verify_ultrahonk` runs the real UltraHonk over BN254 verifier, vendored into
`crates/ultrahonk-soroban-verifier` from `yugocabrio/rs-soroban-ultrahonk` at
commit `661db07200f890b1bd9a7349ed787c70a706dd12` (see that crate's `VENDORED.md`
for provenance). `publish_proof` rebuilds the circuit's public inputs from
`PubInputs` as four 32-byte big-endian field elements in the order
`R, root_h, L, R_prev` (the layout `circuits/solvency` declares), then verifies
the proof against the stored key. Proofs and the key must use the keccak
transcript; see `circuits/README.md`.

### Testnet record

Deployed to Testnet (protocol 27) with the solvency verifying key and exercised
with the sample proof from `circuits/solvency`:

- Contract id: `CD42FXVTO3GHVYYLKRPNLAAFRBOZGHG7Z22VBCVLGD7SBK2XA6TMGJ27`
  ([explorer](https://stellar.expert/explorer/testnet/contract/CD42FXVTO3GHVYYLKRPNLAAFRBOZGHG7Z22VBCVLGD7SBK2XA6TMGJ27)).
- A genuine proof published successfully, returning id 1 and emitting
  `proof_published_event`
  ([tx](https://stellar.expert/explorer/testnet/tx/cf02542ff27eae59e377a74774a464f46600fad564e6612ab8a4a942870547e0)).
  A proof with one flipped byte is rejected with error 3 (`ProofInvalid`),
  covered by the contract tests.
- `publish_proof` fee: 244729 stroops (0.0244729 XLM), in line with the
  ~0.0123 XLM bare-verification cost from the reference Testnet validation plus
  the registry's persistent write, event, and bound re-check.

## Hardening note

This contract is not audited yet, and the vendored verifier crate is not
audited. Before mainnet, run the OpenZeppelin Soroban security detectors over
`proof-registry` and the verifier crate, and apply the audited OpenZeppelin
contract patterns.
