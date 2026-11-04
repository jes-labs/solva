# Rebuilding the docs, in plain English

- **Status:** Accepted
- **Technical version:** [ADR-2026-11-04-docs-rebuild.md](ADR-2026-11-04-docs-rebuild.md)

## What is the problem?

The documentation at docs.joinsolva.xyz was written for the hackathon. It describes Solva as it was then, and it looks nothing like the new website. People who read it, from an anchor's compliance team to a developer, get an out-of-date picture.

## What are we doing about it?

We keep the tool we already use, Fumadocs. It is free, it already runs on our Cloudflare account, and it is built on the same technology as the website. We rewrite every page for the people who use Solva and give the docs the website's look. Every page will work in light and dark mode, can be copied as plain text for pasting into an AI assistant, and can be searched. Before writing, we study the best documentation sites and check every line of the current docs against the product.

## What changes for people?

- Readers get accurate docs that look and read like the website.
- The address stays docs.joinsolva.xyz, and old links keep working.
- It costs nothing beyond the team's time; there is no new paid service.

## What could go wrong?

A full rewrite can drift from what the product really does. Every technical statement is checked against the code during review, and anything not built yet is clearly marked as planned.
