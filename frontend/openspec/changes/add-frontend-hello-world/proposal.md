# Proposal

## Why

Frontend package of monorepo is currently empty (only `.gitkeep` and `openspec/`). Need working React + Vite + TypeScript scaffold running a basic "Hello World" page before any real feature work starts, so later changes have a buildable foundation to extend.

## What Changes

- Scaffold a new Vite project in `frontend/` using the `react-ts` template.
- Add `package.json` with `dev`, `build`, `preview`, and `lint` scripts.
- Add base TypeScript config (`tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`) per Vite's react-ts template.
- Add ESLint config per Vite's react-ts template defaults.
- Replace default Vite template content with a minimal "Hello World" page (e.g. renders `Hello, World!` inside `App.tsx`), removing unused template boilerplate/assets not needed for a hello-world baseline.
- Add `.gitignore` entries for `node_modules`, build output (`dist`), and editor/log files (extending the existing placeholder `frontend/.gitignore`).

## Capabilities

### New Capabilities
- `app-shell`: The baseline React + Vite + TypeScript application shell that builds, runs in dev mode, and renders a root page.

### Modified Capabilities
(none — frontend has no prior capabilities)

## Impact

- Affected paths: `frontend/` (new `package.json`, `vite.config.ts`, `tsconfig*.json`, `src/`, `index.html`, `.eslintrc`/`eslint.config.js`, updated `.gitignore`).
- New dependencies: `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `typescript`, and related `@types/*` / ESLint dev dependencies pulled in by the Vite `react-ts` template.
- No backend, API, or deployment impact — purely adds the frontend app shell.
