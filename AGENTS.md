# AGENTS.md

## Project Architecture and Tech Stack

This project is a two-tier task manager application.

- Frontend:
  - Vanilla HTML, CSS, and JavaScript
  - Runs from the `frontend` folder
  - Uses `fetch` to call backend APIs
- Backend:
  - Node.js with Express (CommonJS)
  - Exposes REST endpoints under `/api`
  - Uses `cors`, `fs-extra`, and `uuid`
  - Persists task data in a local JSON file (`tasks.json` or equivalent)

### Core Data Model

Each task object must contain:

- `id`: UUID (auto-generated)
- `title`: string (required, 1-200 chars)
- `description`: string (optional)
- `status`: `todo` | `in-progress` | `done`
- `priority`: `low` | `medium` | `high`
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp

### Business Rules

- Status workflow is strict: `todo -> in-progress -> done` (no skipping).
- Return `400` when title is missing/invalid.
- Return `404` when task is not found.
- Return `422` for invalid status/priority.
- All endpoints must start with `/api`.

## Coding Standards

### Backend Standards

- Use Express route handlers with `async/await`.
- Validate input before mutation or persistence.
- Keep route definitions and middleware clear and grouped.
- Always update `updatedAt` on changes.
- Preserve response shape consistency across success and failure cases.

### Frontend Standards

- Use semantic HTML and accessible controls.
- Keep styling in CSS; avoid inline styles.
- Use vanilla JS only, no UI frameworks.
- Keep UI state (filters/search/loading) in JavaScript state variables.
- Avoid full page reloads for filtering/search/CRUD interactions.

## API Response Envelope

All API endpoints must return this envelope shape:

```json
{
  "success": true,
  "data": {}
}
```

### Envelope Rules

- Success responses:
  - `success` must be `true`
  - `data` contains object/array payload
- Error responses:
  - `success` must be `false`
  - `data` contains an error object with at least `message`

Recommended error envelope example:

```json
{
  "success": false,
  "data": {
    "message": "Task not found"
  }
}
```

## Sub-Agents (3)

### 1) Backend Agent

Purpose:

- Implements and maintains Express REST APIs in the backend layer.

Responsibilities:

- Route design under `/api`
- Schema and business-rule validation
- File-based persistence
- Correct status code behavior (`400`, `404`, `422`)
- Response envelope compliance

### 2) Frontend Agent

Purpose:

- Implements and maintains the vanilla JS user interface.

Responsibilities:

- Task table rendering with status/priority badges
- Add Task modal and row actions (Edit/Delete/Complete)
- Client-side filters and live search
- Loading indicators and toast notifications
- Integration with backend envelope responses

### 3) Explore Agent

Purpose:

- Read-only investigation and codebase discovery support.

Responsibilities:

- Locate files, patterns, and symbols quickly
- Summarize architecture and implementation details
- Support planning/debugging without applying code changes

## Patterns to Follow

- Keep backend and frontend concerns separated by directory.
- Keep API paths namespaced under `/api`.
- Enforce strict validation at API boundaries.
- Use one consistent envelope format for every endpoint.
- Keep UI updates reactive to state changes instead of reloading the page.
- Prefer small, testable functions with explicit names.

## Patterns to Avoid

- Returning mixed or ad-hoc response structures.
- Skipping status workflow steps (`todo` directly to `done`).
- Allowing invalid enum values for status/priority.
- Mixing DOM markup generation with API logic in the same concerns.
- Adding framework dependencies for this vanilla frontend.
- Silent failures without user-visible error feedback.
