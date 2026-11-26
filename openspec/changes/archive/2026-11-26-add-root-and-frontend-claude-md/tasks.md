# Tasks

## 1. Root CLAUDE.md

- [x] 1.1 Re-read `backend/CLAUDE.md`, `openspec/config.yaml`, `README.md`, `docker-compose.yml`, `docker-compose.prod.yml`, `.env.example`, `.gitattributes` and `.gitignore` from disk, then create `CLAUDE.md` at the repo root with the sections in design.md Decision 3 (same heading style as `backend/CLAUDE.md`). Verify: `grep -n '^## ' CLAUDE.md` lists a section for every row of the Decision 3 table.
- [x] 1.2 Check every concrete claim in the root guide against its source: each `docker compose` command and flag against `README.md`, each env var name against `.env.example`, each path against `git ls-files`, each pointer against an existing file. Verify: no claim is left without a source; any mismatch is fixed in the guide, not in the source.
- [x] 1.3 Confirm the root guide lists `docs/` as the two deploy guides plus the Anteproyecto PDF (cited by its real path), states that the other academic documents cited by `openspec/config.yaml` (SRS, survey, interviews, Figma export) have no files yet (naming the empty `docs/desing/`, `interviews/` and `polls/` folders, citing no file that does not exist), and links to `config.yaml` rules instead of copying them. Verify: `ls docs` matches what the guide lists, `grep -n -i 'IEEE\|encuesta\|survey\|entrevista' CLAUDE.md` shows only the "not in the repo" statement, and `wc -l CLAUDE.md` is about 90 lines or fewer.

## 2. frontend/CLAUDE.md

- [x] 2.1 Extract the facts from commit `66535660` (branch `feature/adding-chat-page`) into a temporary directory outside the repo with `git show 66535660:frontend/<path>`: `package.json`, `.nvmrc`, `vite.config.ts`, `tsconfig.app.json`, `eslint.config.js`, `src/setupTests.ts`, `src/testUtils.tsx`, `src/main.tsx`, `README.md`, `openspec/specs/src-layout/spec.md`, and the render path of `src/components/MathContent/` (how math and text are rendered, including any raw-HTML or trust option). Verify: a short fact list exists with one source file or commit path per fact.
- [x] 2.2 Create `frontend/CLAUDE.md` from that fact list only: purpose and Moodle LTI iframe embedding, Stack with versions (TypeScript is strict through the TypeScript 6 default; `tsconfig.app.json` sets no explicit `strict`, which the guide says), `src/` layout with what belongs where, scripts run as `pnpm run <script>`, Testing (Vitest + Testing Library + jsdom, tests beside code, `setupTests.ts`, `renderWithTheme`), Conventions (presentational chat page fed by temporary fixtures, KaTeX math rendering, theme in `utils/theme.ts`), a Security note limited to behavior observed in 2.1, and pointers to `frontend/openspec/config.yaml` and the root guide. Verify: `grep -n '^## ' frontend/CLAUDE.md` shows those sections.
- [x] 2.3 Check each version, script, path and flag in the frontend guide against the extracted files, and check that nothing contradicts the code. Verify: `grep -n -i 'tailwind\|msw\|playwright\|zod\|dompurify\|services/api' frontend/CLAUDE.md` returns nothing.

## 3. Align config.yaml (done during planning at the user's request)

- [x] 3.1 Update `frontend/openspec/config.yaml`: stack, `src/modules` architecture, test tooling, design/tasks rules, apply/archive guidance per design.md Decision 5. Verify: grep for `tailwind|msw|playwright|zod|dompurify|biome|services/api|MathJax|graphing` returns nothing, PyYAML parses the file, and `openspec context --json` run in `frontend/` still resolves the root.
- [x] 3.2 Update root `openspec/config.yaml`: header comment names the root `CLAUDE.md`; apply guidance reads the root `CLAUDE.md` plus each touched component's. Verify: `git diff openspec/config.yaml` shows only those two edits, and PyYAML parses the file.

## 4. Integration checks

- [x] 4.1 Resolve every repo-relative path and link in both guides. Verify: a path-existence check passes for files on this branch, and `git cat-file -e 66535660:frontend/<path>` passes for each `frontend/src/...` or `frontend/*.json` path that exists only on `feature/adding-chat-page`.
- [x] 4.2 Cross-check the two edited configs against the finished guides. Verify: the stack list, the `src/` folder list, the architecture sentence and the script names (`pnpm run lint`, `test`, `build`) in `frontend/openspec/config.yaml` appear in `frontend/CLAUDE.md`, and the root config comment matches the root guide's contents; any mismatch is fixed in whichever file is wrong.
- [x] 4.3 Confirm only documentation and OpenSpec config changed (replaces the root smoke-check rule, see design.md Decision 1). Verify: `git status --short` lists only `CLAUDE.md`, `frontend/CLAUDE.md`, `openspec/config.yaml`, `frontend/openspec/config.yaml` and files under `openspec/changes/add-root-and-frontend-claude-md/`; `docker-compose*.yml`, `Dockerfile`, `railway.json`, `.env.example`, `README.md` and `backend/openspec/config.yaml` are unchanged.
- [x] 4.4 Validate the change. Verify: `openspec validate add-root-and-frontend-claude-md` passes.

## Workflow follow-up

- Archive the change after review.
- Merge `feature/adding-chat-page` so `frontend/CLAUDE.md` and the frontend code live on the same branch.
- Correct the "backend/frontend are empty" text in `README.md`.
- Commit `docs/Anteproyecto Trabajo de Grado.pdf` deliberately (it is untracked) after checking it holds no personal data.
- Rename `docs/desing/` to `docs/design/` if the spelling is a typo (the guide names the folder as it is today).
- Decide whether to add the remaining academic documents (SRS, survey, interviews, Figma export) under `docs/` or relax the "cite by path and section" rules in the three configs.
