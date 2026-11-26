# Proposal

## Why

Both `openspec/config.yaml` (lines 3-6, 47) and `frontend/openspec/config.yaml` (lines 3-5, 10, 56, 64) name a root `CLAUDE.md` and `frontend/CLAUDE.md` as the operating guides every artifact must conform to, and the root apply guidance says "Read the CLAUDE.md of every component the change touches before starting". Only `backend/CLAUDE.md` exists, so that cannot be followed for the root or the frontend. Also, `frontend/openspec/config.yaml` described a stack the real scaffold on `feature/adding-chat-page` does not use (Tailwind, MathJax, Playwright/MSW, Zod, Biome, a `services/api` layer).

## What Changes

- Add `CLAUDE.md` at the repo root: monorepo map, component guides and OpenSpec roots, the OpenSpec flow, the Moodle boundary, local/prod/Railway commands, environment and secrets rules, and the cross-cutting pedagogical and data-protection constraints.
- Add `frontend/CLAUDE.md`: describes only the scaffold on `feature/adding-chat-page` (React 19, Vite, TypeScript strict, MUI/Emotion, KaTeX, pnpm, Node 24, Vitest + Testing Library): stack, `src/` layout, scripts, testing, conventions.
- Align `frontend/openspec/config.yaml` with that scaffold: stack, `src/modules` architecture, test tooling, verification rules and guidance (`pnpm run lint|test|build`). Rules the code does not contradict are kept. Already applied at the user's request.
- Align root `openspec/config.yaml`: name the root guide and make apply guidance read it. Already applied.
- Guides follow `backend/CLAUDE.md` in structure and tone, and state only facts verified against the repository or commit `66535660`.
- No product behavior, code, compose, Dockerfile, `.env.example`, `README.md` or `backend/openspec/config.yaml` changes.

## Capabilities

### New Capabilities
None. Documentation and OpenSpec configuration only; `.openspec.yaml` sets `skip_specs: true`.

### Modified Capabilities
None.

## Impact

- **Components touched:** root and `frontend/` documentation and OpenSpec config. No backend, Moodle, or infra change.
- **Layout:** one root-level change covers everything by user decision, deviating from the root rule to split component work (docs/config only; see design).
- **Traceability:** no RF/RNF applies; motivation is the config references above and the `backend/CLAUDE.md` precedent. `docs/` holds the two deploy guides and the Anteproyecto PDF (added during apply, untracked); the SRS, survey and interview documents the configs cite have no files yet (empty `desing/`, `interviews/`, `polls/` folders exist locally), so config rules citing them are unchanged.
- **Outcome:** apply and archive guidance becomes actionable and guides and configs agree. Quality metrics (>= 85% math accuracy, latency, uptime) are unaffected.
- **Out of scope:** the stale "backend/frontend are empty" text in `README.md`, merging `feature/adding-chat-page`, adding the remaining academic documents.
