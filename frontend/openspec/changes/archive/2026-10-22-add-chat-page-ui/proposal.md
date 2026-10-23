# Proposal

## Why

The frontend only renders a "Hello, World!" shell. The product is a math assistant chat, so the first real screen is the chat page. A working reference exists (`GambMoli/ProyectoDeGrado`, `frontend/src/pages/ChatPage`); this change brings over its UI/UX design only, without any backend, auth or data hooks, so the screen can be built and reviewed on its own before anything is connected.

## What Changes

- Add the chat page as a feature module made of four parts: status banner, a paper container, the messages area, and the composer.
- Messages area: loading text, empty-conversation welcome, user and assistant bubbles, and the step-by-step resolution card for solved exercises, with math rendered as formulas.
- Composer: multiline input, send button, "Insertar fórmula" panel with snippet cards, and a live math preview of what is being typed.
- Add the visual foundation the page needs: MUI with a light/dark theme (palette, typography, component overrides) and global fonts/styles.
- Replace the Hello World root page with the chat page. It is driven by local state and static example data; no API calls.
- Update the `app-shell` capability: its root-page requirement changes from a Hello World greeting to the chat page.
- Add dependencies: `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `katex`, `@types/katex`.
- Port in Spanish, with the missing accents from the reference restored ("Resolución", "Expresión").

**Out of scope (separate later changes):** `AttachExerciseModal` and the composer's attach button, file chip and OCR state; `HistoryDrawer`; the top bar layout (`MainLayout`); routing; API client, `useChatPage` and auth.

## Capabilities

### New Capabilities
- `chat-page`: Page layout and screen states (error banner, loading, empty, populated), paper container and automatic scroll to the latest message.
- `chat-messages`: How user and assistant messages are presented, including the resolution card and math rendering.
- `chat-composer`: Message input, sending, formula insertion panel and live math preview.
- `app-theme`: Light and dark visual theme for the application, following the system preference.

### Modified Capabilities
- `app-shell`: the root-page requirement changes from rendering a Hello World greeting to rendering the chat page (renamed to "Root page renders the chat page").

## Impact

- Affected paths: `frontend/src/modules/chat/` (new), `frontend/src/components/` (StatusBanner, math rendering, theme provider), `frontend/src/icon/` (bot and user avatars), `frontend/src/utils/` (theme, math helpers), `frontend/src/App.tsx`, `frontend/src/main.tsx`, `frontend/src/index.css`, `frontend/package.json`, `frontend/pnpm-lock.yaml`.
- New runtime dependencies listed above; MUI is a large dependency and increases bundle size.
- Spec change: the main spec `app-shell` says the root page renders a Hello World greeting. After this change the root page is the chat page, so `specs/app-shell/spec.md` renames and modifies that requirement.
- No backend, deployment or API impact.
