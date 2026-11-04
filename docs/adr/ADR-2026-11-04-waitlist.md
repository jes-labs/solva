# ADR-2026-11-04: Keep the waitlist, and confirm each signup

- **Status:** Accepted
- **Approved by:** signor1, 2026-11-04
- **Companion:** [ADR-2026-11-04-waitlist-for-dummies.md](ADR-2026-11-04-waitlist-for-dummies.md)

## Context

The waitlist at joinsolva.xyz/waitlist takes a work email, an organisation and a role, then sends one email to the team inbox through Resend (`apps/website/src/features/contact/server`). On 2026-11-04 Resend accepted two live test signups; the first bounced because `hello@joinsolva.xyz` did not exist yet, and the second was suppressed because of that bounce. Nothing else happens:

- no list is kept, so the team cannot count signups, export them, or invite them later;
- the person who joins gets no confirmation, although the page promises "we will hold your place and write to you";
- the same address can join any number of times, and each time the team gets another email.

The website already depends on `resend` 6.14.0, whose Contacts and Segments APIs store contacts with custom properties in the same Resend account that sends the email.

## Options considered

### Option A: store signups in Resend Contacts

Each signup becomes a Resend contact with the properties `organisation` and `role`, added to a "Waitlist" segment. The team sees, exports and later emails the list from Resend. No new service, database or package.

### Option B: store signups in Cloudflare D1 or KV

Our own table, queryable. Adds a binding, a schema, a migration path and an admin view to build. More than a waitlist needs.

### Option C: keep the email only

No change. The page's promise stays unmet, and the list lives in an inbox.

## Decision

Option A, with the maintainer's rules from 2026-11-04: email only the person who joins, never the team inbox, and accept each address once.

- On a valid signup, the server action looks the email up in Resend Contacts.
- A new address is created as a contact with `organisation` and `role`, added to the segment named by `RESEND_WAITLIST_SEGMENT_ID`, and sent one confirmation email from `hello@send.joinsolva.xyz` with `hello@joinsolva.xyz` as reply-to. The confirmation says they are on the list and what happens next. A reply reaches the team.
- An address already on the list is not added or emailed again. The form shows "This email is already on the waitlist" under the email field.
- No email goes to the team inbox. The team reads the list in Resend, under the "Waitlist" segment.
- If Resend fails at any step, the form shows its existing error state, never a false success. If `RESEND_WAITLIST_SEGMENT_ID` is not set, the server action reports the waitlist as unconfigured, as it does today for a missing API key.
- The contact form is unchanged: it still emails the team inbox, with the sender as reply-to.

Setup, done once by the maintainer in the Resend dashboard: create the contact properties `organisation` and `role` (text), create the "Waitlist" segment, and set `RESEND_WAITLIST_SEGMENT_ID` as a secret on the `solva-website` Worker.

## Diagram

```
 waitlist form ─► server action ─► validate
                                     │
                    Resend Contacts: get by email ── exists ─► "already on the waitlist"
                                     │ new
                    create contact (organisation, role) + add to "Waitlist" segment
                                     │
                    confirmation email to the signup (reply-to hello@joinsolva.xyz)
```

## Consequences

- Better: a real, exportable list; a confirmation the page already promised; one signup per address; no inbox noise.
- Costs: three Resend API calls per signup instead of one; one new Worker secret; contact property and segment setup in Resend.
- Packages: none added.

## Verification

- Unit tests for the new path: new signup, an address already on the list, a Resend failure at each step, the unconfigured segment, and the honeypot.
- A live signup after deploy appears in the "Waitlist" segment with its properties, the address receives the confirmation, and a second signup with the same address is refused.
