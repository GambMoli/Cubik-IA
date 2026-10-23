# Proposal

## Why

`frontend/src` holds only `App.tsx`, `main.tsx` and `index.css`. Upcoming work (chat page on branch `feature/add-chatPage`) needs an agreed place for each kind of code. Fix the layout now, while `src` is nearly empty, so later changes add files into known folders instead of inventing structure ad hoc.

## What Changes

- Define the standard top-level folders of `frontend/src`: `assets`, `components`, `hooks`, `icon`, `layouts`, `modules`, `routes`, `utils`.
- Each folder tracked in git via an empty `.gitkeep` until real files replace it.
- Document the intended purpose of each folder so contributors know where new code goes.
- Existing `App.tsx`, `main.tsx`, `index.css` stay at `src/` root, unchanged.
- No code, dependency, import-path or build-config changes.

Note: the eight folders were already created manually in the working tree before this change was proposed; this change records and formalizes that layout.

## Capabilities

### New Capabilities
- `src-layout`: Required folder structure and per-folder responsibility for the frontend `src` directory.

### Modified Capabilities
(none — no existing specs; `app-shell` from `add-frontend-hello-world` is untouched)

## Impact

- Affected paths: `frontend/src/{assets,components,hooks,icon,layouts,modules,routes,utils}/` (new, each with `.gitkeep`).
- No dependencies, APIs, backend or deployment impact.
- No effect on `pnpm build` / `pnpm lint` output.
