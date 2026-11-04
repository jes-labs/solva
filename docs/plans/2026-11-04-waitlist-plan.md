# Plan: a working waitlist

## 1. Scope

Implements [ADR-2026-11-04-waitlist](../adr/ADR-2026-11-04-waitlist.md), accepted on 2026-11-04.

## 2. Files

| File                                                              | Change                                                                                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `features/contact/server/waitlist.ts`                             | New. `submitWaitlist`: validate, honeypot, look the address up, create the contact in the segment, send the confirmation.                                    |
| `features/contact/server/actions.ts`                              | `joinWaitlist` calls `submitWaitlist`. `sendContact` is unchanged.                                                                                           |
| `features/contact/server/env.ts`                                  | Reads `RESEND_WAITLIST_SEGMENT_ID` as well.                                                                                                                  |
| `features/contact/server/mailer.ts`                               | `deliver` sends to the message's `to`.                                                                                                                       |
| `features/contact/types.ts`                                       | `OutgoingMessage` gains `to`.                                                                                                                                |
| `features/contact/lib/message.ts`                                 | `contactMessage` sets `to` to the team inbox; `waitlistMessage` becomes `waitlistConfirmation`, addressed to the person who joined, reply-to the team inbox. |
| `features/contact/components/sent-panel.tsx`, `waitlist-form.tsx` | The sent panel's footer line is a prop; the waitlist says the confirmation was sent.                                                                         |
| `.env.example`, `.dev.vars.example`, `infra/CLOUDFLARE.md`        | Name the new secret.                                                                                                                                         |

## 3. Behaviour

| Case                                | Result                                                                                          |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| New address                         | Contact created with `organisation` and `role` in the segment; confirmation sent; state `sent`. |
| Address already a contact           | State `invalid`, email error "This email is already on the waitlist."; nothing created or sent. |
| Lookup or create fails              | State `failed`, reason `delivery`.                                                              |
| Contact created, confirmation fails | State `sent`: the person is on the list; the failure is logged.                                 |
| Key or segment id missing           | State `failed`, reason `unconfigured`; no call to Resend.                                       |
| Honeypot filled                     | State `sent`; no call to Resend.                                                                |

## 4. Tests

Each row above is a test in `server/actions.test.ts`, with `resend` mocked (`contacts.get`, `contacts.create`, `emails.send`), plus env tests for the segment id. The contact form's tests stay and gain the `to` assertion.

## 5. Removal

The team notification email for waitlist signups and `waitlistMessage`.
