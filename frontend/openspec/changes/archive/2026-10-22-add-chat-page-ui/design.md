# Design

## Context

Reference: `GambMoli/ProyectoDeGrado`, `frontend/src/pages/ChatPage` (React 18, MUI 5, KaTeX, `react-router`). Only its UI is ported; see proposal.md - Why and What Changes.

Current frontend: React 19, Vite 8, TypeScript 6 with `verbatimModuleSyntax` and `erasableSyntaxOnly` (type-only imports must use `import type`, no enums), ESLint flat config with `eslint-plugin-react-hooks` v7. `src` has the standard folders from `src-layout` (empty), `App.tsx` ("Hello, World!") and the Vite template `index.css`. No router, no test runner, no UI library.

Observed differences from the reference that affect the port:
- MUI at install time is v9 (reference used v5). Props the reference relies on (`Grid item xs`, `PaperProps`, `InputProps`, `primaryTypographyProps`) are from the v5 API and must be re-checked against v9 (`Grid` sizing, `slotProps`).
- `Composer.isRenderingMode` is never set to `true` in the reference, so its read-only "rendered" mode and edit icon are dead code.
- `MathContent` also exports `latexToReadable`, which the chat UI does not use.

## Goals / Non-Goals

**Goals:**
- Same look and interaction as the reference for the four parts in scope, in both palettes.
- Page is a pure UI: data in through props, events out through callbacks, so a later change can connect it without rewriting components.
- Behavior from `specs/` is covered by automated tests.

**Non-Goals:**
- `AttachExerciseModal`, `HistoryDrawer`, `MainLayout`, routing, API client, auth, theme toggle button, persisted theme choice.
- Backend-shaped types (status enums, OCR fields); the UI uses a trimmed model.
- Self-hosted fonts, code splitting, i18n.

## Decisions

**File layout** (follows `src-layout`; `hooks/`, `routes/`, `layouts/` stay untouched):

```
src/
  main.tsx                    mounts AppThemeProvider > App, imports katex css
  App.tsx                     owns local message state, renders ChatPage
  index.css                   fonts, resets, scrollbars (replaces Vite template CSS)
  components/
    AppThemeProvider/         ThemeProvider + CssBaseline, follows system scheme
    StatusBanner/             error/info alert
    MathContent/              MathContent, MathFormula (KaTeX rendering)
  icon/                       BotAvatarIcon, UserAvatarIcon
  utils/
    theme.ts                  palettes + createAppTheme
    math.ts                   plain-text math -> LaTeX, preview candidate, heuristics
  modules/chat/
    ChatPage.tsx
    components/               ChatMessage, ResolutionCard, Composer, EmptyConversationState
    fixtures.ts               static example messages (temporary)
    types.ts                  Message, Exercise, Resolution (UI subset)
    index.ts
```

`StatusBanner`, the math components and the theme provider go in `components/` although only chat uses them today: they contain no chat knowledge and the reference already reuses them on other pages. This is a deliberate exception to "start inside the module" from the `src-layout` change. `ResolutionCard` is extracted from `ChatMessage` (it was ~80 inline lines) but stays in the module because only messages use it.

**Page is presentational.** `ChatPage` props: `messages`, `isLoading` (default false), `error` (default null), `isSubmitting` (default false), `onSubmit(text)`. `App.tsx` holds `useState` for messages, seeded from `fixtures.ts` so every message variant (plain, with resolution, with exercise error) can be reviewed, and appends the user message on submit. No custom hook is created. Alternative: copy `useChatPage` with a fake API - rejected, it reintroduces the connection logic that is out of scope. Loading and error states are reachable through props and are covered by tests.

**Trimmed UI model.** `Message { id, role: "user" | "assistant" | "system", content, exercise? }`, `Exercise { extracted_expression?, error_message?, resolution? }`, `Resolution { steps, final_result, explanation }`. Field names keep the reference's snake_case so the later API change can pass backend data through with little mapping.

**Math rendering with KaTeX.** `MathFormula` calls `katex.renderToString` with `throwOnError: false` and `strict: "ignore"` and injects the HTML; `trust` stays at its default (off), so macros that can emit links or raw HTML stay disabled. Malformed input renders as KaTeX's inline error text instead of throwing (spec: invalid math does not break the message). Pure string helpers (`plainMathToLatex`, `extractMathCandidateForPreview`, the "is this paragraph a standalone formula or prose" heuristics) move to `utils/math.ts` so they are unit-testable without React. Two reference behaviors are corrected there because they contradicted the specs: single-letter variables no longer count as prose words (so `x^2 + 3x = 10` is a formula), and converted symbols no longer get a doubled backslash (`2π`) or re-escaped LaTeX commands (`\sin x`). `latexToReadable` is not ported. Alternatives: `react-katex` (extra, poorly maintained wrapper), MathJax (much heavier).

**Theme.** Port `scholarPalette` values and `createAppTheme`, trimmed to overrides for components that exist in this change: `CssBaseline`, `Paper` (1px border, palette shadow, no background image), `Button`, `Alert`, `Tooltip`. Overrides for Tabs, Card, AppBar, Drawer, Chip, OutlinedInput and the `background.alt` augmentation are left out until something uses them. Mode comes from `matchMedia("(prefers-color-scheme: dark)")` with a change listener; no context, no toggle, no `localStorage`. Alternative: port `ThemeContext` with `toggleMode` - rejected, nothing in scope can call it.

**Fonts.** `@import` of Inter, Manrope and JetBrains Mono from Google Fonts at the top of `index.css`, as in the reference, with system fallbacks in the theme. Self-hosting (`@fontsource-*`) is deferred.

**Composer changes versus the reference.** Removed: attach button, file chip, OCR loading, `pendingText`, `openFormulaPanelTrigger` (it came from router state), rendered/edit mode, and the hardcoded "Sistema disponible" label (no data behind it). Added: Enter is ignored while an input-method composition is active (`isComposing`), so confirming an accent does not send the message. Formula insertion uses the textarea selection and then restores focus and cursor; this is done in the click handler instead of `setTimeout` chains where possible.

**Auto-scroll.** Same behavior as the reference (instant on first display, smooth when the last message id changes) using one effect and an end-of-list sentinel; the unused `messagesContainerRef` is dropped.

**Accessibility additions.** Send button gets `aria-label="Enviar mensaje"`, the input gets an accessible name, and the messages area is `role="log"` with polite live updates. These are also what the tests query by.

**Tests.** Add Vitest with jsdom and Testing Library (`test` script). Unit tests for `utils/math.ts`; component tests for `Composer` (send, trim, Enter/Shift+Enter, IME, snippet insertion, preview), `ChatMessage`/`ResolutionCard` (alignment, 180-character rule, error text, missing expression) and `ChatPage` (loading, error, empty, scroll call). Visual fidelity (spacing, colors) is checked by eye in the dev server, once per palette.

**Copy.** Spanish as in the reference, with accents restored where it dropped them ("Resolución", "Expresión").

## Risks / Trade-offs

- [MUI v9 API differs from the reference's v5 code] → Port against v9 types; `tsc -b` fails on removed props. Use `slotProps` and the current `Grid` API from the start rather than copying deprecated props.
- [`eslint-plugin-react-hooks` v7 flags patterns such as setting state inside effects] → Rewrite the logic (derive state, handle in event handlers); do not disable rules.
- [Bundle size grows with MUI, Emotion and KaTeX] → Import icons from `@mui/icons-material/<Name>`, never the barrel; measure with `pnpm run build`; revisit code splitting when more screens exist.
- [Regex heuristics decide "formula or prose"] → Mis-classification is possible; tests pin the behavior from the specs and edge cases are fixed there.
- [Example data ships in `App.tsx`] → Isolated in `fixtures.ts` and imported only by `App.tsx`; the connection change removes both.
- [Google Fonts needs the network and sends a request to a third party] → System font fallback keeps the layout working; self-hosting is a later option.
- [Vitest and Testing Library compatibility with Vite 8 / React 19 / local Node] → Checked at install: Vitest 5 and jsdom 30 need Node 22+ but the project runs on Node 20.20, so Vitest 4 and jsdom 29 are used. Revisit when Node is upgraded.
- [The `app-shell` root-page requirement would become false] → Covered by this change's RENAMED and MODIFIED delta in `specs/app-shell/spec.md`; archiving syncs it into the main spec.
