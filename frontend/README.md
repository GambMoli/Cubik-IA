# Cubik IA frontend

React 19 + TypeScript + Vite. Package manager: pnpm. Node.js 24.22.1 or newer in the 24.x line (see `.nvmrc`): earlier versions are affected by the October 2026 Node.js security release (CVE-2026-111497 and others).

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
| `src/modules/chat/components/CalculatorKeyboard/` | The "Abrir Calculadora" keyboard (GeoGebra-style tabs `123`, `f(x)`, `ABC`, `#&¬`): `layouts.ts` has every key as data, `keyboardState.ts` the shift/accent/Greek state and the edit commands |
| `src/components/` | Shared UI: `AppThemeProvider` (light/dark from the system), `StatusBanner`, `MathContent`/`MathFormula` (KaTeX) |
| `src/utils/` | `theme.ts` (palettes and MUI theme), `math.ts` (plain-text math to LaTeX), `text.ts` (insert, delete and move the cursor in a text) |

The calculator keys write plain text into the message input (`sqrt()`, `^2`, `∫  dx`, `arcsen()`); nothing is calculated in the browser, the assistant solves the exercise. `utils/math.ts` turns that text into LaTeX for the live preview.
| `src/icon/` | Avatar icons |

The chat page is presentational: it gets `messages`, `isLoading`, `error`, `isSubmitting` and `onSubmit` as props and makes no API calls.
`src/App.tsx` seeds it with the example messages in `src/modules/chat/fixtures.ts` and appends the user's message on send. The fixtures are temporary: remove them, and this wiring, when the chat is connected to the backend.

## Specs

Behavior is specified with OpenSpec in `openspec/` (`specs/` for current requirements, `changes/` for work in progress).
