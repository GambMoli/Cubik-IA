# Proposal

## Why

The "Insertar fórmula" button opens six fixed snippets (Integral, Por partes, Derivada, Límite, Ecuación, Raíz). A student can only add those six expressions, so anything else (trigonometric functions, logarithms, roots of any index, Greek letters, logic symbols) has to be typed by hand from a physical keyboard, which is slow on a phone. GeoGebra's virtual calculator keyboard already covers that vocabulary and is familiar to math students. This change replaces the snippet panel with a calculator keyboard modeled on it, so any expression can be built by tapping keys.

## What Changes

- Rename the composer button from "Insertar fórmula" to "Abrir Calculadora". It keeps the open/close toggle behavior and its active look.
- Replace the six-snippet panel with an inline calculator keyboard, placed below the message input and the math preview like a device keyboard, that reproduces five GeoGebra key screens, in four tabs: `123` (digits, operators, `x y π e`, powers, root, absolute value, fraction), `f(x)` (trigonometric, inverse trigonometric, logarithms, exponentials, nth root, derivative, integral, `% ! $ °`, braces, `≤ ≥`, `i`), `ABC` (Latin letters with `ñ ï ü` and an accent key, switchable to Greek letters, shift for capitals) and `#&¬` (logic, set and geometry symbols, brackets, points, vectors, matrices, punctuation).
- Every key writes plain text into the existing message input at the cursor, as `x^2`, `sqrt()` or `∫  dx`. Keys that open a template place the cursor inside it. No result is computed; the assistant still solves the exercise.
- Add the keyboard control keys: backspace, cursor left and right, line break (↵), space, shift and the Latin/Greek switch.
- Extend the plain-text-to-LaTeX conversion so the live "Vista previa matemática" renders what the new keys write (`tg`, `arcsen`, `log10`, roots, absolute value, fractions, grouped exponents and subscripts, Greek and logic symbols).
- **BREAKING** (UI): remove the six snippet cards, the usage hint under them and the rule that a snippet insertion adds a space before it.
- Leave out two parts of the GeoGebra keyboard: the `ans` key (it recalls a computed result, and nothing is computed here) and the `...` menu (GeoGebra's own settings).

**Out of scope:** evaluating expressions in the browser, an on-screen "answer" memory, GeoGebra's `...` menu, a visual (WYSIWYG) math editor with navigable boxes, changes to what is sent to the backend (still plain text), and any API or backend work.

## Capabilities

### New Capabilities
- `calculator-keyboard`: The calculator keyboard panel: its four tabs and their keys, what each key writes into the input, the control keys, Latin/Greek and shift behavior, and how it behaves on small screens and with assistive technology.

### Modified Capabilities
- `chat-composer`: The "Formula panel" requirement becomes the "Calculator panel" opened by "Abrir Calculadora"; the snippet-card, usage-hint and snippet-insertion requirements are removed; "Composer resets after sending" closes the calculator; "Live math preview" also renders the notation the calculator writes.

## Impact

- Affected code: `frontend/src/modules/chat/components/Composer.tsx` (button, panel, cursor handling) and its test; new `frontend/src/modules/chat/components/CalculatorKeyboard/` (component, key layouts, tests); `frontend/src/utils/text.ts` (key editing logic replaces `insertAtSelection`) and `frontend/src/utils/math.ts` (preview conversion), with their tests; `frontend/README.md` source layout table.
- Dependencies: none new. Labels use the existing KaTeX and MUI.
- Specs: new `calculator-keyboard`; delta on `chat-composer` (requirements "Formula panel" renamed and modified, "Formula panel usage hint" and "Inserting a snippet" removed, "Composer resets after sending" and "Live math preview" modified).
- No backend, deployment or API impact; the message text sent to `onSubmit` keeps the same plain-text format.
