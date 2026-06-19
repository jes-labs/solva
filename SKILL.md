---
name: solva-engineering-standards
description: Engineering standards for the Solva protocol. Read before writing or reviewing any code, comment, or document in this repository.
---

# Solva Engineering Standards

These are the rules for building Solva. They apply to every contributor, human or agent. Read them before you write code, comments, documentation, or commit messages. They are not suggestions.

## Architecture

- Build modular. Every component has one job and a clear boundary. If a function or a package does two unrelated things, split it.
- Abstract at the seams, not everywhere. Define an interface where two tiers meet (orchestrator to prover, repo to database, bank adapter to source). Do not wrap code in layers that add no behavior.
- The orchestrator follows clean architecture. Dependencies point inward: entity has zero imports, usecase defines interfaces, infrastructure and repo implement them. Never let a domain object import a database driver.
- All hashing that must match the circuit lives only in the Rust prover and the Soroban contract. The Go orchestrator never hashes for the circuit. This is a hard rule. It is how we prevent Poseidon parameter drift.
- Keep the same pattern across a tier. If one bank adapter uses a given shape, every bank adapter uses that shape. A reviewer should not have to relearn the design per file.

## Correctness

- Verify each implementation before you move to the next one. Run the test, run the service, check the output. Do not stack unverified work on top of unverified work.
- No shortcuts. If a thing is hard, solve it. Do not paper over a problem with a flag, a sleep, a swallowed error, or a hardcoded value that hides the real path.
- No damage control. When something breaks, find the cause and fix it. Do not patch the symptom and move on.
- Handle errors where they happen. Return them with context. Never silence an error to make a test pass.
- Write tests that prove the behavior, not tests that mirror the implementation. A solvency circuit test must cover the true case, the false case, the fraud bound, and the inclusion path.

## Comments and naming

- Write every comment by hand, in plain English. Short, clear, and specific.
- No AI tone. Do not write filler like "this robust function elegantly handles". Say what the code does and why, then stop.
- Do not use em-dashes anywhere. Use a comma, a colon, or a period.
- A comment explains why, or explains a non-obvious what. Do not narrate code that already reads clearly.
- Name things for what they are. `verifyECDSA`, not `doCheck`. `MerkleSumTree`, not `Tree2`.

## Documentation

- Write docs the way a technical writer would. Technically correct, clear, and unambiguous.
- No jargon for its own sake. Define a term the first time you use it.
- Keep examples runnable. If a code sample is in the docs, it must compile and work.
- The README stays short. Deep material goes in `apps/docs`.

## Git and review

- One issue, one branch, one pull request. Keep the scope of a PR equal to the scope of its issue.
- Commits are atomic. One logical change per commit, with a message that says what changed and why. Commit and push after each fixed issue before starting the next.
- Branch off `main`. Open a PR. Get one approval. Resolve every conversation. Squash merge. The branch is deleted on merge.
- Do not commit generated code unless the repository says to. Regenerate it from its source with the matching Just target.
- Do not commit secrets. Use environment variables and the documented KMS path for the publisher signer.

## Tooling

- Use the pinned toolchain versions. Do not bump a version inside an unrelated change.
- When a task needs an MCP server that is available in the environment, use it. Check first, then use it.
- Run `just lint` and `just test` before you open a pull request.

## The bar

Build as a senior engineer who understands system architecture, core engineering principles, and problem solving. If a choice is between fast and correct, pick correct and explain the cost. Leave the codebase easier to work in than you found it.
