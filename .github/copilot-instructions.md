# Copilot Review Instructions

Use these instructions whenever the user asks for a code review.

## Review Focus

Review backend and frontend code for the following requirements.

1. Docstrings/JSDoc on all public functions.
2. Input validation on every POST/PUT route.
3. Correct HTTP status codes usage: 400, 404, 422, 500.
4. No empty catch blocks.
5. Frontend loading states and error handling.
6. Test coverage greater than 80%.

## Expected Review Output

Return findings ordered by severity (high to low) with file and line references.

For each finding include:

- Issue summary
- Why it matters (risk/impact)
- Concrete fix recommendation

If no findings are present, explicitly state that and list any residual risks or missing tests.

## Project-Specific Expectations

- All API endpoints must start with `/api`.
- Use response envelope on all endpoints: `{ "success": bool, "data": ... }`.
- Enforce task business rules:
  - Status workflow must be `todo -> in-progress -> done` with no skipping.
  - Return `400` when title is missing or invalid.
  - Return `404` when task is not found.
  - Return `422` for invalid status/priority.
- Frontend must support loading indicators and error toasts for async API actions.
