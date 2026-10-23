# Spec Delta

## Purpose

Defines the message composer at the bottom of the chat: typing and sending a message, inserting math snippets, and previewing the math being typed.

## ADDED Requirements

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
After a message is submitted, the composer SHALL clear the input and close the formula panel.

#### Scenario: Submit with the panel open
- **WHEN** a message is submitted while the formula panel is open
- **THEN** the input is empty and the panel is closed

### Requirement: Disabled composer
While the composer is disabled, the input and the send button SHALL not accept interaction.

#### Scenario: Waiting for a reply
- **WHEN** the composer is told it is disabled
- **THEN** the input cannot be edited and the send button is disabled

### Requirement: Formula panel
The composer SHALL provide an "Insertar fórmula" button that opens and closes a panel of six snippet cards: Integral, Por partes, Derivada, Límite, Ecuación and Raíz. Each card shows its label and a typeset preview.

#### Scenario: Opening the panel
- **WHEN** the user clicks "Insertar fórmula"
- **THEN** the panel shows the six cards and the button looks active

#### Scenario: Closing the panel
- **WHEN** the user clicks "Insertar fórmula" while the panel is open
- **THEN** the panel closes and the button returns to its normal look

#### Scenario: Panel taller than the screen
- **WHEN** the panel content is taller than 45% of the viewport height on a narrow screen (50% on a wide screen)
- **THEN** the panel scrolls internally

### Requirement: Formula panel usage hint
The open formula panel SHALL show a hint with examples of accepted plain-text input.

#### Scenario: Hint visible
- **WHEN** the panel is open
- **THEN** a hint below the cards mentions examples such as `∫ x^2 dx` and `d/dx (x^3)`

### Requirement: Inserting a snippet
Clicking a snippet card SHALL insert its plain-text expression into the input at the cursor, replacing any selection, then focus the input with the cursor after the inserted text.

#### Scenario: Insert into an empty input
- **WHEN** the input is empty and the user clicks the "Integral" card
- **THEN** the input contains "∫ x^2 dx" and is focused

#### Scenario: Insert after existing text
- **WHEN** the input contains "Resuelve" with the cursor at the end and the user clicks a card
- **THEN** a single space is added before the inserted expression

#### Scenario: Insert over a selection
- **WHEN** part of the text is selected and the user clicks a card
- **THEN** the selected text is replaced by the expression

### Requirement: Live math preview
While the user types, the composer SHALL show a block titled "Vista previa matemática" with the math in the input rendered as formulas, and SHALL hide it when the input has no math.

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
