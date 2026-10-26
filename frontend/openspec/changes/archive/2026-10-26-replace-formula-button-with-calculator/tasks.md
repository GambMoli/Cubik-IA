# Tasks

## 1. Text editing helpers

- [x] 1.1 Add `insertText`, `deleteBackward` and `moveCursor` to `src/utils/text.ts` (keep `insertAtSelection` until group 4 removes it) and verify `pnpm run test -- src/utils/text.test.ts` covers insertion at the end, in the middle and over a selection with no added space, the caret inside a template, backspace on a character, on a selection and at the start, and cursor moves left and right that collapse a selection and stop at both ends

## 2. Preview conversion for calculator notation

- [x] 2.1 In `src/utils/math.ts` add a matching-parenthesis helper and use it for `sqrt(...)` (replacing the no-nesting regex), `abs(...)`, `root(n, x)`, `ceil(...)`, `floor(...)`, `^(...)` and `_(...)`, and verify `src/utils/math.test.ts` covers nested input such as `sqrt((x+1)^2)`, `e^(x+1)`, `a_(n)`, `root(3, x)` and `abs(x-2)`, and that every existing `math.test.ts` case still passes
- [x] 2.2 Convert `tg`, `arcsen`/`arcsin`, `arccos`, `arctg`/`arctan`, `log10(x)` and `log_(b)(x)`, and verify tests for `tg(x) + arcsen(x) + ln(x) + log10(x)` and `log_(2)(8)` give the expected LaTeX, and that `sen(x)` still gives `\sin`
- [x] 2.3 Convert `(A)/(B)` to a stacked fraction only when the first group does not follow a letter or digit, and verify tests show `(x+1)/(x-1)` becomes a fraction while `sin(x)/x`, `sin(x)/(2)` and `d/dx (x^3)` do not
- [x] 2.4 Add the logic and set symbols, the missing Greek letters (with `ϕ` and `φ` as two different commands), `°`, `′`, `″` and `×`/`÷` handling, escape `% $ # & { }` in converted plain input, and add the new symbols and `_` to the math-signal checks; verify tests cover each new symbol, that `3 × 4 ÷ 2 ≤ 7` and `x ∈ A` produce a preview, that `50%` does not drop text, and that input containing LaTeX commands is unchanged

## 3. Calculator keyboard

- [x] 3.1 Create `src/modules/chat/components/CalculatorKeyboard/layouts.ts` with the `123`, `f(x)`, Latin, Greek and `#&¬` layouts as data (label, optional KaTeX label, Spanish accessible name, action, weight, tone) following the key lists in `specs/calculator-keyboard/spec.md` and the writing table in `design.md`, with the bottom-left `123` cell kept empty, and verify a test checks each layout's key count per row, that ids and accessible names are unique within a tab, and that the text each key writes and its caret match the design table
- [x] 3.2 Create the keyboard state (selected tab, Latin or Greek, shift, pending accent) as a reducer with a pure function that turns a pressed key into either an edit command or a state change, and verify unit tests cover one-shot shift, shift pressed twice, accent on a vowel, on a capital vowel and on a consonant, accent cleared by any text key, Greek capitals, and switching layout without losing the selected `ABC` tab
- [x] 3.3 Create `CalculatorKeyboard.tsx` and `index.ts`: region named "Calculadora", tablist with `role="tab"` and `aria-selected`, tabpanel, key buttons with Spanish `aria-label`, KaTeX labels marked `aria-hidden`, `preventDefault` on `mousedown`, theme-token styling for light and dark, keys that fit 360 px, and an `onEdit` callback; verify `CalculatorKeyboard.test.tsx` covers opening on `123`, changing tab, the keys of each tab found by accessible name, and the region and tab roles
- [x] 3.4 Cover key behavior in `CalculatorKeyboard.test.tsx` with a small controlled host that applies the `onEdit` commands to a text field, and verify tests for every scenario in `specs/calculator-keyboard/spec.md` under writing at the cursor, numeric, function and symbol keys, shift, accent, Greek layout, backspace, cursor keys and line break

## 4. Composer integration

- [x] 4.1 In `Composer.tsx` rename the button to "Abrir Calculadora", render `CalculatorKeyboard` in the existing panel `Paper` (keeping `maxHeight` and `overflowY`), and remove `formulaSnippets`, the usage hint and the `insertAtSelection` use; verify tests show the new label, no "Insertar fórmula" button, `aria-expanded` and the active look on open and close, the "Calculadora" region on its `123` tab, and that sending closes the panel and clears the input
- [x] 4.2 Apply keyboard edits to the message with the text helpers using the textarea selection, make the cursor request carry `{ start, end }` as a fresh object per press, focus the textarea only for pointer presses (`click` `detail` greater than 0) and set `inputMode="none"` on the input while the panel is open; verify tests for writing after text, in the middle and over a selection, the cursor after a template, focus kept after a mouse click, focus kept on the key after Enter or Space, `inputMode` present when open and absent when closed, and a physical keyboard still typing
- [x] 4.3 Remove `insertAtSelection` and its tests from `src/utils/text.ts` and `text.test.ts` and the six snippet tests from `Composer.test.tsx`, and verify `pnpm run lint` and `pnpm run test` pass with no references left (`rg insertAtSelection src` is empty)
- [x] 4.4 Add `Composer.test.tsx` cases that type with the calculator keys and read the "Vista previa matemática" block, and verify they cover `sqrt(` then a letter, a parenthesized fraction, a grouped exponent, a Greek letter and `×`

## 5. Docs and verification

- [x] 5.1 Update the source layout table in `frontend/README.md` with `src/modules/chat/components/CalculatorKeyboard/` and describe the calculator keys in one line, and verify the README paths exist on disk
- [x] 5.2 Verify the whole change: `pnpm run build`, `pnpm run lint` and `pnpm run test` pass on Node 24.22.1, and in the dev server at about 360 px and at 1280 px or wider, in light and dark palettes, the five screens match the screenshots (tabs, key order, gray control keys, selected pill), every tab fits without horizontal scrolling, mouse and touch presses keep the cursor in the input, Enter or Space on a key writes without leaving the key, and the pointer-versus-keyboard focus rule works in a real browser

## 6. Calculator below the input

- [x] 6.1 In `Composer.tsx` render the calculator panel after the message input row (button, preview, input, panel) and verify a `Composer.test.tsx` case checks the document order with the calculator open and a preview visible, and that the existing calculator and preview tests still pass
- [x] 6.2 Verify in the dev server at about 360 px and at 1280 px or wider that the panel is under the input in both palettes, the input and the preview stay visible above the keys, and the keys still write at the cursor and keep the focus in the input; then run `pnpm run build`, `pnpm run lint` and `pnpm run test`

## Workflow follow-up

- Confirm at review the one key whose icon is unclear in the screenshots (third row, fourth key of `123`, modeled as subscript and superscript) and the choices that were made without asking: `Enter` writes a line break, `ans` and the `...` menu are left out, `inputMode="none"` while the calculator is open.
- Archive this change after review; archiving adds the `calculator-keyboard` capability to the main specs and applies the `chat-composer` rename, modifications and removals.
