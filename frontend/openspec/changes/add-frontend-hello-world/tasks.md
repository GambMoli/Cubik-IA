# Tasks

## 1. Scaffold

- [x] 1.1 Generate Vite `react-ts` template into `frontend/` (package.json, index.html, src/, tsconfig*.json, eslint config, vite.config.ts) and verify `frontend/package.json` lists `dev`, `build`, `preview`, `lint` scripts
- [x] 1.2 Install dependencies and verify `node_modules` is created without errors
- [x] 1.3 Update `frontend/.gitignore` to cover `node_modules`, `dist`, and editor/log files, and verify `git status` does not show `node_modules`/`dist` as untracked after a build

## 2. Hello World Page

- [x] 2.1 Replace default template content in `src/App.tsx` (and remove unused template assets/boilerplate it no longer needs) so it renders a visible "Hello, World!" greeting, and verify by running the dev server and viewing the page in a browser
- [x] 2.2 Run the production build and verify it completes successfully and emits output assets to the build directory

## 3. Verification

- [x] 3.1 Run the lint script and verify it passes with no errors
- [x] 3.2 Run `openspec validate add-frontend-hello-world --strict` and verify it passes
