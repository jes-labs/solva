# proof-registry

Single Soroban contract for the Solva proof registry. It holds the embedded
UltraHonk verifying key, runs BN254 proof verification, records published
proofs, and serves the public Poseidon2 inclusion check. No cross-contract
calls.

## Single-contract design

The design forks `NethermindEth/rs-soroban-ultrahonk`. The verifying key is
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

## Hardening note

The base reference verifier is not audited, and this contract is not audited
yet. Before mainnet, run the OpenZeppelin Soroban security detectors over
`proof-registry` and apply the audited OpenZeppelin contract patterns. The
`verify_ultrahonk`, `poseidon2_leaf`, and `poseidon2_node` functions are marked
stubs that must be replaced with the native BN254 and Poseidon2 host functions
before any deployment.
