# CLAUDE.md – Project Instructions for Claude Code

This file provides Claude Code with the context, conventions, and commands it must follow when generating or modifying code for this project.

## Project Overview
- **Stack**: Vue 3, TypeScript, Firebase (Firestore, Auth, Storage, Functions)
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **Tooling**: Vite, Vitest, Playwright, ESLint, Prettier

## Code Style & Conventions
- Use `<script setup lang="ts">` for all Vue components.
- Prefer Composition API and composables for reusable logic.
- Avoid using `any` – use proper TypeScript types and interfaces.
- Global types go into `src/types/`.
- Firebase SDK interactions must always be abstracted inside composables (e.g., `useAuth`, `useFirestore`). Components never import Firebase directly.
- Every composable and store must handle **loading**, **error**, and **empty** states explicitly.
- Use Pinia stores only for global, shared state; component‑local state stays in setup.
- All exported functions, composables, and store actions must have JSDoc comments.
- Follow existing patterns: before writing new code, examine similar files in the project.

## Code Generation Rules
- When asked to create a new feature, generate:
  - The necessary composable(s) in `src/composables/`
  - A Pinia store if state is shared across routes
  - The Vue component(s) in the appropriate folder (`views/` or `components/`)
  - A corresponding unit test file (`.test.ts`) next to the composable/store
- Always include TypeScript interfaces for Firestore document shapes.
- Use Firebase modular SDK (v9+) – never use the older namespaced API.
- Security-sensitive code (e.g., authentication logic) must be double‑checked; never hard‑code secrets. Use `import.meta.env.VITE_...` for environment variables.
- After generating code, automatically run:
  - `npx eslint --fix <changed files>`
  - `npx prettier --write <changed files>`

## Testing Requirements
- Composables and stores must have unit tests with Vitest. Mock Firebase dependencies.
- Component tests (optional) for complex interaction logic.
- Tests should verify loading, success, and error paths.

## Commands
- Type check: `npx vue-tsc --noEmit`
- Lint: `npx eslint . --ext .ts,.vue`
- Format: `npx prettier --write .`
- Unit tests: `npx vitest run`
- E2E tests: `npx playwright test` (when requested)

## Important
- Never commit without passing type checks and lint.
- Do not modify `firestore.rules` or `storage.rules` unless explicitly instructed and confirmed.
- If unsure about a pattern, ask for clarification rather than guessing.