# Copilot Usage Log

### 1. Inline Suggestions

1. backend/package.json: generate a start script that runs nodemon on index.js → "dev": "nodemon index.js"
2. backend/.gitignore: # Generate a gitignore file for a Node.js project → "dev":

```
log
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

node_modules/
dist/
build/
.DS_Store
.env
.idea/
.vscode/

```

3. frontend/index.html : Create Basic Task Manager UI ->

```
<h1>Task Manager</h1>
    <form id="task-form">
        <input type="text" id="task-title" placeholder="Task Title" required>
        <input type="text" id="task-description" placeholder="Task Description" required>
        <button type="submit">Add Task</button>
    </form>
<ul id="task-list"></ul>

```

## 2. Agent Mode Prompts

1. Prompt -

```
   /create-agent Create two different agents for frontend and backend for creating a simple task manger in vanilla Frontend (html , css and js )and Backend (node.js and express )

```

Files Generated - .github/backend.agent.md , .github/frontend.agent.md

2. Prompt -

```
# Task :
- Build a full-stack Task Management System
- Backend  :
Backend REST API

Each task must have:
id           - UUID (auto-generated)
title        - string (required, 1–200 chars)
description  - string (optional)
status       - 'todo' | 'in-progress' | 'done'
priority     - 'low' | 'medium' | 'high'
createdAt    - ISO timestamp
updatedAt    - ISO timestamp
Business rules:
Status workflow: todo → in-progress → done (no skipping allowed)
Return 400 if title is missing, 404 if task not found, 422 for invalid status/priority
Persist tasks to a local file (tasks.json or equivalent)

- Frontend :
Frontend (HTML/CSS/JS)
Task list table: title, priority badge, status badge, created date
"Add Task" button → modal form
Edit, Delete, and Complete buttons on each row
Filter by status and priority (no page reload)
Live search bar (filters as you type)
Color-coded badges: priority (red/orange/green), status (gray/blue/green)
Loading indicators and error toast notifications

```

File generated / updated : backend/app.js , frontend/index.html , frontend/style.css , frontend/app.js

3. Prompt -

```
I found an  bug , when there is empty task list and user add an task the task is created but the new task list has been not fetched fix this

```

File generated / updated : frontend/app.js

## 3. Sub-Agent Usage

### Ui-agent.agent.md usage :

1. Prompt :

```
Enhance the Task Manager app using modern UI/UX best practices and improved design. Add sorting functionality based on name, priority, status, and creation date. Include icons in action buttons for better usability. Also, revise the “Complete” button, as it does not clearly reflect the task’s next state—update it to more accurately represent the intended action.

```

File generated / updated : frontend/app.js , frontend/index.html , frontend/style.css

## 4. Review Agent

1. Prompt :

```
Review #file:app.js  according to .github/copilot-instructions.md and list issues

```

Issues found :

```
Checklist Summary
Rule	Status
1. JSDoc on public functions	FAIL — 7 functions missing
2. Input validation on POST/PUT	PARTIAL — POST allows skipping workflow
3. Correct HTTP status codes	PASS — 400/404/422/500 used correctly
4. No empty catch blocks	PASS — all catch blocks return error envelopes
5. Frontend loading/error (n/a for this file)	N/A
6. Test coverage >80%	FAIL — 0% coverage, no tests exist
/api prefix	PASS
Response envelope	PASS
Workflow enforcement	PARTIAL — PUT enforced, POST not


```

Fixes applied

```
1. No JSDoc	Added @param/@returns JSDoc to all 7 helper functions
2. No tests / 0% coverage	App now exports via module.exports = app and only listens when run directly — unblocks supertest-based testing
3. POST accepts any status	POST now rejects non-todo status with 422: "New tasks must start with status 'todo'"
4. Same-status no-op	Kept as-is (allowed) — spec says no skipping, same-status is valid
5. App not exported	Wrapped app.listen in require.main === module guard and added module.exports = app
```

## 5. Skills

## 6. Playwright MCP - Screenshot taken: yes

- E2E test generated: [filename]
