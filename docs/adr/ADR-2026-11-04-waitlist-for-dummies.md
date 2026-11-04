# A working waitlist, in plain English

- **Status:** Accepted
- **Technical version:** [ADR-2026-11-04-waitlist.md](ADR-2026-11-04-waitlist.md)

## What is the problem?

When someone joins the waitlist on the website, the team gets an email, and that is all. No list is kept, the person gets no confirmation even though the page promises one, and someone who joins twice is counted twice.

## What are we doing about it?

Each person who joins is saved to a list in Resend, the email service the website already uses, and gets an email confirming their place. If they reply, the reply reaches the team at hello@joinsolva.xyz. The team no longer gets an email per signup; it reads the list in Resend, exports it, and emails everyone on it when pilots open. An email address can join only once; a second try is told it is already on the list.

## What changes for people?

- People who join get a confirmation email straight away.
- The team has a real list instead of a pile of emails, and no inbox noise.
- No new cost: Resend is already in use.

## What could go wrong?

If Resend is down, the form says the request did not go through, so nobody is told they joined when they did not.
