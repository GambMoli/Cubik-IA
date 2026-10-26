# Spec Delta

## Purpose

Defines the calculator keyboard that opens from the chat composer: its tabs and keys, what each key writes into the message input, and how its control keys edit the text, so a student can build any math expression by tapping keys.

## ADDED Requirements

### Requirement: Calculator tabs
The calculator SHALL show four tabs labeled "123", "f(x)", "ABC" and "#&¬", open on "123", and show the keys of exactly one selected tab at a time.

#### Scenario: Opening the calculator
- **WHEN** the calculator opens
- **THEN** the four tabs are shown, "123" is selected and the numeric keys are visible

#### Scenario: Changing tab
- **WHEN** the user selects the "f(x)" tab
- **THEN** "f(x)" is marked selected, "123" is not, and the function keys replace the numeric keys

#### Scenario: Tab keeps typed text
- **WHEN** the user types "x+1" with the keys and then changes tab
- **THEN** the input still contains "x+1"

### Requirement: Keys write at the cursor
Pressing a key that writes text SHALL insert it at the input's cursor, replacing any selected text, without adding spaces, and SHALL leave the cursor after the text, or inside the first empty slot when the key writes a template.

#### Scenario: Writing after existing text
- **WHEN** the input contains "2" with the cursor at the end and the user presses "x"
- **THEN** the input contains "2x" with the cursor after the "x"

#### Scenario: Writing in the middle
- **WHEN** the input contains "ab" with the cursor between the letters and the user presses "7"
- **THEN** the input contains "a7b" with the cursor after the "7"

#### Scenario: Replacing a selection
- **WHEN** the text "def" is selected in "abc def" and the user presses "x"
- **THEN** the input contains "abc x"

#### Scenario: Template key
- **WHEN** the input is empty and the user presses the square root key
- **THEN** the input contains "sqrt()" with the cursor between the parentheses

### Requirement: Input keeps its focus
Pressing a key with a pointer SHALL keep the focus in the message input, and activating a key with the keyboard SHALL keep the focus on that key while still writing at the input's last cursor position.

#### Scenario: Press with the mouse
- **WHEN** the user clicks a key
- **THEN** the message input is focused and its cursor is where the key's text ended

#### Scenario: Activate with the keyboard
- **WHEN** a key has keyboard focus and the user presses Enter or Space
- **THEN** its text is written at the input's last cursor position and the focus stays on the key

### Requirement: Numeric tab keys
The "123" tab SHALL show the keys x, y, π, e, x², power, square root, absolute value, fraction, base with subscript and superscript, `<`, `>`, `,`, `(`, `)`, digits 0 to 9, `.`, `+`, `−`, `×`, `÷`, `=`, backspace, cursor left, cursor right and line break.

#### Scenario: Writing a number
- **WHEN** the user presses 1, 2, "." and 5
- **THEN** the input contains "12.5"

#### Scenario: Letters and constants
- **WHEN** the user presses x, y, π and e
- **THEN** the input contains "xyπe"

#### Scenario: Operators
- **WHEN** the user presses "+", "−", "×", "÷" and "="
- **THEN** the input contains "+-×÷=" and the "−" key wrote an ASCII hyphen-minus

#### Scenario: Squared
- **WHEN** the input contains "x" and the user presses the x² key
- **THEN** the input contains "x^2"

#### Scenario: Power
- **WHEN** the input is empty and the user presses the power key
- **THEN** the input contains "^()" with the cursor between the parentheses

#### Scenario: Absolute value
- **WHEN** the input is empty and the user presses the absolute value key
- **THEN** the input contains "abs()" with the cursor between the parentheses

#### Scenario: Fraction
- **WHEN** the input is empty and the user presses the fraction key
- **THEN** the input contains "()/()" with the cursor in the first pair of parentheses

#### Scenario: Subscript and superscript
- **WHEN** the input is empty and the user presses the base with subscript and superscript key
- **THEN** the input contains "_()^()" with the cursor in the first pair of parentheses

### Requirement: Function tab keys
The "f(x)" tab SHALL show the keys sen, cos, tg, sen⁻¹, cos⁻¹, tg⁻¹, ln, log₁₀, log with base, e to a power, 10 to a power, nth root, `%`, `!`, `$`, `°`, `{`, `}`, `≤`, `≥`, derivative, integral, `i`, subscript, backspace, cursor left, cursor right and line break.

#### Scenario: Trigonometric functions
- **WHEN** the user presses sen, cos and tg, each on an empty input
- **THEN** the input contains "sen()", "cos()" and "tg()" respectively, with the cursor between the parentheses

#### Scenario: Inverse trigonometric functions
- **WHEN** the user presses sen⁻¹, cos⁻¹ and tg⁻¹, each on an empty input
- **THEN** the input contains "arcsen()", "arccos()" and "arctg()" respectively, with the cursor between the parentheses

#### Scenario: Logarithms
- **WHEN** the user presses ln, log₁₀ and log with base, each on an empty input
- **THEN** the input contains "ln()", "log10()" and "log_()()" respectively, with the cursor in the first pair of parentheses

#### Scenario: Exponentials
- **WHEN** the user presses "e to a power" and "10 to a power", each on an empty input
- **THEN** the input contains "e^()" and "10^()" respectively, with the cursor between the parentheses

#### Scenario: Nth root
- **WHEN** the input is empty and the user presses the nth root key
- **THEN** the input contains "root(,)" with the cursor right after the opening parenthesis

#### Scenario: Derivative
- **WHEN** the input is empty and the user presses the derivative key
- **THEN** the input contains "d/dx()" with the cursor between the parentheses

#### Scenario: Integral
- **WHEN** the input is empty and the user presses the integral key
- **THEN** the input contains "∫  dx" (two spaces) with the cursor between the two spaces

#### Scenario: Subscript
- **WHEN** the input contains "x" and the user presses the subscript key
- **THEN** the input contains "x_()" with the cursor between the parentheses

#### Scenario: Single-character keys
- **WHEN** the user presses `%`, `!`, `$`, `°`, `{`, `}`, `≤`, `≥` and `i`
- **THEN** the input contains "%!$°{}≤≥i"

### Requirement: Latin letters tab
The "ABC" tab SHALL open on a Latin layout with the rows q w e r t y u i o p and a s d f g h j k l ñ, a shift key followed by z x c v b n m ï ü and backspace, and a last row with the "αβγ" key, `,`, `(`, `)`, a space bar, cursor left, cursor right and line break, plus an accent key after the first row. Letter keys SHALL write lowercase.

#### Scenario: Writing letters
- **WHEN** the user presses q, ñ, ï and ü
- **THEN** the input contains "qñïü"

#### Scenario: Space bar
- **WHEN** the user presses "a", the space bar and "b"
- **THEN** the input contains "a b"

### Requirement: Shift capitalizes the next letter
The shift key SHALL make only the next letter written a capital and then turn itself off, SHALL look active while on, and SHALL turn off when pressed again before a letter.

#### Scenario: One capital
- **WHEN** the user presses shift and then "a", "b"
- **THEN** the input contains "Ab" and shift is no longer active

#### Scenario: Shift pressed twice
- **WHEN** the user presses shift twice and then "a"
- **THEN** the input contains "a"

### Requirement: Accent key
The accent key SHALL put an acute accent on the next vowel written (a, e, i, o, u, also capital), and before any other key SHALL write the accent character "´" followed by that key's text.

#### Scenario: Accented vowel
- **WHEN** the user presses the accent key and then "e"
- **THEN** the input contains "é"

#### Scenario: Accent with shift
- **WHEN** the user presses the accent key, shift and then "a"
- **THEN** the input contains "Á"

#### Scenario: Accent before a consonant
- **WHEN** the user presses the accent key and then "b"
- **THEN** the input contains "´b"

### Requirement: Greek letters layout
The "αβγ" key SHALL switch the "ABC" tab to a Greek layout with the rows ϕ ς ε ρ τ υ θ ι ο π and α σ δ φ γ η ξ κ λ, a shift key followed by ζ χ ψ ω β ν μ and backspace, and a last row with an "ABC" key, `,`, `(`, `)`, a space bar, cursor left, cursor right and line break. The "ABC" key SHALL return to the Latin layout. The "ABC" tab SHALL stay selected on both layouts, and shift SHALL write the capital form of the Greek letter.

#### Scenario: Switching to Greek
- **WHEN** the user presses the "αβγ" key
- **THEN** the Greek letters are shown, the "ABC" tab stays selected and the last-row key reads "ABC"

#### Scenario: Writing Greek letters
- **WHEN** the user presses α, β and γ on the Greek layout
- **THEN** the input contains "αβγ"

#### Scenario: Capital Greek letter
- **WHEN** the user presses shift and then θ on the Greek layout
- **THEN** the input contains "Θ"

#### Scenario: Both phi forms
- **WHEN** the user presses the first-row phi key and the second-row phi key
- **THEN** the input contains the two different characters "ϕ" and "φ"

#### Scenario: Returning to Latin
- **WHEN** the user presses the "ABC" key on the Greek layout
- **THEN** the Latin layout is shown and the text already in the input is unchanged

### Requirement: Symbols tab keys
The "#&¬" tab SHALL show the keys ∞, ≟, ≠, ∧, ∨, ¬, ⊗, `[`, `]`, ∥, ⊥, ∈, ⊂, ⊆, ∠, →, ceiling, floor, point, column vector, matrix, `\`, `&`, `@`, `#`, `$`, `;`, `:`, `'`, `"`, `′`, `″`, backspace, cursor left, cursor right and line break.

#### Scenario: Single-character symbols
- **WHEN** the user presses ∞, ≠, ∧, ∨, ¬, ∈, ⊂, ⊆, ∠ and →
- **THEN** the input contains "∞≠∧∨¬∈⊂⊆∠→"

#### Scenario: Punctuation
- **WHEN** the user presses `;`, `:`, `'`, `"`, `′` and `″`
- **THEN** the input contains `;:'"′″`

#### Scenario: Ceiling and floor
- **WHEN** the user presses the ceiling key and the floor key, each on an empty input
- **THEN** the input contains "ceil()" and "floor()" respectively, with the cursor between the parentheses

#### Scenario: Point, column vector and matrix
- **WHEN** the user presses the point, column vector and matrix keys, each on an empty input
- **THEN** the input contains "(,)", "(;)" and "{{,},{,}}" respectively, with the cursor right after the opening "(", "(" and "{{"

### Requirement: Backspace key
The backspace key SHALL delete the selected text, or the single character before the cursor when nothing is selected, and SHALL do nothing at the start of the input.

#### Scenario: Delete the previous character
- **WHEN** the input contains "x+1" with the cursor at the end and the user presses backspace
- **THEN** the input contains "x+" with the cursor at the end

#### Scenario: Delete a selection
- **WHEN** "+1" is selected in "x+1" and the user presses backspace
- **THEN** the input contains "x"

#### Scenario: Nothing to delete
- **WHEN** the cursor is at the start of the input and the user presses backspace
- **THEN** the input does not change

### Requirement: Cursor keys
The cursor left and right keys SHALL move the cursor one character without changing the text, collapse a selection to its start or end respectively, and SHALL not move it past either end of the text.

#### Scenario: Move left
- **WHEN** the input contains "abc" with the cursor at the end and the user presses cursor left
- **THEN** the cursor is between "b" and "c"

#### Scenario: Move right at the end
- **WHEN** the cursor is at the end of the input and the user presses cursor right
- **THEN** the cursor stays at the end

#### Scenario: Collapse a selection
- **WHEN** "bc" is selected in "abcd" and the user presses cursor left
- **THEN** the cursor is between "a" and "b" and nothing is selected

### Requirement: Line break key
The line break key SHALL insert a line break at the cursor, replacing any selected text, and SHALL NOT send the message.

#### Scenario: Break a line
- **WHEN** the input contains "x=1" with the cursor at the end and the user presses the line break key
- **THEN** the input contains "x=1" followed by a line break and no message is submitted

### Requirement: Device keyboard stays hidden while calculating
While the calculator is open, the message input SHALL ask the device not to show its on-screen keyboard, and SHALL go back to the default when the calculator closes. Typing with a physical keyboard SHALL keep working.

#### Scenario: Calculator open
- **WHEN** the calculator is open
- **THEN** the message input declares that it needs no on-screen keyboard

#### Scenario: Calculator closed
- **WHEN** the calculator is closed
- **THEN** the message input has no such declaration

#### Scenario: Physical keyboard
- **WHEN** the calculator is open and the user types "x" with a physical keyboard in the input
- **THEN** the input contains "x"

### Requirement: Keys fit small screens
Every key of the selected tab SHALL be visible without horizontal scrolling at a viewport width of 360 px and SHALL be at least 24 by 24 CSS pixels.

#### Scenario: Narrow phone
- **WHEN** the calculator is open on a 360 px wide viewport on the "ABC" tab
- **THEN** all ten keys of the first letter row are visible at once and none is smaller than 24 by 24 px

### Requirement: Calculator is accessible
The calculator SHALL be a labeled region named "Calculadora", its tabs SHALL be exposed as tabs with a selected state, and every key SHALL have a Spanish accessible name describing its action and be usable with the keyboard alone.

#### Scenario: Region and tabs
- **WHEN** the calculator is open
- **THEN** a region named "Calculadora" contains four tabs, and exactly one has its selected state on

#### Scenario: Key names
- **WHEN** a screen reader reaches the square root key and the backspace key
- **THEN** they are announced as "Raíz cuadrada" and "Retroceso"
