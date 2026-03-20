const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "tasks.json");

const VALID_STATUS = ["todo", "in-progress", "done"];
const VALID_PRIORITY = ["low", "medium", "high"];

app.use(cors());
app.use(express.json());

/**
 * Wrap payload in a success response envelope.
 * @param {*} data - The response payload.
 * @returns {{ success: true, data: * }}
 */
function envelopeSuccess(data) {
	return { success: true, data };
}

/**
 * Wrap an error message in a failure response envelope.
 * @param {string} message - Human-readable error description.
 * @returns {{ success: false, data: { message: string } }}
 */
function envelopeError(message) {
	return { success: false, data: { message } };
}

/**
 * Ensure the tasks JSON data file exists and contains a valid array.
 * Creates the file with an empty array if missing or empty.
 * @returns {Promise<void>}
 */
async function ensureDataFile() {
	await fs.ensureFile(DATA_FILE);
	const fileText = await fs.readFile(DATA_FILE, "utf8");
	if (!fileText.trim()) {
		await fs.writeJson(DATA_FILE, [], { spaces: 2 });
	}
}

/**
 * Read all tasks from the JSON data file.
 * @returns {Promise<Array<object>>} Array of task objects.
 */
async function readTasks() {
	await ensureDataFile();
	return fs.readJson(DATA_FILE);
}

/**
 * Persist the full tasks array to the JSON data file.
 * @param {Array<object>} tasks - The complete task list to write.
 * @returns {Promise<void>}
 */
async function writeTasks(tasks) {
	await fs.writeJson(DATA_FILE, tasks, { spaces: 2 });
}

/**
 * Check whether a title value is missing or outside the 1-200 char range.
 * @param {*} title - The title value to validate.
 * @returns {boolean} True if the title is invalid.
 */
function isTitleInvalid(title) {
	return typeof title !== "string" || title.trim().length < 1 || title.trim().length > 200;
}

/**
 * Determine whether a status transition is valid.
 * Allowed transitions: same status, or one step forward (todo->in-progress->done).
 * @param {string} currentStatus - The task's current status.
 * @param {string} nextStatus - The requested new status.
 * @returns {boolean} True if the transition is allowed.
 */
function canTransition(currentStatus, nextStatus) {
	const currentIndex = VALID_STATUS.indexOf(currentStatus);
	const nextIndex = VALID_STATUS.indexOf(nextStatus);
	return nextIndex >= currentIndex && nextIndex - currentIndex <= 1;
}

/**
 * GET /api/tasks - List all tasks with optional server-side filtering.
 * Supports ?status= and ?priority= query parameters.
 */
app.get("/api/tasks", async (req, res) => {
	try {
		let tasks = await readTasks();

		const { status, priority } = req.query;
		if (status && VALID_STATUS.includes(status)) {
			tasks = tasks.filter((t) => t.status === status);
		} else if (status) {
			return res.status(422).json(envelopeError("Invalid status filter"));
		}
		if (priority && VALID_PRIORITY.includes(priority)) {
			tasks = tasks.filter((t) => t.priority === priority);
		} else if (priority) {
			return res.status(422).json(envelopeError("Invalid priority filter"));
		}

		res.json(envelopeSuccess(tasks));
	} catch (error) {
		res.status(500).json(envelopeError("Failed to read tasks"));
	}
});

/**
 * GET /api/tasks/stats - Return task counts grouped by status and priority.
 */
app.get("/api/tasks/stats", async (_req, res) => {
	try {
		const tasks = await readTasks();
		const byStatus = {};
		const byPriority = {};

		VALID_STATUS.forEach((s) => (byStatus[s] = 0));
		VALID_PRIORITY.forEach((p) => (byPriority[p] = 0));

		tasks.forEach((t) => {
			if (byStatus[t.status] !== undefined) byStatus[t.status]++;
			if (byPriority[t.priority] !== undefined) byPriority[t.priority]++;
		});

		res.json(envelopeSuccess({ total: tasks.length, byStatus, byPriority }));
	} catch (error) {
		res.status(500).json(envelopeError("Failed to get stats"));
	}
});

/**
 * GET /api/tasks/:id - Get a single task by ID.
 */
app.get("/api/tasks/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const tasks = await readTasks();
		const task = tasks.find((t) => t.id === id);

		if (!task) {
			return res.status(404).json(envelopeError("Task not found"));
		}

		res.json(envelopeSuccess(task));
	} catch (error) {
		res.status(500).json(envelopeError("Failed to get task"));
	}
});

app.post("/api/tasks", async (req, res) => {
	try {
		const { title, description = "", status = "todo", priority = "medium" } = req.body;

		if (isTitleInvalid(title)) {
			return res.status(400).json(envelopeError("Title is required and must be 1-200 characters"));
		}

		if (!VALID_PRIORITY.includes(priority)) {
			return res.status(422).json(envelopeError("Invalid priority"));
		}

		if (status !== "todo") {
			return res.status(422).json(envelopeError("New tasks must start with status 'todo'"));
		}

		const now = new Date().toISOString();
		const newTask = {
			id: uuidv4(),
			title: title.trim(),
			description: typeof description === "string" ? description.trim() : "",
			status,
			priority,
			createdAt: now,
			updatedAt: now,
		};

		const tasks = await readTasks();
		tasks.push(newTask);
		await writeTasks(tasks);

		return res.status(201).json(envelopeSuccess(newTask));
	} catch (error) {
		return res.status(500).json(envelopeError("Failed to create task"));
	}
});

app.put("/api/tasks/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { title, description, status, priority } = req.body;
		const tasks = await readTasks();
		const taskIndex = tasks.findIndex((task) => task.id === id);

		if (taskIndex === -1) {
			return res.status(404).json(envelopeError("Task not found"));
		}

		const currentTask = tasks[taskIndex];

		if (title !== undefined && isTitleInvalid(title)) {
			return res.status(400).json(envelopeError("Title is required and must be 1-200 characters"));
		}

		if (status !== undefined && !VALID_STATUS.includes(status)) {
			return res.status(422).json(envelopeError("Invalid status"));
		}

		if (priority !== undefined && !VALID_PRIORITY.includes(priority)) {
			return res.status(422).json(envelopeError("Invalid priority"));
		}

		const nextStatus = status ?? currentTask.status;
		if (!canTransition(currentTask.status, nextStatus)) {
			return res.status(422).json(envelopeError("Invalid status transition"));
		}

		const updatedTask = {
			...currentTask,
			title: title !== undefined ? title.trim() : currentTask.title,
			description: description !== undefined ? String(description).trim() : currentTask.description,
			status: nextStatus,
			priority: priority ?? currentTask.priority,
			updatedAt: new Date().toISOString(),
		};

		tasks[taskIndex] = updatedTask;
		await writeTasks(tasks);

		return res.json(envelopeSuccess(updatedTask));
	} catch (error) {
		return res.status(500).json(envelopeError("Failed to update task"));
	}
});

app.delete("/api/tasks/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const tasks = await readTasks();
		const taskIndex = tasks.findIndex((task) => task.id === id);

		if (taskIndex === -1) {
			return res.status(404).json(envelopeError("Task not found"));
		}

		tasks.splice(taskIndex, 1);
		await writeTasks(tasks);

		return res.json(envelopeSuccess({ message: "Task deleted" }));
	} catch (error) {
		return res.status(500).json(envelopeError("Failed to delete task"));
	}
});

/**
 * POST /api/tasks/:id/complete - Mark a task as done.
 * Enforces the status workflow: advances one step at a time to 'done'.
 */
app.post("/api/tasks/:id/complete", async (req, res) => {
	try {
		const { id } = req.params;
		const tasks = await readTasks();
		const taskIndex = tasks.findIndex((task) => task.id === id);

		if (taskIndex === -1) {
			return res.status(404).json(envelopeError("Task not found"));
		}

		const currentTask = tasks[taskIndex];

		if (currentTask.status === "done") {
			return res.status(422).json(envelopeError("Task is already completed"));
		}

		// Advance one step: todo -> in-progress, in-progress -> done
		const nextStatus = currentTask.status === "todo" ? "in-progress" : "done";

		const updatedTask = {
			...currentTask,
			status: nextStatus,
			updatedAt: new Date().toISOString(),
		};

		tasks[taskIndex] = updatedTask;
		await writeTasks(tasks);

		return res.json(envelopeSuccess(updatedTask));
	} catch (error) {
		return res.status(500).json(envelopeError("Failed to complete task"));
	}
});

/* Start server only when run directly (not imported for testing) */
if (require.main === module) {
	app.listen(PORT, () => {
		console.log(`Task API running on http://localhost:${PORT}`);
	});
}

module.exports = app;
