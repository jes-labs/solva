# solva-prover

gRPC service that builds the Poseidon2 Merkle Sum Tree and generates the
Noir/UltraHonk solvency proof.

## Why this crate owns the ZK-critical path

The tree construction, the circuit witnessing, and the proof generation all live
here in one Rust/Noir stack. This is deliberate. The Poseidon2 hashing that
builds the tree must be byte-for-byte identical to the hashing inside the Noir
circuit and the Poseidon2 host function the `proof-registry` contract calls on
chain. If those three drift, a proof can verify against a root the circuit never
actually committed to, and solvency soundness is lost.

Keeping the tree, the witness, and the prover in a single crate removes the seam
where that drift would happen. The Go orchestrator never hashes for the circuit;
it only ships the witness over gRPC and zeroizes its copy afterward.

## Modules

- `tree.rs`: Poseidon2 Merkle Sum Tree: `Node { hash, sum }`, `build`,
  `inclusion_path`. The Poseidon2 permutation is a clearly marked stub until the
  circuit's exact parameters are wired in.
- `proving.rs`: witness assembly and UltraHonk proof generation. Signatures and
  TODOs; the `bb`/barretenberg and `acvm` backends land in the proving issue.
- `service.rs`: implements the generated Prover gRPC trait and zeroizes the
  witness copy after proving.
- `main.rs`: starts the tonic server.

## Pending wiring

The proving backend crates (`bb`/barretenberg bindings, `acvm`) are heavy and may
need git sources, so they are not declared yet. The Poseidon2 parameters are not
invented here; they come from the chosen Noir Poseidon2 instance and must be
cross-checked against the Stellar native host function on testnet before the
stubs are replaced.
