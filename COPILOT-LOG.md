# Copilot Usage Log

---

## 1. Inline Suggestions

### Prompt 1 — `backend/package.json`

**Comment typed**: `generate a start script that runs nodemon on index.js`

**Copilot generated**:

```json
"dev": "nodemon index.js"
```

### Prompt 2 — `backend/.gitignore`

**Comment typed**: `# Generate a gitignore file for a Node.js project`

**Copilot generated**:

```
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

### Prompt 3 — `frontend/index.html`

**Comment typed**: `Create Basic Task Manager UI`

**Copilot generated**:

```html
<h1>Task Manager</h1>
<form id="task-form">
  <input type="text" id="task-title" placeholder="Task Title" required />
  <input
    type="text"
    id="task-description"
    placeholder="Task Description"
    required
  />
  <button type="submit">Add Task</button>
</form>
<ul id="task-list"></ul>
```

---

## 2. Agent Mode Prompts

### Prompt 1 — Create Custom Agents

**Prompt**:

```
/create-agent Create two different agents for frontend and backend for creating
a simple task manager in vanilla Frontend (html, css and js) and Backend (node.js and express)
```

**Files generated**: `.github/agents/backend-agent.agent.md`, `.github/agents/ui-agent.agent.md`

**Result**: Two agent definition files with YAML frontmatter (name, description), project context, coding conventions, and task schema sections.

---

### Prompt 2 — Build Full-Stack Task Manager

**Prompt**:

```
# Task:
- Build a full-stack Task Management System
- Backend:
  Backend REST API - Each task must have: id (UUID), title (1-200 chars),
  description (optional), status (todo|in-progress|done), priority (low|medium|high),
  createdAt, updatedAt.
  Business rules: Status workflow todo -> in-progress -> done (no skipping).
  Return 400 if title missing, 404 if not found, 422 for invalid status/priority.
  Persist to tasks.json.
- Frontend:
  Task list table, Add Task modal, Edit/Delete/Complete buttons,
  filter by status/priority, live search, color-coded badges,
  loading indicators and error toasts.
```

**Files generated / updated**: `backend/app.js`, `frontend/index.html`, `frontend/style.css`, `frontend/app.js`

**Result**: Complete working backend with 7 CRUD routes under `/api/tasks`, JSON file persistence, input validation, status workflow enforcement, and response envelope. Full frontend with task table, modal form, filters, search, badges, loading indicator, and toast notifications.

---

### Prompt 3 — Bug Fix: Tasks Not Displaying After Creation

**Prompt**:

```
I found a bug, when there is empty task list and user adds a task the task is
created but the new task list has not been fetched. Fix this.
```

**Files updated**: `frontend/app.js`

**Result**: Changed `createTask()` to call `loadTasks()` (re-fetch from server) instead of local push. Added `resetViewFilters()` to clear search/filter state before re-fetching so the new task is always visible.

---

### Prompt 4 — Create AGENTS.md

**Prompt**:

```
Create a root-level AGENTS.md that documents:
- Project architecture and chosen tech stack
- Backend and frontend coding standards
- API response envelope { "success": bool, "data": ... }
- Description of 3 sub-agents
- Patterns to follow and patterns to avoid
```

**Files generated**: `AGENTS.md`

**Result**: Comprehensive project specification file with architecture overview, coding standards, envelope rules, 3 sub-agent definitions (backend, frontend, explore), and pattern guidelines.

---

### Prompt 5 — Create copilot-instructions.md (Review Agent)

**Prompt**:

```
Create .github/copilot-instructions.md that instructs Copilot to review code for:
JSDoc, input validation, HTTP status codes, no empty catch blocks,
frontend loading states, and test coverage >80%
```

**Files generated**: `.github/copilot-instructions.md`

**Result**: Review agent configuration with 6 review criteria, expected output format (severity-ordered findings with file/line references), and project-specific expectations (envelope, workflow, status codes).

---

## 3. Sub-Agent Usage

### Ui-agent.agent.md usage :

1. Prompt :

```
Enhance the Task Manager app using modern UI/UX best practices and improved
design. Add sorting functionality based on name, priority, status, and
creation date. Include icons in action buttons for better usability. Also,
revise the "Complete" button, as it does not clearly reflect the task's next
state - update it to more accurately represent the intended action.
```

**Files updated**: `frontend/app.js`, `frontend/index.html`, `frontend/style.css`

**Result**:

- Added sort controls (by name, priority, status, created date) with ascending/descending order
- Added icon characters to Edit, Delete, and status-advance buttons
- Replaced generic "Complete" button with context-aware labels: "Move to In Progress", "Move to Done", "Done" (disabled)
- Complete CSS overhaul: Inter font, indigo palette, CSS custom properties, backdrop-blur modal with slide-up animation, tinted outline badges, gradient toasts

---

### @backend-agent

**Prompt**:

```
Fix all issues from the review: add JSDoc to all 7 helper functions,
enforce POST must create with status 'todo' (return 422 otherwise),
export app via module.exports for testing, wrap app.listen in require.main guard.
```

**Files updated**: `backend/app.js`

**Result**:

- Added `@param`/`@returns` JSDoc to `envelopeSuccess`, `envelopeError`, `ensureDataFile`, `readTasks`, `writeTasks`, `isTitleInvalid`, `canTransition`
- POST now rejects non-`todo` status with 422: "New tasks must start with status 'todo'"
- Wrapped `app.listen` in `require.main === module` guard
- Added `module.exports = app` for supertest testing

---

### @testing-agent

**Prompt**:

```
Use Playwright MCP to write end-to-end test cases. Run it in Agent Mode to
capture a screenshot of the running app and generate at least one E2E test
based on browser observation.

Automated Testing Requirements:
- Unit Tests: Minimum >80% coverage, including all CRUD operations,
  validation errors, and edge cases.
- E2E Tests: Must cover page load, adding a task, completing a task,
  deleting a task, and filtering by priority.
```

**Files generated**:

- `backend/__tests__/api.test.js` — 36 unit tests (Jest + supertest)
- `e2e/tasks.spec.js` — 9 E2E tests (Playwright)
- `playwright.config.js` — Playwright config with dual webServer
- `backend/babel.config.js` — Babel config for uuid ESM transform

**Result**:

- **36 backend unit tests** covering GET, POST, PUT, DELETE, validation errors (400/404/422), status workflow transitions, envelope shape, edge cases
- **Coverage**: 91.86% statements | 95.83% branches | 92.85% functions | 91.66% lines (all above 80% threshold)
- **9 E2E tests**: page load, empty state, add task, empty title error, status workflow (todo -> in-progress -> done), delete task, filter by priority, search, edit task
- All 45 tests pass

---

## 4. Review Agent

### Prompt

```
Review #file:app.js according to .github/copilot-instructions.md and list issues
```

### Issues Found

| #   | Rule                         | Status      | Detail                                     |
| --- | ---------------------------- | ----------- | ------------------------------------------ |
| 1   | JSDoc on public functions    | **FAIL**    | 7 functions missing JSDoc                  |
| 2   | Input validation on POST/PUT | **PARTIAL** | POST allows skipping workflow (any status) |
| 3   | Correct HTTP status codes    | **PASS**    | 400/404/422/500 used correctly             |
| 4   | No empty catch blocks        | **PASS**    | All catch blocks return error envelopes    |
| 5   | Frontend loading/error       | **N/A**     | Backend file only                          |
| 6   | Test coverage >80%           | **FAIL**    | 0% coverage, no tests exist                |
| -   | `/api` prefix                | **PASS**    | All routes under `/api`                    |
| -   | Response envelope            | **PASS**    | Consistent `{ success, data }` shape       |
| -   | Workflow enforcement         | **PARTIAL** | PUT enforced, POST not                     |

### Fixes Applied

| #   | Issue                   | Fix Applied                                                                            |
| --- | ----------------------- | -------------------------------------------------------------------------------------- |
| 1   | No JSDoc                | Added `@param`/`@returns` JSDoc to all 7 helper functions                              |
| 2   | POST accepts any status | POST now rejects non-`todo` status with 422: "New tasks must start with status 'todo'" |
| 3   | No tests / 0% coverage  | App exports via `module.exports = app`, listens only when run directly                 |
| 4   | App not testable        | Wrapped `app.listen` in `require.main === module` guard + added `module.exports = app` |
| 5   | Same-status no-op       | Kept as-is (allowed) — spec says no skipping; same-status transitions are valid        |

After fixes: all review rules pass. Test coverage raised to **91.86%** with 36 unit tests.

---

## 5. Skills

### Skill: `web-design-guidelines` (from vercel-labs/agent-skills)

**Installation**:

```bash
npx skills add vercel-labs/agent-skills
```

**Prompt used in Agent Mode**:

```
Review my UI according to Web Interface Guidelines - check accessibility,
design, and UX best practices.
```

**Changes applied**:

1. **Semantic HTML**: Ensured proper `<main>`, `<header>`, `<section>` elements, `role="dialog"` and `aria-modal="true"` on modal, `aria-label` on filter controls, `aria-live="polite"` on loading indicator, `aria-live="assertive"` on toast container
2. **Accessible controls**: All `<select>` and `<input>` elements have associated `<label>` elements and `aria-label` attributes for screen readers
3. **Keyboard support**: All interactive elements are native `<button>` and `<input>` elements (inherently keyboard-accessible), modal can be dismissed by clicking backdrop
4. **Responsive design**: CSS breakpoints at 860px and 640px; controls stack vertically on small screens; table wraps in scrollable container

**Skill file location**: `.github/skills/web-design-guidelines/`

---

## 6. Playwright MCP

### MCP Configuration

**File**: `.vscode/mcp.json`

```json
{
  "servers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--vision"]
    }
  }
}
```

### Screenshot Taken: Yes

**Prompt used**:

```
Use Playwright MCP to write end-to-end test cases. Run it in Agent Mode to
capture a screenshot of the running app and generate at least one E2E test
based on browser observation.
```

**Process**:

1. Started backend server on `http://localhost:3000` and frontend on `http://localhost:3001`
2. Playwright MCP navigated to `http://localhost:3001`
3. Captured DOM accessibility-tree snapshot — observed: Task Manager heading, "+ Add Task" button, search input, status/priority filters, sort controls, task table with Title/Priority/Status/Created/Actions columns, existing tasks with Edit/Delete/Done buttons, priority badges (medium/high), status badges (done)
4. Captured screenshot: `.playwright-mcp/page-2026-03-20T06-51-47-126Z.png`
5. Based on observed UI elements, generated E2E test cases targeting actual selectors (`#open-modal-btn`, `#task-modal`, `#task-title`, `#priority-filter`, `button[data-action="advance"]`, etc.)

### E2E Test File Generated: `e2e/tasks.spec.js`

**9 tests covering**:

| Test                         | What it verifies                                             |
| ---------------------------- | ------------------------------------------------------------ |
| Page Load (heading/controls) | H1, Add Task button, search, status/priority filters visible |
| Page Load (empty state)      | "No tasks" message when list is empty                        |
| Add Task                     | Modal opens, form fill, task appears in table with badges    |
| Add Task (empty title error) | Toast notification on validation failure                     |
| Complete Task (workflow)     | Advances todo -> in-progress -> done, button disables at end |
| Delete Task                  | Task removed from table, empty state shown                   |
| Filter by Priority           | High/Low filter shows correct subset, reset shows all        |
| Search                       | Live text filtering, clear restores all tasks                |
| Edit Task                    | Edit modal pre-fills values, title updates on save           |

**All 9 E2E tests pass.**
