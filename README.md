# Task Manager — Full-Stack Application

A two-tier task management application built with a **Node.js/Express REST API** backend and a **vanilla HTML/CSS/JS** frontend. Designed as a GitHub Copilot developer assignment showcasing custom agents, MCP integration, and automated testing.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Running the Application](#running-the-application)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [API Reference](#api-reference)
- [Business Rules](#business-rules)
- [Testing](#testing)
  - [Unit Tests (Jest)](#unit-tests-jest)
  - [E2E Tests (Playwright)](#e2e-tests-playwright)
  - [Run All Tests](#run-all-tests)
- [GitHub Copilot Agents](#github-copilot-agents)
  - [Backend Agent](#backend-agent)
  - [Frontend Agent](#frontend-agent)
  - [Testing Agent](#testing-agent)
  - [Explore Agent](#explore-agent)
- [Copilot Review Instructions](#copilot-review-instructions)
- [Copilot Skills](#copilot-skills)
- [MCP (Model Context Protocol) Setup](#mcp-model-context-protocol-setup)
- [AGENTS.md](#agentsmd)

---

## Project Structure

```
├── AGENTS.md                        # Root-level project spec for Copilot
├── COPILOT-LOG.md                   # Log of Copilot usage during development
├── package.json                     # Root scripts (test:unit, test:e2e)
├── playwright.config.js             # Playwright E2E config
│
├── backend/
│   ├── app.js                       # Express REST API (all routes + helpers)
│   ├── tasks.json                   # File-based task persistence
│   ├── package.json                 # Backend deps + Jest config
│   ├── babel.config.js              # Babel config for Jest (uuid ESM transform)
│   └── __tests__/
│       └── api.test.js              # 36 unit/integration tests
│
├── frontend/
│   ├── index.html                   # Page structure, modal, filters
│   ├── style.css                    # Full CSS (Inter font, indigo palette)
│   ├── app.js                       # Client-side logic (fetch, render, state)
│   └── package.json                 # Frontend deps (serve)
│
├── e2e/
│   └── tasks.spec.js                # 9 Playwright E2E tests
│
├── .github/
│   ├── copilot-instructions.md      # Copilot review instructions
│   ├── agents/
│   │   ├── backend-agent.agent.md   # Backend agent definition
│   │   ├── ui-agent.agent.md        # Frontend agent definition
│   │   ├── testing-agent.agent.md   # Testing agent definition
│   │   └── agents.md                # Shared project spec for agents
│   └── skills/
│       └── web-design-guidelines/   # Web design review skill
│
└── .vscode/
    └── mcp.json                     # MCP server configuration (Playwright)
```

---

## Tech Stack

| Layer    | Technology                                |
| -------- | ----------------------------------------- |
| Backend  | Node.js, Express 5, CommonJS              |
| Frontend | Vanilla HTML5, CSS3, ES6+ JavaScript      |
| Storage  | JSON file on disk (`tasks.json`)          |
| Testing  | Jest + supertest (unit), Playwright (E2E) |
| Font     | Inter (Google Fonts)                      |
| MCP      | Playwright MCP (`@playwright/mcp`)        |

---

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- A modern browser (Chrome, Firefox, Edge)

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone git@github.com:kevit-siddharth-singh/gitHub-copilot-developer-assignment.git
cd gitHub-copilot-developer-assignment
```

### 2. Install root dependencies (Playwright)

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 5. Install Playwright browsers (for E2E tests)

```bash
npx playwright install chromium
```

---

## Running the Application

### Backend

The Express API runs on **port 3000** by default.

```bash
cd backend
npm run dev        # Uses nodemon for hot-reload
# OR
node app.js        # One-shot start
```

Verify it's running:

```bash
curl http://localhost:3000/api/tasks
# → {"success":true,"data":[]}
```

### Frontend

The static frontend is served on **port 3001** (or any available port via `serve`).

```bash
cd frontend
npm run dev        # Runs: npx serve .
```

Then open [http://localhost:3000](http://localhost:3000) (or whichever port `serve` assigns) in your browser.

> **Note**: Both backend and frontend must be running simultaneously. The frontend calls `http://localhost:3000/api/tasks` for all API operations.

---

## API Reference

All endpoints use the response envelope:

```json
{ "success": true, "data": { ... } }     // Success
{ "success": false, "data": { "message": "..." } }  // Error
```

| Method   | Endpoint         | Description       | Status Codes            |
| -------- | ---------------- | ----------------- | ----------------------- |
| `GET`    | `/api/tasks`     | List all tasks    | 200, 500                |
| `POST`   | `/api/tasks`     | Create a new task | 201, 400, 422, 500      |
| `PUT`    | `/api/tasks/:id` | Update a task     | 200, 400, 404, 422, 500 |
| `DELETE` | `/api/tasks/:id` | Delete a task     | 200, 404, 500           |

### Task Schema

| Field         | Type     | Required | Notes                                 |
| ------------- | -------- | -------- | ------------------------------------- |
| `id`          | UUID     | Auto     | Generated on creation                 |
| `title`       | string   | Yes      | 1–200 characters                      |
| `description` | string   | No       | Free text                             |
| `status`      | enum     | Auto     | `todo` \| `in-progress` \| `done`     |
| `priority`    | enum     | No       | `low` \| `medium` (default) \| `high` |
| `createdAt`   | ISO date | Auto     | Set on creation                       |
| `updatedAt`   | ISO date | Auto     | Updated on every mutation             |

---

## Business Rules

- **Status workflow is strict**: `todo` → `in-progress` → `done` (no skipping, no going backward).
- **New tasks** must start with status `todo` (server enforces this with 422).
- **Title validation**: missing or invalid title returns `400`.
- **Invalid enum values** for status or priority return `422`.
- **Task not found** returns `404`.

---

## Testing

### Unit Tests (Jest)

36 tests covering all CRUD operations, validation, status workflow, envelope shape, and edge cases.

```bash
cd backend
npm test
```

**Coverage thresholds** (enforced in `backend/package.json`):

| Metric     | Threshold | Actual |
| ---------- | --------- | ------ |
| Statements | 80%       | 91.86% |
| Branches   | 80%       | 95.83% |
| Functions  | 80%       | 92.85% |
| Lines      | 80%       | 91.66% |

### E2E Tests (Playwright)

9 browser-based tests covering:

| Test                         | What it verifies                                      |
| ---------------------------- | ----------------------------------------------------- |
| Page Load (heading/controls) | H1, Add Task button, search, filters visible          |
| Page Load (empty state)      | "No tasks" message when list is empty                 |
| Add Task                     | Modal opens, form fill, task appears in table         |
| Add Task (empty title error) | Toast notification on validation failure              |
| Complete Task (workflow)     | Advances `todo → in-progress → done`, button disables |
| Delete Task                  | Task removed, empty state shown                       |
| Filter by Priority           | High/Low filter shows correct tasks, reset shows all  |
| Search                       | Live text filtering, clear restores all               |
| Edit Task                    | Edit modal pre-fills, title updates on save           |

```bash
# From project root
npx playwright test
```

### Run All Tests

```bash
# From project root — runs unit tests then E2E tests
npm test
```

---

## GitHub Copilot Agents

Custom agents are defined in `.github/agents/` and appear in VS Code's Copilot chat as selectable modes.

### Backend Agent

**File**: `.github/agents/backend-agent.agent.md`

- **Purpose**: Implements and maintains Express REST APIs
- **Scope**: Route design under `/api`, validation, file persistence, status codes, envelope compliance
- **Invocable in chat**: Select "backend agent" mode

### Frontend Agent

**File**: `.github/agents/ui-agent.agent.md`

- **Purpose**: Builds and maintains the vanilla JS user interface
- **Scope**: Table rendering, modal/form, filters, search, badges, loading indicators, toast notifications
- **Invocable in chat**: Select "frontend agent" mode

### Testing Agent

**File**: `.github/agents/testing-agent.agent.md`

- **Purpose**: Testing specialist for unit, integration, and E2E tests
- **Scope**: Jest setup, supertest API tests, Playwright E2E, coverage thresholds
- **Invocable in chat**: Select "testing agent" mode

### Explore Agent

- **Purpose**: Read-only codebase exploration and Q&A
- **Built-in**: Available as a subagent, no custom file needed

### How Agents Work

1. Each `.agent.md` file has a YAML frontmatter with `name` and `description`.
2. The description tells Copilot **when** to invoke the agent.
3. The markdown body gives the agent its persona, project context, and rules.
4. Agents can be selected from the Copilot chat mode picker in VS Code.

---

## Copilot Review Instructions

**File**: `.github/copilot-instructions.md`

When you ask Copilot to "review my code", it applies these criteria:

1. **JSDoc/Docstrings** on all public functions
2. **Input validation** on every POST/PUT route
3. **Correct HTTP status codes** (400, 404, 422, 500)
4. **No empty catch blocks**
5. **Frontend loading states** and error handling
6. **Test coverage** > 80%

Findings are returned ordered by severity with file references and fix recommendations.

---

## Copilot Skills

Skills are reusable knowledge packages in `.github/skills/`.

### Web Design Guidelines

**Directory**: `.github/skills/web-design-guidelines/`

- Activated when you ask Copilot to "review my UI", "check accessibility", or "audit design".
- Reviews code against Vercel's Web Interface Guidelines for accessibility, layout, and UX.

---

## MCP (Model Context Protocol) Setup

MCP servers extend Copilot with tool-calling capabilities. This project uses **Playwright MCP** for browser automation in agent mode.

### Configuration

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

### What it enables

- **Browser navigation**: Copilot can open URLs and inspect page structure
- **Screenshots**: Capture the running app's visual state from within agent mode
- **DOM snapshots**: Get accessibility-tree snapshots for verifying UI elements
- **Click/Fill/Select**: Interact with forms and buttons programmatically
- **Vision mode**: `--vision` flag enables screenshot-based observation

### How it was used

1. Started both backend (port 3000) and frontend (port 3001) servers.
2. Used Playwright MCP to navigate to `http://localhost:3001`.
3. Captured a screenshot of the running Task Manager app.
4. Observed the DOM snapshot (table, badges, buttons, filters).
5. Generated E2E test cases based on what was visible in the browser.

### Prerequisites for MCP

- VS Code with GitHub Copilot extension
- The `.vscode/mcp.json` file (already included in the repo)
- Playwright browsers installed: `npx playwright install chromium`

---

## AGENTS.md

The root-level `AGENTS.md` serves as the **canonical project specification** that all agents reference. It documents:

- Project architecture and tech stack
- Core data model and business rules
- Backend and frontend coding standards
- API response envelope shape and rules
- Sub-agent definitions and their responsibilities
- Patterns to follow and patterns to avoid

This file is automatically read by Copilot when working in agent mode, giving every agent shared context about the project.

---

## License

ISC
