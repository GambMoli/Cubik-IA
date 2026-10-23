# Cubik IA frontend

React 19 + TypeScript + Vite. Package manager: pnpm.

## Scripts

Run scripts with `pnpm run <script>`. The shorthand `pnpm build` / `pnpm lint` does not run the project scripts with pnpm 12.

| Script | What it does |
|---|---|
| `pnpm run dev` | Vite dev server |
| `pnpm run build` | Type-check (`tsc -b`) and production build to `dist/` |
| `pnpm run lint` | ESLint |
| `pnpm run test` | Vitest (jsdom + Testing Library), single run |
| `pnpm run test:watch` | Vitest in watch mode |
| `pnpm run preview` | Serve the production build |

Tests live next to the code as `*.test.ts(x)`; shared setup is in `src/setupTests.ts`.

## Source layout

| Path | Contents |
|---|---|
| `src/modules/chat/` | Chat page UI: `ChatPage`, `ChatMessage`, `ResolutionCard`, `Composer`, `EmptyConversationState` |
| `src/components/` | Shared UI: `AppThemeProvider` (light/dark from the system), `StatusBanner`, `MathContent`/`MathFormula` (KaTeX) |
| `src/utils/` | `theme.ts` (palettes and MUI theme), `math.ts` (plain-text math to LaTeX), `text.ts` |
| `src/icon/` | Avatar icons |

The chat page is presentational: it gets `messages`, `isLoading`, `error`, `isSubmitting` and `onSubmit` as props and makes no API calls.
`src/App.tsx` seeds it with the example messages in `src/modules/chat/fixtures.ts` and appends the user's message on send. The fixtures are temporary: remove them, and this wiring, when the chat is connected to the backend.

## Specs

Behavior is specified with OpenSpec in `openspec/` (`specs/` for current requirements, `changes/` for work in progress).
