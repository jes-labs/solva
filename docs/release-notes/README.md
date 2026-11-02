# Release notes

Every pull request that changes app code adds one note here, named `<YYYY-MM-DD>-<topic>.md`, from [`template.md`](template.md).

`scenario-impact` says what the change means for end-to-end scenarios:

- `updated`: an existing scenario changed and its test was updated in this PR.
- `needs_automation`: a new or changed scenario has no automated test yet.
- `none`: no user-visible scenario changed.
