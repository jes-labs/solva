# A global reserve source, in plain English

- **Status:** Accepted

Companion to [ADR-2026-11-04-global-reserve-source.md](ADR-2026-11-04-global-reserve-source.md).

## What is the problem?

Solva is for anchors and custodial apps on Stellar, anywhere in the world. It is not for commercial banks. But the code behind the public demo still calls the place reserves come from "the bank", and the practice data is priced in Nigerian naira. The website hides that today, but the docs, the console and the code still say it, and it makes Solva look like a local banking tool.

## What are we doing about it?

We are using one set of words everywhere: the reserves come from a "reserve source". When a custodian signs the balance, the source is "attested". When the balance is read straight from Stellar, it is "on chain". The practice data is priced in US dollars, the currency most fiat tokens on Stellar are backed by. The demo institution called "Meridian Bank" becomes "Kestrel Anchor", the same example the website uses.

## What changes for people?

- Visitors to the demo see balances in dollars and never see the word bank.
- People reading the docs, the console or the code see the same words the website uses.
- The demo server is updated once, in about five minutes, with the steps written in the technical record. The website's settings do not change.

## What could go wrong?

The server's settings are renamed during the update. If the update stops halfway, the demo is down until it finishes, so it is done in one sitting. Someone is also working on a new way to read reserves straight from Stellar. That work should land first, so the two changes do not trip over each other.
