# src-layout Specification

## Purpose

Defines the folder structure of the frontend `src` directory and what each folder is responsible for, so contributors always know where a new file belongs.

## Requirements

### Requirement: Source directory provides the standard folders
The frontend `src` directory SHALL contain these top-level folders: `assets`, `components`, `hooks`, `icon`, `layouts`, `modules`, `routes`, `utils`.

#### Scenario: Listing the source directory
- **WHEN** a developer lists the contents of `frontend/src`
- **THEN** all eight folders are present

#### Scenario: Fresh clone
- **WHEN** a developer clones the repository and opens `frontend/src`
- **THEN** all eight folders exist without any manual creation step

### Requirement: Empty folders are tracked in version control
Each standard folder SHALL remain present in version control while it has no real files.

#### Scenario: Folder without real files
- **WHEN** a standard folder contains no source files yet
- **THEN** it contains a placeholder file so version control keeps the folder

### Requirement: Static media and icons are separated
The `assets` folder SHALL hold static media imported by the app (images, fonts), and the `icon` folder SHALL hold icon files and icon components.

#### Scenario: Adding an image
- **WHEN** a developer adds a logo or illustration
- **THEN** it is placed in `assets`

#### Scenario: Adding an icon
- **WHEN** a developer adds an icon
- **THEN** it is placed in `icon`, not in `assets`

### Requirement: Shared UI and logic have dedicated folders
The `components` folder SHALL hold UI pieces reused by more than one module, `hooks` SHALL hold reusable custom hooks, and `utils` SHALL hold framework-independent helper functions.

#### Scenario: Component used by two modules
- **WHEN** a UI component is needed by more than one module
- **THEN** it is placed in `components`

#### Scenario: Pure helper function
- **WHEN** a helper does not depend on React or on any module
- **THEN** it is placed in `utils`

### Requirement: Pages and navigation have dedicated folders
The `layouts` folder SHALL hold page shell wrappers shared by several pages, `routes` SHALL hold route definitions, and `modules` SHALL hold feature-scoped code grouped by feature.

#### Scenario: New feature
- **WHEN** a developer builds a feature such as the chat page
- **THEN** its page, local components and local logic are grouped in one folder under `modules`

#### Scenario: Registering a page
- **WHEN** a feature page needs a URL
- **THEN** its route is defined in `routes`

### Requirement: Folder layout does not alter the application
Adding the standard folders SHALL NOT change application behavior, the build output or the lint result.

#### Scenario: Build after adding folders
- **WHEN** the build and lint scripts run in `frontend/`
- **THEN** both complete successfully, as before the folders were added
