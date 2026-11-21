# How we work in Linear

This is the repo copy of the Linear document "Agent Guide — How we work in Linear". If the two disagree, update both.

SpaceSilo is a personal learning project. There are no sprints, cycles, or milestones. Work is pulled from the backlog by priority.

## Hierarchy

| Level | Linear object | Purpose |
|---|---|---|
| Product | Team document **"SpaceSilo — Product Overview"** | Vision, principles, architecture, glossary, feature map, product-level definition of done |
| Feature (epic) | **Project**, for example *Files*, *Gallery*, *Backups* | The feature spec in the project description: goal, concepts, API, client, rules, status, known gaps |
| Story / task | **Issue** `SPA-<n>` inside a project | One user-visible capability, **full stack** (shared + backend + client) |
| Sub-task | **Sub-issue** (rare) | Only when a story is too big for one PR |

Workspace: `space-silo`, team **Space silo**, key **SPA**.

Projects:
- Platform & DevEx
- Auth & Users
- Server Connections
- Shared UI Library
- App Shell, Dashboard & Settings
- Files
- Viewer & Previews
- Gallery
- Groups & Sharing
- Notes
- Backups
- Mobile Device Sync
- TV App

## Labels

- **Type:** `Feature`, `Improvement`, `Bug`, `Tech debt`, `Security`, `Idea`. `Idea` means not committed yet, so discuss it before you build it.
- **Layer** (multi-select group): `Backend` (`apps/core`), `Client` (`apps/native`, web and mobile), `Shared` (`apps/shared` DTOs, Prisma, and components), `Infra` (Docker, CI, tooling).

## Status flow

`Backlog` → `Todo` → `In Progress` → `In Review` → `Done` (or `Canceled` / `Duplicate`)

- **Backlog:** specified but not planned next.
- **Todo:** next up. Pick from here first, by priority (Urgent > High > Medium > Low).
- **In Progress:** an agent or the user is working on it.
- **In Review:** the implementation is finished and waiting for the user's manual check. Only the user moves an issue to Done.
- Done issues keep their spec as documentation of current behavior.

Dependencies use Linear's **blocked by** relations. Don't start an issue whose blockers aren't done.

## Issue template

```markdown
## Story
As a <role>, I want <capability>, so that <benefit>.

## Acceptance criteria
- [ ] Observable, testable outcome
- [ ] ...

## Implementation
**Shared:** DTOs / Prisma changes
**Backend:** endpoints, services, guards
**Client:** screens, hooks, API client, i18n keys

## Edge cases
- ...

## Code pointers
`path/to/file.ts:line`

## Out of scope
- ...
```

For **Done** issues, replace "Acceptance criteria" with **Behavior**, which describes what the code does today.

Keep sections short. Include only the ones that add information.

## Agent workflow

1. Read the Product Overview, then the issue's project, then the issue and its blockers.
2. Move the issue to **In Progress**.
3. Implement it following [AGENTS.md](../../AGENTS.md) (and [shared-components.md](shared-components.md) for UI primitives). Order: shared → backend → client.
4. Validate with lint, typecheck, and build per AGENTS.md. Add backend tests once the test harness exists.
5. Tick the acceptance criteria in the issue. Add a comment with the summary, any deviations, and a manual test checklist for the user.
6. Move the issue to **In Review**.
7. New work you discover becomes a new **Backlog** issue in the right project, using the template above. Don't expand scope silently.
8. If the spec turns out to be wrong or outdated, update the issue or project description as part of the work.
