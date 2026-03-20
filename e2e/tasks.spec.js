const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const TASKS_FILE = path.join(__dirname, "..", "backend", "tasks.json");

// Reset tasks.json to a clean state before each test
test.beforeEach(async () => {
	fs.writeFileSync(TASKS_FILE, JSON.stringify([], null, 2));
});

test.afterAll(async () => {
	fs.writeFileSync(TASKS_FILE, JSON.stringify([], null, 2));
});

test.describe("Page Load", () => {
	test("should display the Task Manager heading and controls", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("h1")).toHaveText("Task Manager");
		await expect(page.locator("#open-modal-btn")).toBeVisible();
		await expect(page.locator("#search-input")).toBeVisible();
		await expect(page.locator("#status-filter")).toBeVisible();
		await expect(page.locator("#priority-filter")).toBeVisible();
	});

	test("should show empty state when no tasks exist", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#empty-state")).toBeVisible();
	});
});

test.describe("Adding a Task", () => {
	test("should open modal, fill form, and create a task", async ({ page }) => {
		await page.goto("/");

		// Open modal
		await page.click("#open-modal-btn");
		await expect(page.locator("#task-modal")).not.toHaveClass(/hidden/);
		await expect(page.locator("#modal-title")).toHaveText("Add Task");

		// Fill form
		await page.fill("#task-title", "E2E Test Task");
		await page.fill("#task-description", "Created by Playwright");
		await page.selectOption("#task-priority", "high");

		// Submit
		await page.click('#task-form button[type="submit"]');

		// Verify task appears in the table
		await expect(page.locator("#task-table-body tr")).toHaveCount(1);
		await expect(page.locator("#task-table-body tr").first().locator(".task-title")).toHaveText("E2E Test Task");
		await expect(page.locator("#task-table-body tr").first().locator(".priority-high")).toHaveText("high");
		await expect(page.locator("#task-table-body tr").first().locator(".status-todo")).toHaveText("todo");

		// Modal should be closed
		await expect(page.locator("#task-modal")).toHaveClass(/hidden/);
	});

	test("should show error toast when title is empty", async ({ page }) => {
		await page.goto("/");
		await page.click("#open-modal-btn");

		// Clear the title and try to submit — HTML5 required prevents submit,
		// so we bypass by removing the required attribute
		await page.$eval("#task-title", (el) => el.removeAttribute("required"));
		await page.fill("#task-title", "");
		await page.click('#task-form button[type="submit"]');

		// Should show a toast
		await expect(page.locator(".toast")).toBeVisible({ timeout: 3000 });
	});
});

test.describe("Completing a Task (Status Workflow)", () => {
	test("should advance task from todo -> in-progress -> done", async ({ page }) => {
		await page.goto("/");

		// Create a task first
		await page.click("#open-modal-btn");
		await page.fill("#task-title", "Workflow Task");
		await page.click('#task-form button[type="submit"]');
		await expect(page.locator("#task-table-body tr")).toHaveCount(1);

		// Task should be "todo" initially
		await expect(page.locator("#task-table-body .status-todo")).toHaveText("todo");

		// Click "Move to In Progress"
		await page.click('button[data-action="advance"]');
		await expect(page.locator("#task-table-body .status-in-progress")).toBeVisible();

		// Click "Move to Done"
		await page.click('button[data-action="advance"]');
		await expect(page.locator("#task-table-body .status-done")).toBeVisible();

		// "Done" button should now be disabled
		await expect(page.locator('button[data-action="advance"]')).toBeDisabled();
	});
});

test.describe("Deleting a Task", () => {
	test("should delete a task and show empty state", async ({ page }) => {
		await page.goto("/");

		// Create a task
		await page.click("#open-modal-btn");
		await page.fill("#task-title", "Task To Delete");
		await page.click('#task-form button[type="submit"]');
		await expect(page.locator("#task-table-body tr")).toHaveCount(1);

		// Delete it
		await page.click('button[data-action="delete"]');

		// Table should be empty
		await expect(page.locator("#task-table-body tr")).toHaveCount(0);
		await expect(page.locator("#empty-state")).toBeVisible();
	});
});

test.describe("Filtering by Priority", () => {
	test("should filter tasks by priority", async ({ page }) => {
		await page.goto("/");

		// Create a high priority task
		await page.click("#open-modal-btn");
		await page.fill("#task-title", "High Priority Task");
		await page.selectOption("#task-priority", "high");
		await page.click('#task-form button[type="submit"]');
		await expect(page.locator("#task-table-body tr")).toHaveCount(1);

		// Create a low priority task
		await page.click("#open-modal-btn");
		await page.fill("#task-title", "Low Priority Task");
		await page.selectOption("#task-priority", "low");
		await page.click('#task-form button[type="submit"]');
		await expect(page.locator("#task-table-body tr")).toHaveCount(2);

		// Filter by high priority
		await page.selectOption("#priority-filter", "high");
		await expect(page.locator("#task-table-body tr")).toHaveCount(1);
		await expect(page.locator("#task-table-body .task-title")).toHaveText("High Priority Task");

		// Filter by low priority
		await page.selectOption("#priority-filter", "low");
		await expect(page.locator("#task-table-body tr")).toHaveCount(1);
		await expect(page.locator("#task-table-body .task-title")).toHaveText("Low Priority Task");

		// Reset filter — show all
		await page.selectOption("#priority-filter", "all");
		await expect(page.locator("#task-table-body tr")).toHaveCount(2);
	});
});

test.describe("Search", () => {
	test("should filter tasks by search text", async ({ page }) => {
		await page.goto("/");

		// Create two tasks
		await page.click("#open-modal-btn");
		await page.fill("#task-title", "Alpha Task");
		await page.click('#task-form button[type="submit"]');
		await expect(page.locator("#task-table-body tr")).toHaveCount(1);

		await page.click("#open-modal-btn");
		await page.fill("#task-title", "Beta Task");
		await page.click('#task-form button[type="submit"]');
		await expect(page.locator("#task-table-body tr")).toHaveCount(2);

		// Search for "Alpha"
		await page.fill("#search-input", "Alpha");
		await expect(page.locator("#task-table-body tr")).toHaveCount(1);
		await expect(page.locator("#task-table-body .task-title")).toHaveText("Alpha Task");

		// Clear search
		await page.fill("#search-input", "");
		await expect(page.locator("#task-table-body tr")).toHaveCount(2);
	});
});

test.describe("Edit Task", () => {
	test("should edit a task title via the modal", async ({ page }) => {
		await page.goto("/");

		// Create a task
		await page.click("#open-modal-btn");
		await page.fill("#task-title", "Original Title");
		await page.click('#task-form button[type="submit"]');
		await expect(page.locator("#task-table-body tr")).toHaveCount(1);

		// Click Edit
		await page.click('button[data-action="edit"]');
		await expect(page.locator("#task-modal")).not.toHaveClass(/hidden/);
		await expect(page.locator("#modal-title")).toHaveText("Edit Task");

		// Change title
		await page.fill("#task-title", "Updated Title");
		await page.click('#task-form button[type="submit"]');

		// Verify updated title
		await expect(page.locator("#task-table-body .task-title")).toHaveText("Updated Title");
	});
});
