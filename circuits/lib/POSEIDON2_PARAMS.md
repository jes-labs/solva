# Poseidon2 parameter set — Solva canonical reference

Every component that computes a Poseidon2 hash MUST use exactly this
parameter set and calling convention. Drift causes inclusion checks to fail
silently with no error surface beyond a wrong root.

## Field

| Parameter | Value |
|-----------|-------|
| Curve | BN254 (alt-bn128) |
| Prime p | 21888242871839275222246405745257275088548364400416034343698204186575808495617 |

## Instance

| Parameter | Value | Source |
|-----------|-------|--------|
| Width (t) | 3 | state = [capacity, rate[0], rate[1]] |
| Rate (r) | 2 | two field elements absorbed per call |
| Capacity (c) | 1 | state[0], always initialised to 0 |
| Full rounds (R_F) | 8 | 4 before, 4 after partial rounds |
| Partial rounds (R_P) | 56 | BN254 t=3 value from the Poseidon2 paper |
| S-box | x^5 | fifth-power substitution |
| MDS / internal matrix | Standard BN254 Poseidon2 for t=3 | Grassi et al. 2023 |
| Round constants | Grain LFSR, BN254 Poseidon2 t=3 | same paper |

## Calling convention

`hash2(a, b)` and `hash_leaf(id_hash, balance)` both call:

```
Poseidon2::hash([a, b], message_length=2)
```

State initialisation:

```
state[0] = 0        // capacity element, always zero
state[1] = a        // first rate element
state[2] = b        // second rate element
```

Apply one full Poseidon2 permutation. Output = `state[1]`.

**Two inputs only.** The `message_length` counter is not injected into the
state; it is Noir's domain-separation API. Rust and Stellar callers must
pass exactly two `Field` / `Fr` elements to replicate this.

## What the prover must NOT do

`services/prover/src/tree.rs` currently passes four inputs to `poseidon2`:

```rust
// WRONG — four inputs do not match the Noir circuit
let hash = poseidon2(&[left.hash, right.hash, field_from_u128(left.sum), field_from_u128(right.sum)]);
```

The circuit's `hash2` passes two inputs. The parity test enforces this.
`hash_pair` must be fixed to pass only the two child hashes:

```rust
// CORRECT — matches the circuit
let hash = poseidon2(&[left.hash, right.hash]);
```

The sums ride alongside the hash (as `Node::sum`) but are not fed into
the hash function. This is deliberate: the circuit commits to hashes only,
and the sum is carried in the public inputs.

## Implementation table

| Layer | Call | Crate / host fn | Version |
|-------|------|-----------------|---------|
| Noir circuit | `Poseidon2::hash([l, r], 2)` | `poseidon` crate | v0.2.6 |
| Rust prover | `poseidon2(&[left_hash, right_hash])` | TBD — `zkhash` or `light-poseidon` with BN254 | to be pinned |
| Stellar contract | `env.crypto().poseidon2_hash_bn254(&[l, r])` | CAP-0075 host fn | protocol 22 |

## Test vector file

`test-vectors/poseidon2_parity.json` in the repo root.
All three layer tests read expected values from there. Run:

```
# Step 1: get the ground-truth values from the Noir circuit
cd circuits/lib
nargo test --show-output poseidon2_parity_print

# Step 2: copy the printed field elements into the JSON file

# Step 3: run all three layer tests — they must all pass
just parity-check
```
