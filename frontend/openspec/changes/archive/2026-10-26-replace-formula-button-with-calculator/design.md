# Design

## Context

See proposal.md for motivation and `specs/` for the behavior. Constraints that shape the approach:

- The composer input is a MUI multiline `TextField` (a plain `textarea`) and `Composer` owns the message string. The message that reaches `onSubmit` is plain text such as `∫ x^2 dx` or `sqrt(x^2 + 1)`; that contract does not change.
- The live preview turns that plain text into LaTeX with `plainMathToLatex` (`utils/math.ts`). It recognizes `sin`, `sen`, `cos`, `tan`, `ln`, `log`, `sqrt(...)` and `exp(...)` (without nested parentheses), a few Greek letters and symbols, and the integral, derivative and limit patterns. Most of what the new keys write is not recognized yet.
- `Composer.tsx` holds a hardcoded `formulaSnippets` array, a panel `Paper` with `maxHeight` 45vh (50vh from `md`) and `insertAtSelection` from `utils/text.ts`, which adds a space before the inserted text. Calculator keys must not add spaces (`2` then `x` gives `2x`).
- `src-layout`: feature code starts inside `modules/chat`; pure helpers go in `utils`.
- ESLint `react-hooks` v7 rejects state set inside effects; TypeScript has `verbatimModuleSyntax` and `erasableSyntaxOnly` (no enums, `import type`).

## Goals / Non-Goals

**Goals:**
- The four tabs and the keys of the five GeoGebra screens, reproduced as data so each layout can be read and tested against the spec.
- Key press logic that is pure and unit-testable without React; the component only renders and dispatches.
- The preview renders every notation the keys can write, or leaves it as readable plain text.

**Non-Goals:**
- Evaluating anything, an `ans` memory, a `...` menu, a WYSIWYG math field or navigable template boxes.
- Fixing how the preview treats a line that mixes words and math (`Resuelve x^2 + 3x = 10` is converted as one whole expression, as before).
- New dependencies, a toggle for always-on keyboard, or persisting the selected tab.

## Decisions

**Folder and files.**

```
src/modules/chat/components/
  Composer.tsx                    button "Abrir Calculadora", panel, owns message + selection
  CalculatorKeyboard/
    CalculatorKeyboard.tsx        tabs, key grid, shift/accent/layout state
    layouts.ts                    the keys of each tab as data (label, name, action)
    index.ts
src/utils/
  text.ts                         insertText, deleteBackward, moveCursor (replace insertAtSelection)
  math.ts                         extended conversion for the notation the keys write
```

The keyboard lives in the chat module, not in `components/`: only the composer uses it and it writes the notation the chat's assistant reads. It moves to `components/` when a second module needs it.

**Keys are data, the component stays small.** `layouts.ts` exports, per tab, a list of blocks; a block is rows of `KeyDef { id, label, math?, name, action, weight?, tone? }`. `label` is the visible text; `math` is an optional LaTeX label rendered with the existing `MathFormula` for template keys (`\square^{2}`, `\sqrt{\square}`, `\left|\square\right|`, `\frac{\square}{\square}`); `name` is the Spanish accessible name; `weight` sets the relative width inside a flex row; `tone: 'control'` gives the gray look. `123` and `f(x)` have two blocks side by side (left: letters/functions, right: digits/symbols); `ABC` and `#&¬` have one. This also gives the offset second row of the letter layout by centering rows with fewer keys.

**Actions.** `KeyAction` is a small union:

| Action | Effect |
|---|---|
| `text { text, caret? }` | write `text`; the caret goes at `caret` (default: end). Templates are authored with a `|` marker (`sqrt(\|)`) that a helper strips and turns into `caret` |
| `letter { lower, upper }` | like `text`, but honors shift and a pending accent |
| `backspace`, `move { by: -1 \| 1 }`, `newline` | edit commands |
| `shift`, `accent`, `layout { to }` | change keyboard state only, nothing is written |

The keyboard resolves `letter`, `shift`, `accent` and `layout` itself and calls `onEdit` with one of three commands: `insert { text, caret }`, `backspace` or `move { by }` (`newline` is `insert "\n"`). It never touches the textarea or the message.

**Text editing is pure.** In `utils/text.ts`, `insertText(value, start, end, text, caret)`, `deleteBackward(value, start, end)` and `moveCursor(value, start, end, by)` return `{ value, selectionStart, selectionEnd }`. They replace `insertAtSelection`, whose auto-space rule is gone from the spec. `Composer` calls them with the textarea's `selectionStart/End` (read from the ref, which keeps its value when the textarea loses focus) and then `setMessage` plus a fresh cursor request. The cursor request becomes `{ start, end }` (the current code only supports a single position) and a new object each time, so the effect runs even when the position does not change.

**Focus.** Keys call `preventDefault` on `mousedown` so a pointer press never moves focus off the textarea. The cursor-request effect always sets the selection range, and calls `focus()` only when the press came from a pointer, detected with `click` `detail > 0` (`detail` is 0 for Enter/Space activation). That satisfies the spec: pointer keeps focus in the input, keyboard users stay on the key. Alternative: always focus the textarea, rejected because it kicks keyboard users out of the key row after every press.

**Device keyboard.** While the panel is open the textarea gets `inputMode="none"` through `slotProps.htmlInput`, so phones show only the calculator; a physical keyboard is unaffected. Trade-off: on a phone the user must close the calculator to use the device keyboard (the `ABC` tab covers letters meanwhile). Alternative: leave `inputMode` alone, rejected because every key press would also raise the native keyboard and cover the calculator.

**Keyboard state.** One `useReducer` in `CalculatorKeyboard` for `{ tab, alpha: 'latin' | 'greek', shift, accent }`. The component unmounts when the panel closes, so reopening starts on `123`, Latin, shift off (spec: opens on "123"). Rules: a written `letter` clears `shift` and `accent`; `shift` toggles; `accent` toggles; `layout` switches `alpha`; changing tab does not clear the typed text because the text lives in `Composer`. The accent applies to `a e i o u` and capitals (`á É`); before any other key that writes text it writes `´` first and then that key's text. Either way the accent is cleared, so it cannot leak onto a later vowel.

**What each key writes.** `^` and `_` are written as `^()` and `_()` so exponents and subscripts of more than one character stay grouped. Function names use the Spanish labels of the screenshots (`sen`, `tg`) and spell inverses out, which an LLM reads without ambiguity.

| Key (tab) | Writes (`\|` = cursor) |
|---|---|
| `x y π e`, digits, `. , ( ) < > = +` | the same character |
| `−`, `×`, `÷` (123) | `-`, `×`, `÷` |
| x² · power · √ · abs · fraction · base with sub and sup (123) | `^2` · `^(\|)` · `sqrt(\|)` · `abs(\|)` · `(\|)/()` · `_(\|)^()` |
| sen · cos · tg (f(x)) | `sen(\|)` · `cos(\|)` · `tg(\|)` |
| sen⁻¹ · cos⁻¹ · tg⁻¹ | `arcsen(\|)` · `arccos(\|)` · `arctg(\|)` |
| ln · log₁₀ · log with base | `ln(\|)` · `log10(\|)` · `log_(\|)()` |
| e^□ · 10^□ · nth root | `e^(\|)` · `10^(\|)` · `root(\|,)` |
| d/dx · ∫ · subscript | `d/dx(\|)` · `∫ \| dx` · `_(\|)` |
| `% ! $ ° { } ≤ ≥ i` | the same character |
| ceiling · floor (#&¬) | `ceil(\|)` · `floor(\|)` |
| point · column vector · matrix | `(\|,)` · `(\|;)` · `{{\|,},{,}}` |
| `∞ ≟ ≠ ∧ ∨ ¬ ⊗ [ ] ∥ ⊥ ∈ ⊂ ⊆ ∠ → \ & @ # $ ; : ' " ′ ″` | the same character |
| letters, Greek | the letter, capital with shift |

The `∫ | dx` template matches the integral pattern that `plainMathToLatex` already parses (`∫ <expr> dx`), and `d/dx(...)` matches its derivative pattern.

**Preview conversion (`utils/math.ts`).** Extend `normalizePlainExpression` and the symbol table, keeping the existing behavior and tests:
- Function names: `tg` to `\tan`, `arcsen`/`arcsin` to `\arcsin`, `arccos`, `arctg`/`arctan` to `\arctan`; `log10(x)` to `\log_{10}(x)`; `log_(b)(x)` to `\log_{b}(x)`.
- A small helper that finds the matching closing parenthesis, so nested calls work: `sqrt(...)` (migrated from the no-nesting regex), `abs(...)` to `\left|...\right|`, `root(n, x)` to `\sqrt[n]{x}`, `ceil` and `floor` to `\lceil \rceil` and `\lfloor \rfloor`, and `^(...)` / `_(...)` to `^{...}` / `_{...}`.
- A fraction only when a parenthesized group is followed by `/` and another parenthesized group and the first group does not directly follow a letter or digit: `(x+1)/(x-1)` is `\frac{x+1}{x-1}`, while `sin(x)/x`, `sin(x)/(2)` and `d/dx (x^3)` are untouched.
- Symbols: `∧ ∨ ¬ ⊗ ∈ ⊂ ⊆ ∠ ⊥ ∥ ≟ ° ′ ″` and the missing Greek letters (`ζ η ι κ ξ ο υ χ ψ ς`, capitals `Θ Λ Ξ Π Ψ`); `ϕ` and `φ` map to two different commands (`\varphi`, `\phi`).
- Characters that are special in LaTeX but plain here (`% $ # & { }`) are escaped in the converted text, otherwise `%` would drop the rest of the line and `{` would raise a parse error. Input that already contains LaTeX commands is passed through untouched, as today.
- Add the new symbols and `_` to the "this line looks like math" signals so a line like `3 × 4` or `x ∈ A` gets a preview.

**Look.** Keys are MUI `Button`s using theme tokens, so both palettes work: white `background.paper` keys on the `background.default` panel, gray control keys (`action.hover`/`action.selected`), the selected tab as a pill with `primary.light` background and `primary.main` text, 40 px tall keys and `minWidth: 0` so ten letter keys fit in 360 px. Template keys render their LaTeX label with `MathFormula` and are `aria-hidden`; the button's `aria-label` carries the Spanish name. KaTeX's `\square` is a solid box, not GeoGebra's dotted one; accepted.

**Tabs.** A `role="tablist"` of buttons with `role="tab"` and `aria-selected`; the key area is the matching `tabpanel`. All four tabs are normal tab stops (no arrow-key roving). The whole keyboard sits in a `region` named "Calculadora" inside the existing panel `Paper`, which keeps its `maxHeight` and `overflowY`.

**Placement.** The composer renders, top to bottom: the "Abrir Calculadora" button, the math preview, the message input row, and the calculator panel last. The panel sits under the input like a device keyboard, so the text being written and its preview stay in view above the keys and the user's thumb reaches the keys at the bottom of the screen. The button stays at the top: moving it would change a control the spec already fixes. Alternative: keep the panel above the input (the first version), changed at the user's request.

**Tests.** Vitest and Testing Library as in the repo: pure functions in `utils/text.test.ts` and `utils/math.test.ts`; `layouts` tests (each tab has the expected keys, ids and accessible names are unique); `CalculatorKeyboard.test.tsx` for tabs, the writing keys, shift, accent, Greek switch, backspace, cursor and newline against a small controlled host; `Composer.test.tsx` updated (label, toggle, reset on send, focus, selection replacement, `inputMode`, preview for calculator output). The old snippet tests are removed. Visual checks (360 px and desktop, light and dark) are done by eye in the dev server.

## Risks / Trade-offs

- [Plain-text templates are not navigable boxes: after `^()` the user moves out of the parentheses with the cursor keys or by typing `)`] → Accepted for this change (see the decision in proposal.md); `move` keys and the `abs()`/`sqrt()` carets keep it quick. A WYSIWYG field is a possible later change.
- [The icon of the third-row, fourth key on `123` is not clear in the screenshot] → It is modeled as the "base with subscript and superscript" key (`_()^()`), a single `KeyDef` in `layouts.ts`; confirm at review, changing it touches one line and one scenario.
- [`ans` and the `...` menu are left out, so the bottom-left cell of `123` has no key] → That cell is kept empty (hidden, same width) so the rest of the grid matches the screenshot.
- [`Enter` (↵) inserts a line break instead of sending] → Sending stays with the send button and the physical Enter key; a key that sends from the calculator would be one mis-tap away from sending half an exercise.
- [A line that mixes words and math is still converted whole by the preview] → Existing behavior, listed as a non-goal; new keys make it easier to hit (`Resuelve x^2 = 4`), so it is worth its own change.
- [`inputMode="none"` hides the device keyboard while the calculator is open] → Intended; closing the calculator brings it back. Desktop is unaffected.
- [Pointer versus keyboard activation is told apart with `click` `detail`] → Verify in the browser at implementation; if a browser reports `detail` 0 for taps, fall back to tracking `pointerdown` on the key.
- [About 110 keys with KaTeX labels render at once per tab] → Only the selected tab is rendered; KaTeX output for the few template labels is small. Measure with the dev tools if the panel feels slow on a low-end phone.
