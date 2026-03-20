# Agents Project Data

## What to Build

### Backend REST API

Each task must have:

- `id` - UUID (auto-generated)
- `title` - string (required, 1-200 chars)
- `description` - string (optional)
- `status` - `todo` | `in-progress` | `done`
- `priority` - `low` | `medium` | `high`
- `createdAt` - ISO timestamp
- `updatedAt` - ISO timestamp

Business rules:

- All endpoints must start with `/api`
- Status workflow: `todo -> in-progress -> done` (no skipping allowed)
- Return `400` if title is missing
- Return `404` if task not found
- Return `422` for invalid status/priority
- Persist tasks to a local file (`tasks.json` or equivalent)
- API response envelope for all endpoints: `{ "success": bool, "data": ... }`

### Frontend (HTML/CSS/JS)

Required UI behaviors:

- Task list table: title, priority badge, status badge, created date
- `Add Task` button opens a modal form
- Edit, Delete, and Complete buttons on each row
- Filter by status and priority (no page reload)
- Live search bar (filters as you type)
- Color-coded badges:
  - Priority: red/orange/green
  - Status: gray/blue/green
- Loading indicators
- Error toast notifications

## Agent Mapping

- `frontend.agent.md` owns: table UI, modal interactions, filtering/search, badges, loading, and toasts in vanilla HTML/CSS/JS.
- `backend.agent.md` owns: REST endpoints, validation, status workflow enforcement, file persistence, and API error codes.
