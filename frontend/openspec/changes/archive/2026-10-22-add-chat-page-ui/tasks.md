# Tasks

## 1. Dependencies and global styles

- [x] 1.1 Add `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `katex` (and `@types/katex` if `katex` ships no types) with `pnpm add`, and verify `package.json` lists them and `pnpm run build` still passes
- [x] 1.2 Add Vitest, jsdom and Testing Library as dev dependencies, a `test` script and a setup file, document `pnpm run test` in `README.md`, and verify a smoke test passes with `pnpm run test`
- [x] 1.3 Replace the Vite template `src/index.css` with the font `@import` (Inter, Manrope, JetBrains Mono), box-sizing and zero-margin resets, thin scrollbars and KaTeX display tweaks, and verify in the dev server that no template styles remain and `pnpm run build` passes

## 2. Theme

- [x] 2.1 Create `src/utils/theme.ts` with the light and dark palettes, typography and the `CssBaseline`, `Paper`, `Button`, `Alert` and `Tooltip` overrides, and verify a unit test shows light and dark themes expose the expected primary, background and divider colors and that dark `Paper` has no shadow
- [x] 2.2 Create `src/components/AppThemeProvider` that picks the palette from `prefers-color-scheme` and updates when it changes, and verify tests cover dark at load, light at load and a live change using a mocked `matchMedia`
- [x] 2.3 Wire `AppThemeProvider` and `katex/dist/katex.min.css` into `src/main.tsx` and verify the dev server loads without console errors and the page background is the themed color

## 3. Shared UI pieces

- [x] 3.1 Create `src/icon/BotAvatarIcon.tsx` and `src/icon/UserAvatarIcon.tsx` and verify a render test finds an `aria-hidden` SVG for each
- [x] 3.2 Create `src/components/StatusBanner` (info and error tones) and verify a test renders the message in an alert for both tones
- [x] 3.3 Create `src/utils/math.ts` (plain-text math to LaTeX, preview candidate extraction, formula-or-prose heuristics) and verify unit tests cover `x^2 + 3x = 10`, `∫ x^2 dx`, `d/dx (x^3 + 2x)`, `lim x->0 sin(x)/x`, a narrative sentence and input with no math
- [x] 3.4 Create `src/components/MathContent` (`MathContent`, `MathFormula`) and verify tests cover a `\[ \]` block, an inline `\( \)` formula, a plain math paragraph, a prose sentence and a malformed formula that does not throw

## 4. Chat messages

- [x] 4.1 Create `src/modules/chat/types.ts` (Message, Exercise, Resolution) and `src/modules/chat/fixtures.ts` with a user message, a plain assistant message, one with a resolution and one with an exercise error, and verify `pnpm run build` type-checks them
- [x] 4.2 Create `EmptyConversationState` with the Cubik IA welcome text and verify a test finds the welcome message with the assistant avatar
- [x] 4.3 Create `ResolutionCard` ("Resolución paso a paso", ordered steps, "Expresión interpretada", "Resultado", explanation, error text) and verify tests cover step order, a missing interpreted expression and the error message
- [x] 4.4 Create `ChatMessage` (avatar, alignment, bubble colors, 78% max width on desktop, system as assistant, 180-character rule) and verify tests cover user versus assistant alignment, system role, text of 179 versus 180 characters with a resolution, and that long text with a resolution shows only the card

## 5. Composer

- [x] 5.1 Create `Composer` input and sending (placeholder, up to six rows, send button, Enter, Shift+Enter, IME composition guard, blank input blocked, disabled state, reset after send, `aria-label`s) and verify tests cover each scenario in `specs/chat-composer/spec.md` under input, sending, blank, reset and disabled
- [x] 5.2 Add the "Insertar fórmula" toggle, the six-snippet panel with typeset previews, the usage hint and snippet insertion at the cursor, and verify tests cover open and close, the hint, insertion into empty text, after text with a single space, and over a selection
- [x] 5.3 Add the "Vista previa matemática" block (single expression, several math lines, block delimiters, hidden when no math) and verify tests cover those four cases

## 6. Page and integration

- [x] 6.1 Create `ChatPage` (padded page, bordered container, scrolling messages area, composer pinned below, error banner, loading text, welcome state, auto-scroll) and verify tests cover loading, error shown and hidden, empty and populated states, and that appending a message triggers a scroll to the end
- [x] 6.2 Replace the Hello World content of `src/App.tsx` with `ChatPage` driven by local state seeded from the fixtures that appends the user message on submit, document the module layout and the temporary fixtures in `README.md`, and verify in the dev server that typing, sending and the formula panel work with no network requests to a backend
- [x] 6.3 Verify the whole change: `pnpm run build`, `pnpm run lint` and `pnpm run test` pass, and the page checked in the dev server at about 390px and at 1280px or wider in light and dark palettes matches the layout, spacing, color and font scenarios in `specs/chat-page`, `specs/chat-messages` and `specs/app-theme`, and that the root page shows the chat page as described in `specs/app-shell`

## Workflow follow-up

- Archive this change after review; archiving syncs the four new capabilities and the `app-shell` rename and modification into the main specs.
- Next changes: `AttachExerciseModal` (with the composer attach button, file chip and OCR state) and `HistoryDrawer`.
