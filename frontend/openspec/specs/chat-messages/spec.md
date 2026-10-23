# chat-messages Specification

## Purpose

Defines how conversation messages look and behave: author alignment, bubble styling, math formulas inside text, and the step-by-step resolution card for solved exercises.

## Requirements

### Requirement: Messages are aligned by author
Each message SHALL be shown with an avatar. User messages SHALL be aligned to the right and assistant messages to the left, in chronological order.

#### Scenario: Mixed conversation
- **WHEN** a conversation has a user message followed by an assistant message
- **THEN** the user message appears right-aligned above the left-aligned assistant message

#### Scenario: System message
- **WHEN** a message has the system role
- **THEN** it is shown like an assistant message

### Requirement: Author bubbles are visually distinct
User bubbles SHALL use the primary color as background with white text, and assistant bubbles SHALL use the surface color with a border and the normal text color.

#### Scenario: Comparing two bubbles
- **WHEN** a user bubble and an assistant bubble are displayed
- **THEN** the user bubble has a primary background with white text and the assistant bubble has a bordered surface background

### Requirement: Bubble width adapts to screen width
A message column SHALL be at most 78% of the messages area on wide screens and use the full width on narrow screens.

#### Scenario: Long message on desktop
- **WHEN** a long message is shown at or above the medium breakpoint
- **THEN** its bubble does not exceed 78% of the row width

#### Scenario: Long message on a phone
- **WHEN** a long message is shown below the medium breakpoint
- **THEN** its bubble may use the full row width

### Requirement: Math delimiters are rendered as formulas
Message text SHALL render `\[ ... \]` as a centered display formula and `\( ... \)` as an inline formula, keeping the surrounding text and paragraph breaks.

#### Scenario: Block formula
- **WHEN** a message contains `\[ \int x^2\,dx \]`
- **THEN** the integral is shown as a typeset display formula on its own line

#### Scenario: Inline formula
- **WHEN** a message contains `the value \( x^2 \) grows`
- **THEN** the formula is typeset inside the sentence

### Requirement: Plain-text math lines are rendered as formulas
A paragraph that is a short math expression written in plain text (for example `x^2 + 3x = 10` or `∫ x^2 dx`) SHALL be rendered as a display formula, while sentences of prose SHALL stay as text.

#### Scenario: Plain expression
- **WHEN** a paragraph contains only `x^2 + 3x = 10`
- **THEN** it is shown as a typeset formula

#### Scenario: Narrative sentence
- **WHEN** a paragraph is a sentence such as "Primero despejamos la variable x."
- **THEN** it is shown as ordinary text

### Requirement: Invalid math does not break the message
If a formula cannot be typeset, the message SHALL still be displayed and the rest of the page SHALL keep working.

#### Scenario: Malformed formula
- **WHEN** a message contains `\[ \frac{1}{ \]`
- **THEN** the message is shown with the broken part displayed as-is and no error screen appears

### Requirement: Resolution card for solved exercises
When an assistant message has an exercise with a resolution, the message SHALL include a card titled "Resolución paso a paso" with the numbered steps, the interpreted expression, the final result and the explanation.

#### Scenario: Message with resolution
- **WHEN** an assistant message has an exercise with steps, a final result and an explanation
- **THEN** the card lists the steps in order, shows "Expresión interpretada" and "Resultado" as formulas, and shows the explanation below

#### Scenario: Missing interpreted expression
- **WHEN** the exercise has no interpreted expression
- **THEN** the card omits the "Expresión interpretada" block and still shows "Resultado"

### Requirement: Exercise error is shown in the card
When the exercise of a message has an error message, the card SHALL show that message in the error color below the explanation.

#### Scenario: Exercise with error
- **WHEN** an exercise has a resolution and an error message
- **THEN** the error text is displayed in the error color at the bottom of the card

### Requirement: Long text is replaced by the resolution card
An assistant message that has a resolution and whose text is 180 characters or longer SHALL show only the card, without the text bubble. Shorter text SHALL be shown in a bubble above the card.

#### Scenario: Long text with resolution
- **WHEN** the text has 180 or more characters (ignoring surrounding whitespace) and a resolution exists
- **THEN** only the resolution card is shown

#### Scenario: Short text with resolution
- **WHEN** the text has fewer than 180 characters and a resolution exists
- **THEN** a text bubble is shown above the resolution card
