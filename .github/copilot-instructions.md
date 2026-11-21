# SpaceSilo Copilot Instructions

The full agent guide lives in [AGENTS.md](../AGENTS.md) at the repo root. Read it first. It covers the layout, validated commands, known broken scripts, change guidance, the token budget, localization, and where specs live (Linear).

Must-knows if you only read this file:

- Specs and tasks live in Linear (team **SPA**). Read the issue, then its project, then the "SpaceSilo — Product Overview" doc. The workflow is described in [docs/agents/linear-workflow.md](../docs/agents/linear-workflow.md).
- Shared UI component rules are in [docs/agents/shared-components.md](../docs/agents/shared-components.md).
- On Windows PowerShell, use `pnpm.cmd`.
- Don't start dev servers or browsers unless asked. The user tests manually.
- Every user-facing string goes through i18n. Add English keys only, in `apps/native/src/i18n/locales/en.json`.
