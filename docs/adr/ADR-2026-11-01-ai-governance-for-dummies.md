# Rules for the AI tools that help build Solva

- **Status:** Accepted
- **Technical version:** [ADR-2026-11-01-ai-governance.md](ADR-2026-11-01-ai-governance.md)

## What is the problem?

AI assistants write much of Solva's code and text now. Today they follow our rules only if they happen to read them, and nothing checks their work before it reaches the main codebase. That is how we end up with AI-sounding comments, untested changes, or someone's name missing from their own commit.

## What are we doing about it?

We are giving every AI tool one rulebook to read first, and adding automatic checks that refuse work that breaks the rules. For anything bigger than a small fix, the AI must first write two short decision notes, one technical and one like this one, and a founder must approve them before any work starts.

## What changes for people?

- Founders see a decision note to approve before each larger piece of work.
- Every change records what it did in a short release note.
- Commits are always credited to the person who makes them, never to an AI.
- Pushing code takes a little longer because checks run first.

## What could go wrong?

The checks could slow us down before the SCF deadline. To keep that small, the strict comment check only looks at files a change touches, not the whole codebase, and anything a laptop cannot run is still checked in CI.
