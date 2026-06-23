# Vendored: ultrahonk-soroban-verifier

This crate is vendored verbatim from the validated reference fork. We keep the
source in tree so we can audit and harden it (the OpenZeppelin Soroban detector
pass noted in `contracts/proof-registry/README.md`) rather than pull an
unaudited dependency at build time.

- Upstream: `yugocabrio/rs-soroban-ultrahonk`
- Path in upstream: `crates/ultrahonk-soroban-verifier`
- Exact commit: `661db07200f890b1bd9a7349ed787c70a706dd12` (2026-06-09)
- Validated on Stellar Testnet (protocol 27) before vendoring. See the Testnet
  validation note in `contracts/proof-registry/README.md`.

## What was changed on vendoring

- `Cargo.toml`: dropped the dev-dependencies (`ultrahonk-test-utils`) and the
  upstream `tests/` directory. They load circuit fixtures from the upstream repo
  layout, which we do not carry.
- `src/`: removed the inline `#[cfg(test)]` modules (and the `debug::hex_to_bytes`
  test helper they used). The upstream tests depend on `ultrahonk-test-utils`
  and on-disk fixtures we do not vendor. The library logic is otherwise
  unmodified. Coverage now comes from `contracts/proof-registry`, which verifies
  a real solvency proof end to end and on chain.

## Scope and limits

`VERIFIER_PROVENANCE.md` records the 1:1 mapping to Barretenberg. The verifier
supports the native BN254 UltraHonk path with a keccak transcript only: no
UltraZK/hiding flavor, no recursion, no Poseidon2 transcript. Proofs must be
generated with `bb prove --scheme ultra_honk --oracle_hash keccak`.
