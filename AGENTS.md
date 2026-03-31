# AGENTS.md

This document defines the core engineering principles, architectural rules, and workflow protocols for the AI Agent. Adherence to these rules ensures high code quality, maintainability, and consistency across the project.

## 1. Architecture: Feature-Sliced Design (FSD)

The project follows FSD principles integrated with Next.js App Router best practices. **Core Philosophy:** Group by **Domain** and **UX Slice**, not by technical type or name.

### Layer Definitions

- **`app/`**: Routing layer. Contains only layouts, metadata, and root providers.
- **`src/views/`**: Page-level business logic and main layout (Container role).
  - _Structure_: `src/views/{page-name}/ui/{PageName}.tsx`
- **`src/widgets/`**: Independent, self-contained UI blocks (e.g., `GlobalNav`, `Sidebar`).
- **`src/features/`**: **User Interaction & Business Logic Units.**
  - **Grouping Rule**: Features sharing the same domain, state machine, or lifecycle must be unified into a single slice.
  - **BAD**: `features/play-character-blink`, `features/play-character-heart` (Fragmented)
  - **GOOD**: `features/character-animation/model/useBlink.ts`, `features/character-animation/model/useHeart.ts`
- **`src/entities/`**: Domain entities, data models, and domain-specific rendering logic.
  - _Technical utils_ (e.g., `apply-materials`) live here (e.g., `entities/character/lib`) or in `shared/lib`.
- **`src/shared/`**: Reusable UI (Atomic), generic utilities, types, and assets.

---

## 2. Frontend & Styling Rules

### Development Standards

- **Framework**: Next.js App Router.
- **Syntax**: Use `const` for all function declarations unless `function` is strictly required.
- **Clean Code**:
  - Prohibit unnecessary `div` wrappers; use Semantic HTML elements.
  - No dead code, unused exports, or temporary logs in production-ready commits.
  - Use Path Aliases (`@/...`) exclusively; avoid long relative path chains.
  - Provide detailed **JSDoc in Korean** for all functions and hooks.

### Styling with Panda CSS

- **System**: Exclusively use Panda CSS. Do not introduce Emotion or CSS Modules.
- **Responsive Design**: **Never hardcode pixel values.** Reference the central configuration in `src/shared/config/responsive.ts` (synced with `panda.config.ts`).
  - _Usage_: Use `token('breakpoints.sm')` or responsive object syntax: `{ base: '...', md: '...' }`.
- **Co-location**: Declare styles (`css()`, `cva()`) within the component file. Do not use separate `*.styles.ts` files.
- **Extensibility**: Only the `className` prop is permitted for external style overrides.
- **Composition**: Merge styles using the `cx(localRecipe, props.className)` pattern.
- **Layout**: Do not add layout props (e.g., `margin`, `gap`) to components; handle offsets via `className`.

### Client/Server Strategy

- **`use client`**: Apply only for State, Effects, Browser APIs, `next/navigation`, or complex portal/focus management.
- **Server-First**: Components used solely for styling or static translations (`next-intl`) must remain Server Components.

---

## 3. Test Writing Rules

### Environment Selection (The "Lowest Cost" Contract)

The Agent must evaluate the code dependencies to enforce the most efficient test environment.

- **Node Environment (`@vitest-environment node`)**:
  - **Contract**: Ensures consistency of pure data transformations and logic.
  - **Trigger**: Any logic not referencing Browser APIs (`window`, `document`, `HTMLElement`, etc.).
  - **Targets**: Route Handlers, Server Actions, Utility functions (Slug, Date, Formatting), and Cache Key logic.
- **JSDom Environment (`@vitest-environment jsdom`)**:
  - **Contract**: Ensures correct UI rendering and basic event wiring within the DOM.
  - **Trigger**: React components, hooks with `useEffect`, or logic requiring DOM manipulation.
  - **Strategy**: Isolate complex logic into pure functions (tested in Node) and keep JSDom tests focused on "wiring."
- **E2E (Playwright)**:
  - **Contract**: Guarantees runtime behavior across real browser engines.
  - **Targets**: Focus traps, Portals, Selection/Caret control, and actual Scroll/Resize interactions.

### Test Description Protocol (Contract-based)

Test descriptions must describe a **Contract between State and Result**, not an action log.

- **Format**: Under **[Condition/Context]**, **[Subject]** must **[Expected Behavior/State Change]**.
- **Examples**:
  - **BAD**: "Saves user info."
  - **GOOD**: "When valid user data is submitted, the 'user' state in the store must be updated with the provided payload."
  - **GOOD**: "Clicking the 'Publish' button must trigger form validation; upon success, the 'Save Complete' toast must be rendered."

---

## 4. Workflow & PR Protocol

1.  **Iterative TDD**: Write one test -> Implement one logic unit -> Repeat.
2.  **Commit Granularity**: Divide work into meaningful, logical units. Seek user confirmation and suggest [commit message + 1-3 line description] after each unit.
3.  **PR Documentation**: Maintain markdown files in `docs/pr/`. Focus on "Problems Solved" and "Impact" (UX/SEO/Performance).
    - **Structure**: Goal -> Changes in this branch -> User-facing changes -> Implementation Highlights (Design decisions, tricky logic) -> Verification results.
4.  **Language**: Commit messages and PR summaries must be in **Korean**.

---

## 5. Accessibility (A11y) Standards

- **Semantic HTML**: Prioritize native elements over ARIA roles.
- **Keyboard Access**: All interactive elements must be accessible via `Tab`, `Enter`, and `Space`.
- **Visual Cues**: Never remove focus outlines; ensure high-contrast focus states.
- **Screen Readers**: Use `aria-live` for dynamic status updates and provide `alt`/`aria-label` for all non-text content.

---

## 6. Subagent Orchestration

Use specialized subagents explicitly:

- code-mapper → trace code paths and dependencies
- fsd_architect_reviewer → validate architecture
- a11y_ux_auditor → accessibility and UX checks
- db_guardian → database validation when needed
- implementer → apply minimal code changes and write commit message
- test_writer → generate tests
- pr_writer → generate PR documentation

Execution rule:

- Always analyze before modifying
- Prefer minimal changes over refactoring
