# Spec Delta

## Purpose

Defines the shared look of the application: light and dark color schemes that follow the system, the typography and the surface styling every screen builds on.

## ADDED Requirements

### Requirement: Color scheme follows the system preference
The application SHALL use the dark palette when the operating system prefers a dark color scheme and the light palette otherwise, and SHALL switch when that preference changes while the app is open.

#### Scenario: System prefers dark
- **WHEN** the app loads and the system color scheme is dark
- **THEN** the page, containers and text use the dark palette

#### Scenario: System prefers light
- **WHEN** the app loads and the system color scheme is light
- **THEN** the page, containers and text use the light palette

#### Scenario: Preference changes while open
- **WHEN** the system color scheme changes while the app is open
- **THEN** the app switches palette without a reload

### Requirement: Readable text in both palettes
In both palettes, primary text and muted text SHALL stay legible on the page background and on container surfaces.

#### Scenario: Reviewing both palettes
- **WHEN** the chat page is displayed in the light palette and then in the dark palette
- **THEN** message text, the composer placeholder and labels are all readable against their backgrounds

### Requirement: Typography
Body text SHALL use Inter with system fallbacks, headings SHALL use Manrope, and code or monospace text SHALL use JetBrains Mono, each falling back to a system font when unavailable.

#### Scenario: Fonts unavailable
- **WHEN** the web fonts fail to load
- **THEN** text is still displayed using system fonts with no layout break

### Requirement: Layered surfaces
The page background SHALL differ from the surface of containers, and containers SHALL have a thin visible border. In the light palette they MAY have a soft shadow, and in the dark palette they SHALL have none.

#### Scenario: Container on the page
- **WHEN** the chat container is displayed
- **THEN** it is distinguishable from the page background by color and a 1px border

#### Scenario: Dark palette container
- **WHEN** the dark palette is active
- **THEN** the container shows no shadow
