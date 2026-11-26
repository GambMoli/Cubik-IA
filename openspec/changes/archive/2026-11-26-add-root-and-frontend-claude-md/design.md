# Design

## Context

See proposal.md - Why. Observed state:

- `backend/CLAUDE.md` exists (~75 lines: Stack, Architecture, Contract, Testing, Security & data protection, Commands). It is the template for tone and structure. `backend/openspec/config.yaml` already agrees with it.
- Root `CLAUDE.md` and `frontend/CLAUDE.md` do not exist. Both `config.yaml` files already link to them.
- The working tree of this branch (`feat/adding-base-config.yaml`) has **no frontend code**: `frontend/` holds `.claude/`, `openspec/`, `.gitkeep` and ignored leftovers (`dist/`, `node_modules/`).
- The real frontend lives on unmerged branch `feature/adding-chat-page` (tip `66535660`): `package.json`, `pnpm-lock.yaml`, `.nvmrc`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `src/`, and archived frontend OpenSpec changes plus specs (`src-layout`, `app-theme`, `chat-*`, `calculator-keyboard`, `app-shell`). The `frontend/openspec/config.yaml` on that branch is the untouched OpenSpec placeholder, so the stack and structure source is the code and its specs, not a config.
- Before this change, `frontend/openspec/config.yaml` described a different stack than that scaffold (see Decision 5).
- `docs/` contains `deploy-oracle.md`, `deploy-railway.md` and, added by the user during apply and still untracked, `Anteproyecto Trabajo de Grado.pdf`. Empty folders `desing/`, `interviews/` and `polls/` also exist locally (git does not track them). No other academic document (SRS, survey, interviews, Figma export) has a file on any branch or in history. `README.md` still says backend/frontend are empty.

## Goals / Non-Goals

**Goals:**
- Two guides an agent can rely on without re-deriving conventions, each fact traceable to a file or commit.
- Same shape as `backend/CLAUDE.md` so the three guides read as one set.
- Guides and `config.yaml` files tell the same story about stack, layout and scripts.
- Short enough to be read at the start of every apply (target: root <= ~90 lines, frontend <= ~90 lines).

**Non-Goals:**
- Editing `README.md`, `backend/openspec/config.yaml`, code, compose, Dockerfile or `.env.example`.
- Rewriting config rules that the real scaffold does not contradict (Decision 5).
- Duplicating `config.yaml` rules in the guides (proposal/spec/design/task rules stay in the configs; guides link to them).
- Planned or aspirational content for the frontend guide (Decision 2). The root guide may say what is not yet in the repo, but invents no targets.

## Decisions

### 1. One root-level change for both files
Chosen by the user. The root config says to split component work into component-level changes; this change is documentation and config only, touches no behavior, and the files are reviewed together.
- Alternative: a root change plus a `frontend/openspec` change. Rejected: more ceremony for small files, and `frontend/openspec` has no active change scaffolding to reuse.
- Consequence: the root tasks rule "final task is an end-to-end docker compose smoke check" is not applied. No service, compose file, Dockerfile or env var changes, so the final integration task instead proves only documentation and OpenSpec config changed.

### 2. `frontend/CLAUDE.md` documents the real scaffold only
Chosen by the user. Source of truth is commit `66535660`: React 19, Vite 8, TypeScript ~6.0, MUI 9 + Emotion, KaTeX, Vitest 4 + Testing Library + jsdom, ESLint 10, pnpm, Node 24.22.1 (`.nvmrc`, `engines`), scripts `dev`/`build`/`lint`/`test`/`test:watch`/`preview`, `src/{assets,components,hooks,icon,layouts,modules,routes,utils}` per the `src-layout` spec, test files beside code, `src/setupTests.ts`, `renderWithTheme`, presentational chat page fed by fixtures. Math is rendered with `katex.renderToString` (`throwOnError: false`, `strict: "ignore"`, `trust` off) per the archived `add-chat-page-ui` design; re-verified in the code at apply time.
- Alternative: hybrid (real now, config extras as "Planned"). Rejected by the user.
- Alternative: config stack only (Tailwind, feature-sliced, MSW/Playwright, Zod, DOMPurify). Rejected: it contradicted code that exists.
- TypeScript strict: verified during planning. Compiling a file with an implicit `any` and `null` assigned to `string` against `tsconfig.app.json` of `66535660` with TypeScript 6.0.3 fails with TS7006 and TS2322 without an explicit `strict`, the same as with `"strict": true`. So strict is effective through the TypeScript 6 default. The guide may say "strict" and notes it is implicit; it also lists the explicit flags (`noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `noFallthroughCasesInSwitch`).
- Consequence: the guide omits Tailwind, MSW, Playwright, Zod, DOMPurify and the `ui -> hooks -> services/api -> types` layering; `frontend/openspec/config.yaml` is aligned accordingly (Decision 5).

### 3. Root guide holds only cross-cutting facts and pointers
Sections, each with its source:

| Section | Source |
|---|---|
| Purpose + constraints (guided tutor, never a homework solver; Ley 1581; OpenAPI as contract) | `openspec/config.yaml` context |
| Monorepo map and responsibilities | `README.md` structure table, `git ls-files`, `docker-compose.yml` |
| Component guides and OpenSpec roots (root vs component; `/opsx:*` commands in `.claude/commands/opsx`) | the three `config.yaml` files, `.claude/` |
| OpenSpec flow: explore -> propose -> apply -> archive, no feature code outside an approved change | `openspec/config.yaml` |
| Moodle boundary: `moodle/` unmodified; config via `docker/moodle/config.php` + env; LTI 1.3 / Web Services only, no direct DB access | `README.md`, `openspec/config.yaml` |
| Local commands (`docker compose up -d`, `logs -f moodle`, `ps`, `down`, `down -v` warning, cron, `.env` from `.env.example`, `MOODLE_WWWROOT` must match port) | `README.md`, `docker-compose.yml`, `.env.example` |
| Deployment pointers (prod compose + Caddy, Railway `Dockerfile` + `railway.json`, `/healthz`) | `docker-compose.prod.yml`, `docs/deploy-*.md` |
| Secrets and env: environment variables only, `.env` ignored, `MOODLE_DEBUG=false` outside dev | `.gitignore`, `.env.example`, `README.md` |
| Repo conventions: LF forced for `*.sh` and `docker/**` | `.gitattributes` |

Rule: commands and flags are copied from the sources and re-checked at apply time; nothing is inferred.
- Alternative: summarize `README.md` wholesale. Rejected: it is Moodle-run documentation and partly stale (says backend/frontend are empty).
- The root guide cites the Anteproyecto by its real path (`docs/Anteproyecto Trabajo de Grado.pdf`) and states that the other academic documents cited by the configs (SRS, survey, interviews, Figma export) have no files yet, naming the empty `desing/`, `interviews/` and `polls/` folders, rather than citing paths that do not exist.

### 4. Guides link to rules instead of copying them
Each guide names its `config.yaml` and the sibling guides. Artifact rules (proposal/spec/design/tasks, apply/archive guidance) are not repeated, so there is one place to edit them.

### 5. Align both config files with the guides: change what code contradicts, keep the rest
Applied during planning at the user's request. The user asked to align `config.yaml` with the guides and with the structure on the other branches; the only branch with real structure is `feature/adding-chat-page`.

Changed in `frontend/openspec/config.yaml`:
- Context stack: Tailwind/CSS, KaTeX/MathJax and graphing libraries became MUI + Emotion, KaTeX, pnpm. "TypeScript strict mode" stays (verified, Decision 2).
- Context architecture: feature-sliced `ui -> hooks -> services/api -> types` became `src/modules/<feature>`, `src/components`, and the other `src/` folders, with presentational pages and no API calls in components.
- Context testing: Playwright/MSW became Vitest + Testing Library + jsdom.
- Design rules: layer mapping now names `src/` folders; Zod schemas became TypeScript types kept in sync with the OpenAPI document; the math bullet names KaTeX options; sanitization examples no longer name DOMPurify; MSW became fixtures or test doubles.
- Tasks rules: Zod removed; final verification now `pnpm run lint`, `pnpm run test`, `pnpm run build` (replacing eslint/biome, `tsc --noEmit`, `vitest run`, `vite build`, which `build` already covers via `tsc -b && vite build`).
- Apply and archive guidance: fixtures instead of MSW; run scripts with `pnpm run`; archive checks name the same three scripts.
- Header comment: "npm/pnpm" became "pnpm".

Changed in root `openspec/config.yaml`: the header comment names the root `CLAUDE.md` and what it holds; apply guidance reads the root `CLAUDE.md` as well as each touched component's.

Kept on purpose:
- Rules citing `../docs/` and survey items: the documents never existed on any branch, so those rules cannot be satisfied yet. Not a contradiction the scaffold causes; flagged, not edited.
- Role/exam-mode, loading/streaming/error states (401/403/429/503), accessibility, the frontend security risk list and "UI components never call fetch/axios directly": forward-looking and compatible with the scaffold.
- Root tasks rule on a docker compose smoke check: no backend or frontend service exists in compose yet.
- `backend/openspec/config.yaml`: already consistent with `backend/CLAUDE.md`; not requested.

Alternatives:
- Leave configs as is and file a follow-up change (the earlier plan). Rejected: the user asked for the alignment now, and the contradiction would remain.
- Rewrite the frontend config to describe only the scaffold, dropping forward-looking rules. Rejected: it loses constraints the code does not contradict.
- Hybrid with a "Planned" section in the config. Rejected for the same reason the user rejected it for the guide.

## Rule applicability (root `config.yaml` design rules)
- Mermaid sequence diagram Moodle -> frontend -> backend -> LLM/CAS: not applicable. No runtime interaction is introduced.
- OpenAPI contract changes: none.
- Infra impact: none (no compose, Dockerfile, deployment or env var change). Secrets guidance in the root guide restates the existing environment-variables-only rule.

## Risks / Trade-offs

- [Frontend guide and frontend config name scripts, folders and libraries that exist only on `feature/adding-chat-page` until it merges] -> Verify every fact with `git show 66535660:frontend/<path>`; recommend merging that branch before or with this one; expect a doc/code mismatch only in the interim.
- [Config rules that cite the SRS, survey items and interviews stay unsatisfiable; the Anteproyecto PDF is untracked, so a fresh clone lacks it until it is committed] -> Left unchanged and flagged in the summary and in the workflow follow-up.
- [Guides go stale as the stack evolves] -> Frontend config archive guidance already says to update `frontend/CLAUDE.md` when conventions, libraries or scripts change; the root guide links instead of duplicating, which limits drift.
- [Copied command or version is wrong] -> Tasks include a per-claim verification pass against the source file or commit, and a config-versus-guide cross-check.
- [`frontend/.gitignore` on the chat-page branch ignores `.claude`, which this branch tracks under `frontend/`] -> Not touched here; mention at merge time.

## Open Questions

- Whether to add the remaining academic documents (SRS, survey, interviews, Figma export) under `docs/` or relax the "cite by path and section" rules in the three configs. Can be answered later: it changes neither the guides' content nor these tasks.
