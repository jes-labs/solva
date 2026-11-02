# Plans

Implementation plans for work larger than a small fix, written after the ADR is approved and before code. Name them `<YYYY-MM-DD>-<topic>-plan.md`.

A plan covers:

1. **Scope:** the issue and the approved ADR it implements.
2. **Files:** what will be added, changed and removed, by layer.
3. **Interfaces:** component props, hook return types, server function signatures, domain types.
4. **State:** which hook manages what (see the hook table in the standards).
5. **Tests:** what each test proves, including loading, empty and error states.
6. **UI:** a sketch or screenshot of each state.
7. **Removal:** what this replaces and the packages that go with it.
8. **Lighthouse:** the routes affected and how they stay at 98 or more in every category.
