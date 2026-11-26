# Frontend — operating guide

React + TypeScript UI for Cubik-IA, embedded in Aula Extendida (Moodle 4.5) through an LTI 1.3
iframe. OpenSpec rules: `frontend/openspec/config.yaml` (plus the cross-cutting root
`openspec/config.yaml`). Root guide: `CLAUDE.md`. No feature code outside an approved OpenSpec change.

## Stack
- React 19, TypeScript ~6.0, Vite 8. Dependencies are locked in `pnpm-lock.yaml`.
- TypeScript is strict through the TypeScript 6 default (`tsconfig.app.json` sets no explicit `strict`).
  Explicit flags: `verbatimModuleSyntax` (type-only imports use `import type`), `erasableSyntaxOnly` (no enums),
  `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.
- **MUI 9 + Emotion** (`@mui/material`, `@mui/icons-material`); theme in `src/utils/theme.ts`.
- **KaTeX** for math rendering.
- ESLint 10 flat config (typescript-eslint, react-hooks, react-refresh).
- Vitest 4 + jsdom + Testing Library (react, jest-dom, user-event).
- pnpm. Node.js 24.22.1 or newer in the 24.x line (`.nvmrc`, `engines`).

## Source layout
| Folder | Holds |
|---|---|
| `src/modules/<feature>/` | Feature code grouped by feature: page, local components, local logic, `index.ts` barrel (today `modules/chat`) |
| `src/components/` | UI used by more than one module (`AppThemeProvider`, `StatusBanner`, `MathContent`/`MathFormula`) |
| `src/hooks/` | Reusable custom hooks |
| `src/utils/` | Framework-independent helpers: `theme.ts`, `math.ts` (plain-text math to LaTeX), `text.ts` (cursor edits) |
| `src/icon/` | Icon components (bot and user avatars) |
| `src/layouts/` | Page shells shared by several pages |
| `src/routes/` | Route definitions |
| `src/assets/` | Static media (images, fonts) |

Empty folders keep a `.gitkeep`. `src/main.tsx` mounts `AppThemeProvider > App` and imports the KaTeX CSS.

## Commands
Run scripts with `pnpm run <script>`: the shorthand `pnpm build` / `pnpm lint` does not run the project
scripts with pnpm 12.

| Script | Purpose |
|---|---|
| `dev` | Vite dev server |
| `build` | `tsc -b && vite build`: type-check, then production build to `dist/` |
| `lint` | `eslint .` |
| `test` | `vitest run` (single run) |
| `test:watch` | Vitest in watch mode |
| `preview` | Serve the production build |

## Testing
- Test first: failing test, minimum implementation, refactor.
- Vitest with jsdom. `src/setupTests.ts` loads the jest-dom matchers and runs `cleanup` after each test.
- Tests sit next to the code as `*.test.ts(x)`.
- Render MUI components with `renderWithTheme` from `src/testUtils.tsx`; its `rerender` keeps the theme wrapper.
- `testTimeout` is 15000 ms in `vite.config.ts` because MUI renders slowly in jsdom.

## Conventions
- Pages are presentational: data comes in through props, events go out through callbacks, and components make no API calls.
  `ChatPage` takes `messages`, `isLoading`, `error`, `isSubmitting`, `onSubmit`. `App.tsx` seeds it from
  `modules/chat/fixtures.ts`, which is temporary: remove it, and that wiring, when the chat connects to the backend.
- UI model types live in `modules/chat/types.ts` (`Message`, `Exercise`, `Resolution`). Field names stay snake_case
  (`final_result`) so backend data can pass through with little mapping.
- Math: `MathContent` splits text from formulas, `MathFormula` renders with KaTeX, `utils/math.ts` converts plain-text
  math to LaTeX. Calculator keys only write text into the input; nothing is calculated in the browser.
- Theme follows the system light/dark preference through `AppThemeProvider`; there is no toggle and no persisted choice.

## Security
- `MathFormula` renders `katex.renderToString` output with `dangerouslySetInnerHTML`, with `throwOnError: false`,
  `strict: 'ignore'` and `trust` left off so macros cannot emit links or raw HTML. Keep `trust` off and do not
  inject any other HTML this way. Malformed LaTeX shows as KaTeX error text instead of throwing.
- No API client, authentication or token handling exists yet. When one is added, the design must cover the risks
  listed in `frontend/openspec/config.yaml`. Never hardcode production URLs or secrets.

Update this guide when a change adds UI conventions, libraries or scripts.
