# chat-composer Specification

## Purpose

Defines the message composer at the bottom of the chat: typing and sending a message, inserting math snippets, and previewing the math being typed.

## Requirements

### Requirement: Composer input
The composer SHALL provide a multiline text input with the placeholder "Escribe tu consulta matemática aquí..." that grows up to six lines and then scrolls.

#### Scenario: Empty composer
- **WHEN** the composer is shown with no text
- **THEN** the placeholder is visible in the input

#### Scenario: Long input
- **WHEN** the user types more than six lines
- **THEN** the input stops growing and scrolls internally

### Requirement: Sending a message
The composer SHALL send the trimmed text when the user presses the send button or presses Enter, and SHALL insert a line break instead when the user presses Shift+Enter.

#### Scenario: Send with the button
- **WHEN** the input contains "  x^2 + 1  " and the user clicks the send button
- **THEN** the submit callback is called once with "x^2 + 1"

#### Scenario: Send with Enter
- **WHEN** the input contains text and the user presses Enter
- **THEN** the text is submitted and no line break is added

#### Scenario: New line with Shift+Enter
- **WHEN** the user presses Shift+Enter in the input
- **THEN** a line break is inserted and nothing is submitted

#### Scenario: Enter that confirms a text composition
- **WHEN** the user presses Enter only to confirm an in-progress input-method composition (for example an accented character)
- **THEN** the text is not submitted

### Requirement: Empty messages cannot be sent
The send button SHALL be disabled, and Enter SHALL do nothing, while the input contains only whitespace.

#### Scenario: Blank input
- **WHEN** the input is empty or only spaces
- **THEN** the send button is disabled and pressing Enter does not call the submit callback

### Requirement: Composer resets after sending
After a message is submitted, the composer SHALL clear the input and close the calculator panel.

#### Scenario: Submit with the panel open
- **WHEN** a message is submitted while the calculator panel is open
- **THEN** the input is empty and the panel is closed

### Requirement: Disabled composer
While the composer is disabled, the input and the send button SHALL not accept interaction.

#### Scenario: Waiting for a reply
- **WHEN** the composer is told it is disabled
- **THEN** the input cannot be edited and the send button is disabled

### Requirement: Calculator panel
The composer SHALL provide an "Abrir Calculadora" button that opens and closes the calculator keyboard panel, described in the `calculator-keyboard` capability, below the message input and the math preview.

#### Scenario: Opening the panel
- **WHEN** the user clicks "Abrir Calculadora"
- **THEN** the calculator keyboard is shown on its "123" tab and the button looks active

#### Scenario: Panel position
- **WHEN** the calculator is open and the math preview is visible
- **THEN** from top to bottom the composer shows the "Abrir Calculadora" button, the math preview, the message input with its send button, and the calculator keyboard last

#### Scenario: Closing the panel
- **WHEN** the user clicks "Abrir Calculadora" while the panel is open
- **THEN** the panel closes and the button returns to its normal look

#### Scenario: Panel taller than the screen
- **WHEN** the panel content is taller than 45% of the viewport height on a narrow screen (50% on a wide screen)
- **THEN** the panel scrolls internally

#### Scenario: Old button label
- **WHEN** the composer is shown
- **THEN** no button labeled "Insertar fórmula" exists

### Requirement: Live math preview
While the user types, the composer SHALL show a block titled "Vista previa matemática" with the math in the input rendered as formulas, including the notation the calculator keys write, and SHALL hide it when the input has no math.

#### Scenario: Single expression
- **WHEN** the input contains "lim x->0 sin(x)/x"
- **THEN** the preview shows the limit as a typeset formula

#### Scenario: Several math lines
- **WHEN** the input has more than one line containing math
- **THEN** the preview shows one formula per math line

#### Scenario: Block delimiters
- **WHEN** the input contains `\[ ... \]`
- **THEN** the preview renders the text the same way a message would be rendered

#### Scenario: No math
- **WHEN** the input contains only plain words
- **THEN** no preview block is shown

#### Scenario: Function names
- **WHEN** the input contains "tg(x) + arcsen(x) + ln(x) + log10(x)"
- **THEN** the preview shows tangent, inverse sine, natural logarithm and base-10 logarithm as typeset function names

#### Scenario: Grouped exponent and subscript
- **WHEN** the input contains "e^(x+1) + a_(n)"
- **THEN** the preview shows "x+1" together as the exponent and "n" as the subscript

#### Scenario: Roots and absolute value
- **WHEN** the input contains "sqrt(x) + root(3, x) + abs(x-2)"
- **THEN** the preview shows a square root, a cube root and the absolute value bars around "x-2"

#### Scenario: Parenthesized fraction
- **WHEN** the input contains "(x+1)/(x-1)"
- **THEN** the preview shows a stacked fraction

#### Scenario: Slash after a function is not a fraction
- **WHEN** the input contains "sin(x)/x"
- **THEN** the preview keeps the slash inline and shows no stacked fraction

#### Scenario: Greek and logic symbols
- **WHEN** the input contains "ζ ∧ ψ ∈ A ⊂ B → ∞"
- **THEN** the preview shows each of those symbols typeset

#### Scenario: Operators from the calculator
- **WHEN** the input contains "3 × 4 ÷ 2 ≤ 7"
- **THEN** the preview shows a formula with the multiplication, division and less-or-equal signs
