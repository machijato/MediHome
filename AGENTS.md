# AGENTS.md

## Purpose
This file defines strict working rules for Codex in the MediHome repository.

## 1) General Workflow
- Always create a new branch from `main` before making changes.
- Never push directly to `main`.
- Always open a Pull Request (PR) for any change.
- Keep changes minimal and scoped to the requested task.
- Do not refactor unrelated code.

## 2) Verification Rules
- Always ensure the project builds successfully before finishing work.
- Run relevant checks for the task, including build and tests.
- If UI is modified, ensure the UI remains testable.
- Never claim success without verification results.

## 3) MediHome-Specific Rules
- Respect the existing Supabase schema, especially the `provider_listings` table.
- Do **NOT** invent new columns or new tables.
- Do **NOT** modify database structure unless explicitly instructed.
- Do **NOT** modify RLS policies.
- Keep `App.tsx` fetch logic unchanged unless explicitly required.
- `CreateListingModal` must remain simple (MVP level).

## 4) Testing Rules
- Add `data-testid` attributes to all interactive UI elements.
- Prefer Playwright-compatible selectors.
- Do not rely on CSS classes for tests.

## 5) Safety Rules
- Never merge PRs yourself.
- Never bypass CI checks.
- Stop after 3 failed fix attempts and explain the issue clearly.
- Clearly report whether an issue is frontend, backend, or runtime.

## 6) Communication Rules (PR)
Every PR must include:
- What was changed.
- What was **NOT** changed.
- How it was tested.
- Known limitations.
