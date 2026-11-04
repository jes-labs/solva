# Real reserves in the demo, in plain English

- **Status:** Accepted
- **Technical version:** [ADR-2026-11-04-onchain-reserve-demo.md](ADR-2026-11-04-onchain-reserve-demo.md)

## What is the problem?

The demo proves that reserves cover what is owed, but the reserves it uses are made up: a pretend custodian signs pretend balances. The judges of the June hackathon asked Solva to connect one real source of reserves, and suggested money held on Stellar itself as the simplest honest one.

## What are we doing about it?

We add a third example institution to the demo, Harbor Wallet. Its reserves are real US dollar tokens (Circle's USDC on Stellar's test network) held in an account the Solva team controls. Every time the demo runs, Solva reads that balance live from Stellar, proves it covers what Harbor Wallet owes its example customers, and publishes the proof. Anyone can open the account on a Stellar explorer and see the same balance. The demo also reads the published record, and checks one customer's balance, directly from the contract on Stellar instead of from Solva's own server. The two existing example institutions stay as they are, so the demo can still show what happens when reserves fall short.

## What changes for people?

- Visitors to the demo can pick an institution whose reserves are real money on Stellar.
- The team funds one test account and runs a short setup on the server.
- No cost beyond the team's time; test-network money has no value.

## What could go wrong?

If someone adds a lot of money to the account at once, the next proof is refused, because Solva only accepts a rise of up to 10% between proofs. The team tops the account up in small steps, and the docs explain the rule.
