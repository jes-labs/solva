# circuits

Noir circuits for Solva and the proving flow that turns them into an on-chain
verifying key and a proof.

- `solvency` is the main circuit (PRD 2, section 5.1). It proves reserves cover
  liabilities, the published Poseidon2 sum-tree root is well formed, and
  reserves stayed within the fraud bound.
- `merkle` is the Poseidon2 Merkle Sum Tree library used by `solvency` and
  mirrored by the on-chain inclusion check.
- `lib` holds shared helpers (range checks, the sum-tree node type).

## Pinned tooling

The proving stack is version pinned so the verifying key is reproducible. A
different Noir or Barretenberg version produces a different VK and a different
proof encoding.

- Noir (`nargo`): `1.0.0-beta.9`
- Barretenberg (`bb`): `0.87.0`

```bash
noirup -v 1.0.0-beta.9
bbup -v 0.87.0
```

## Proving flow (solvency)

The on-chain verifier we deploy (`contracts/proof-registry`, vendored from
`yugocabrio/rs-soroban-ultrahonk`) implements the UltraHonk path with the
**keccak transcript** only. Every proof and verifying key MUST be generated with
`--scheme ultra_honk --oracle_hash keccak`. The circuit's internal hashing stays
Poseidon2; the `--oracle_hash` flag only sets the Fiat-Shamir transcript hash,
which is independent of the in-circuit gates.

```bash
cd circuits/solvency

# 1. Compile the circuit to ACIR.
nargo compile

# 2. Solve the witness from the sample inputs.
#    Prover.toml is gitignored; copy the committed example first.
cp Prover.toml.example Prover.toml
nargo execute            # writes target/solva_solvency.gz (witness)

# 3. Prove and write the verifying key (keccak transcript).
bb prove    --scheme ultra_honk --oracle_hash keccak \
  --bytecode_path target/solva_solvency.json \
  --witness_path  target/solva_solvency.gz \
  --output_path target --output_format bytes_and_fields
bb write_vk --scheme ultra_honk --oracle_hash keccak \
  --bytecode_path target/solva_solvency.json \
  --output_path target --output_format bytes_and_fields

# 4. Verify locally before trusting the artifacts.
bb verify --scheme ultra_honk --oracle_hash keccak \
  --proof_path target/proof \
  --public_inputs_path target/public_inputs \
  --vk_path target/vk
```

## Artifacts

`bb` writes these under `circuits/solvency/target/` (gitignored build output):

| File             | Size  | Role                                                        |
|------------------|-------|-------------------------------------------------------------|
| `vk`             | 1760 B | Verifying key. Embedded in `proof-registry` at deploy via `__constructor`. |
| `proof`          | 14592 B | The UltraHonk proof (456 BN254 field elements).            |
| `public_inputs`  | 128 B  | The 4 public inputs, 32-byte big-endian field elements.     |

### Public input layout

The solvency circuit declares its public inputs in this order, and `bb` emits
`public_inputs` as that many 32-byte big-endian field elements back to back. The
on-chain `publish_proof` rebuilds the same blob from its `PubInputs` struct, so
the order is load bearing:

| Index | Field    | Sample value           |
|-------|----------|------------------------|
| 0     | `R`      | 400 (reserves total)   |
| 1     | `root_h` | Poseidon2 sum-tree root |
| 2     | `L`      | 360 (liabilities total) |
| 3     | `R_prev` | 400 (previous reserves) |

## Sample witness

`Prover.toml.example` is the committed sample input. It matches the in-circuit
`test_solvent_passes` vector: a complete `N=8` tree of customers with balances
`10..80` (`L = 360`), reserves `[200, 200, 0, 0]` (`R = 400`), and `R_prev = 400`
so the fraud bound holds. The Poseidon2 hash4-with-sums root for that leaf set is
`0x0e36888d7cade7e79309cd7e58109611104c225f2fcd5a158c662debb173572f`.
