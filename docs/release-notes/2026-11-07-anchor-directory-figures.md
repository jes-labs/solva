---
date: 2026-11-07
branch: docs/anchor-directory-figures
base: main
scenario-impact: none
---

# The anchor and custodial-app pages cite the Stellar Anchor Directory

The anchors page and the Stellar standards doc now say how few directory entries link to reserve evidence. The custodial apps page no longer says that many custodial apps publish a monthly attestation, which the directory does not support for Stellar.

## Changes

- Website, anchors page: the "What holders and partners see" opening says that in November 2026, 6 of 74 directory anchors were marked as publishing reserve evidence and 2 of those links opened a report.
- Website, custodial apps page: the comparison opening says the directory listed 30 exchanges and marked none as publishing reserve evidence.
- README: one paragraph with the same figures under "Why both sides of the balance sheet".
- Docs, Stellar standards: one paragraph on how `attestation_of_reserve` is used in the directory, and why exchanges have no place in it.

## Removed

- The unsupported claim "Many custodial apps publish a monthly attestation."

## Verification

- Figures counted from the directory's page data on 7 November 2026: 74 entries; attestation of reserves 6 yes, 1 no, 67 not applicable; 30 exchanges, all not applicable. The five stored links were opened the same day: Circle and GMO Trust load, MyKobo returns 404, the others are a fund page and a home page.
