# Design

## Context

`frontend/src` currently has `App.tsx`, `main.tsx`, `index.css` and the eight requested folders, each holding only a `.gitkeep` (created manually before this change). TypeScript uses bundler module resolution with no `paths` and Vite has no `resolve.alias`; imports are relative. The branch `feature/add-chatPage` will be the first real consumer of the layout. See proposal.md - Why.

## Goals / Non-Goals

**Goals:**
- One flat set of eight top-level folders with clear, non-overlapping responsibilities (see specs/src-layout/spec.md).
- Folders survive git commit/clone while empty.

**Non-Goals:**
- Import path aliases (`@/...`) in `tsconfig` / Vite config.
- Moving or splitting `App.tsx`, `main.tsx`, `index.css`.
- Adding a router, state manager or any dependency that would populate `routes`, `modules` or `hooks`.
- Index/barrel files per folder.

## Decisions

**Flat layout, no nesting beyond the eight folders.** Names are exactly as requested, including singular `icon`. Alternatives: feature-first only (everything under `modules`) — rejected, user asked for shared folders; layer-first only — rejected, scatters one feature across many folders.

**Boundary rule for shared vs feature code.** Code starts inside its module (`modules/<feature>/`) and moves to `components`, `hooks` or `utils` only when a second module needs it. Avoids `components` becoming a dumping ground.

**`icon` vs `assets`.** `icon` holds icon files/components; `assets` holds other static media (images, fonts). Keeps icons importable as a unit and keeps `assets` small.

**`.gitkeep` placeholders.** Git does not track empty directories; `.gitkeep` is the convention already used in this repo (`frontend/.gitkeep`). Alternative: README per folder — rejected, heavier, and the purpose is documented in the spec instead.

**No aliases now.** Relative imports work today and aliases touch `tsconfig.app.json`, `vite.config.ts` and ESLint resolution. Deferred to its own change if deep relative paths become painful.

## Risks / Trade-offs

- [Stale `.gitkeep` left beside real files] → Harmless; remove when first real file lands in the folder.
- [Ambiguity between `components` and `modules/<x>/components`] → Boundary rule above; revisit in code review.
- [Deep `../../..` imports as modules grow] → Alias change deferred, tracked as future work.
