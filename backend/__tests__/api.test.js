const request = require("supertest");
const fs = require("fs-extra");
const path = require("path");
const app = require("../app");

const DATA_FILE = path.join(__dirname, "..", "tasks.json");

beforeEach(async () => {
	await fs.writeJson(DATA_FILE, [], { spaces: 2 });
});

afterAll(async () => {
	await fs.writeJson(DATA_FILE, [], { spaces: 2 });
});

// --------------- Helper ---------------
async function createTask(overrides = {}) {
	const payload = { title: "Test Task", priority: "medium", ...overrides };
	const res = await request(app).post("/api/tasks").send(payload);
	return res;
}

// --------------- GET /api/tasks ---------------
describe("GET /api/tasks", () => {
	it("should return an empty array when no tasks exist", async () => {
		const res = await request(app).get("/api/tasks");
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ success: true, data: [] });
	});

	it("should return tasks after creation", async () => {
		await createTask({ title: "Task A" });
		await createTask({ title: "Task B" });
		const res = await request(app).get("/api/tasks");
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data).toHaveLength(2);
	});

	it("should return envelope shape with success and data", async () => {
		const res = await request(app).get("/api/tasks");
		expect(res.body).toHaveProperty("success");
		expect(res.body).toHaveProperty("data");
	});

	it("should filter tasks by status query param", async () => {
		await createTask({ title: "Todo Task" });
		const created = await createTask({ title: "Advance Task" });
		// Advance to in-progress
		await request(app).post(`/api/tasks/${created.body.data.id}/complete`);

		const res = await request(app).get("/api/tasks?status=todo");
		expect(res.status).toBe(200);
		expect(res.body.data).toHaveLength(1);
		expect(res.body.data[0].title).toBe("Todo Task");
	});

	it("should filter tasks by priority query param", async () => {
		await createTask({ title: "High Task", priority: "high" });
		await createTask({ title: "Low Task", priority: "low" });

		const res = await request(app).get("/api/tasks?priority=high");
		expect(res.status).toBe(200);
		expect(res.body.data).toHaveLength(1);
		expect(res.body.data[0].title).toBe("High Task");
	});

	it("should filter by both status and priority", async () => {
		await createTask({ title: "A", priority: "high" });
		await createTask({ title: "B", priority: "low" });

		const res = await request(app).get("/api/tasks?status=todo&priority=high");
		expect(res.status).toBe(200);
		expect(res.body.data).toHaveLength(1);
		expect(res.body.data[0].title).toBe("A");
	});

	it("should return 422 for invalid status filter", async () => {
		const res = await request(app).get("/api/tasks?status=invalid");
		expect(res.status).toBe(422);
		expect(res.body.success).toBe(false);
	});

	it("should return 422 for invalid priority filter", async () => {
		const res = await request(app).get("/api/tasks?priority=urgent");
		expect(res.status).toBe(422);
		expect(res.body.success).toBe(false);
	});
});

// --------------- GET /api/tasks/stats ---------------
describe("GET /api/tasks/stats", () => {
	it("should return zero counts when no tasks exist", async () => {
		const res = await request(app).get("/api/tasks/stats");
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data).toEqual({
			total: 0,
			byStatus: { todo: 0, "in-progress": 0, done: 0 },
			byPriority: { low: 0, medium: 0, high: 0 },
		});
	});

	it("should return correct counts after creating tasks", async () => {
		await createTask({ title: "A", priority: "high" });
		await createTask({ title: "B", priority: "low" });
		await createTask({ title: "C", priority: "high" });

		const res = await request(app).get("/api/tasks/stats");
		expect(res.body.data.total).toBe(3);
		expect(res.body.data.byStatus.todo).toBe(3);
		expect(res.body.data.byPriority.high).toBe(2);
		expect(res.body.data.byPriority.low).toBe(1);
	});
});

// --------------- GET /api/tasks/:id ---------------
describe("GET /api/tasks/:id", () => {
	it("should return a single task by ID", async () => {
		const created = await createTask({ title: "Find Me", priority: "high" });
		const id = created.body.data.id;

		const res = await request(app).get(`/api/tasks/${id}`);
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data).toMatchObject({ id, title: "Find Me", priority: "high" });
	});

	it("should return 404 for non-existent task", async () => {
		const res = await request(app).get("/api/tasks/nonexistent-id");
		expect(res.status).toBe(404);
		expect(res.body.success).toBe(false);
		expect(res.body.data.message).toMatch(/not found/i);
	});
});

// --------------- POST /api/tasks ---------------
describe("POST /api/tasks", () => {
	it("should create a task with valid data", async () => {
		const res = await createTask({ title: "New Task", priority: "high" });
		expect(res.status).toBe(201);
		expect(res.body.success).toBe(true);
		expect(res.body.data).toMatchObject({
			title: "New Task",
			priority: "high",
			status: "todo",
		});
		expect(res.body.data).toHaveProperty("id");
		expect(res.body.data).toHaveProperty("createdAt");
		expect(res.body.data).toHaveProperty("updatedAt");
	});

	it("should trim title whitespace", async () => {
		const res = await createTask({ title: "  Spaces  " });
		expect(res.body.data.title).toBe("Spaces");
	});

	it("should default status to 'todo' and priority to 'medium'", async () => {
		const res = await request(app).post("/api/tasks").send({ title: "Defaults" });
		expect(res.body.data.status).toBe("todo");
		expect(res.body.data.priority).toBe("medium");
	});

	it("should return 400 when title is missing", async () => {
		const res = await request(app).post("/api/tasks").send({});
		expect(res.status).toBe(400);
		expect(res.body.success).toBe(false);
		expect(res.body.data.message).toMatch(/title/i);
	});

	it("should return 400 when title is empty string", async () => {
		const res = await createTask({ title: "" });
		expect(res.status).toBe(400);
		expect(res.body.success).toBe(false);
	});

	it("should return 400 when title is only spaces", async () => {
		const res = await createTask({ title: "   " });
		expect(res.status).toBe(400);
		expect(res.body.success).toBe(false);
	});

	it("should return 400 when title exceeds 200 characters", async () => {
		const longTitle = "a".repeat(201);
		const res = await createTask({ title: longTitle });
		expect(res.status).toBe(400);
		expect(res.body.success).toBe(false);
	});

	it("should accept title of exactly 200 characters", async () => {
		const maxTitle = "a".repeat(200);
		const res = await createTask({ title: maxTitle });
		expect(res.status).toBe(201);
		expect(res.body.data.title).toBe(maxTitle);
	});

	it("should return 422 for invalid priority", async () => {
		const res = await createTask({ title: "Task", priority: "urgent" });
		expect(res.status).toBe(422);
		expect(res.body.success).toBe(false);
		expect(res.body.data.message).toMatch(/priority/i);
	});

	it("should return 422 when status is not 'todo'", async () => {
		const res = await createTask({ title: "Task", status: "done" });
		expect(res.status).toBe(422);
		expect(res.body.success).toBe(false);
		expect(res.body.data.message).toMatch(/todo/i);
	});

	it("should return 422 when status is 'in-progress'", async () => {
		const res = await createTask({ title: "Task", status: "in-progress" });
		expect(res.status).toBe(422);
		expect(res.body.success).toBe(false);
	});

	it("should handle non-string description gracefully", async () => {
		const res = await createTask({ title: "Task", description: 12345 });
		expect(res.status).toBe(201);
		// Backend coerces non-string to empty via typeof check
		expect(typeof res.body.data.description).toBe("string");
	});
});

// --------------- PUT /api/tasks/:id ---------------
describe("PUT /api/tasks/:id", () => {
	let taskId;

	beforeEach(async () => {
		const res = await createTask({ title: "Original" });
		taskId = res.body.data.id;
	});

	it("should update title", async () => {
		const res = await request(app).put(`/api/tasks/${taskId}`).send({ title: "Updated" });
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data.title).toBe("Updated");
	});

	it("should update description", async () => {
		const res = await request(app).put(`/api/tasks/${taskId}`).send({ description: "New desc" });
		expect(res.body.data.description).toBe("New desc");
	});

	it("should update priority", async () => {
		const res = await request(app).put(`/api/tasks/${taskId}`).send({ priority: "high" });
		expect(res.body.data.priority).toBe("high");
	});

	it("should update updatedAt timestamp", async () => {
		const before = new Date().toISOString();
		const res = await request(app).put(`/api/tasks/${taskId}`).send({ title: "Time check" });
		expect(new Date(res.body.data.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
	});

	it("should allow transition todo -> in-progress", async () => {
		const res = await request(app).put(`/api/tasks/${taskId}`).send({ status: "in-progress" });
		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("in-progress");
	});

	it("should allow transition in-progress -> done", async () => {
		await request(app).put(`/api/tasks/${taskId}`).send({ status: "in-progress" });
		const res = await request(app).put(`/api/tasks/${taskId}`).send({ status: "done" });
		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("done");
	});

	it("should reject skipping status: todo -> done", async () => {
		const res = await request(app).put(`/api/tasks/${taskId}`).send({ status: "done" });
		expect(res.status).toBe(422);
		expect(res.body.success).toBe(false);
		expect(res.body.data.message).toMatch(/transition/i);
	});

	it("should reject backward transition: in-progress -> todo", async () => {
		await request(app).put(`/api/tasks/${taskId}`).send({ status: "in-progress" });
		const res = await request(app).put(`/api/tasks/${taskId}`).send({ status: "todo" });
		expect(res.status).toBe(422);
		expect(res.body.success).toBe(false);
	});

	it("should allow same-status updates", async () => {
		const res = await request(app).put(`/api/tasks/${taskId}`).send({ status: "todo" });
		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("todo");
	});

	it("should return 404 for non-existent task", async () => {
		const res = await request(app).put("/api/tasks/nonexistent-id").send({ title: "X" });
		expect(res.status).toBe(404);
		expect(res.body.success).toBe(false);
		expect(res.body.data.message).toMatch(/not found/i);
	});

	it("should return 400 for invalid title (empty string)", async () => {
		const res = await request(app).put(`/api/tasks/${taskId}`).send({ title: "" });
		expect(res.status).toBe(400);
		expect(res.body.success).toBe(false);
	});

	it("should return 400 for title exceeding 200 chars", async () => {
		const res = await request(app).put(`/api/tasks/${taskId}`).send({ title: "x".repeat(201) });
		expect(res.status).toBe(400);
	});

	it("should return 422 for invalid status value", async () => {
		const res = await request(app).put(`/api/tasks/${taskId}`).send({ status: "cancelled" });
		expect(res.status).toBe(422);
		expect(res.body.success).toBe(false);
		expect(res.body.data.message).toMatch(/status/i);
	});

	it("should return 422 for invalid priority value", async () => {
		const res = await request(app).put(`/api/tasks/${taskId}`).send({ priority: "critical" });
		expect(res.status).toBe(422);
		expect(res.body.success).toBe(false);
		expect(res.body.data.message).toMatch(/priority/i);
	});
});

// --------------- DELETE /api/tasks/:id ---------------
describe("DELETE /api/tasks/:id", () => {
	it("should delete an existing task", async () => {
		const createRes = await createTask({ title: "To Delete" });
		const id = createRes.body.data.id;

		const res = await request(app).delete(`/api/tasks/${id}`);
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data.message).toMatch(/deleted/i);

		// Verify it's gone
		const listRes = await request(app).get("/api/tasks");
		expect(listRes.body.data).toHaveLength(0);
	});

	it("should return 404 for non-existent task", async () => {
		const res = await request(app).delete("/api/tasks/nonexistent-id");
		expect(res.status).toBe(404);
		expect(res.body.success).toBe(false);
		expect(res.body.data.message).toMatch(/not found/i);
	});
});

// --------------- POST /api/tasks/:id/complete ---------------
describe("POST /api/tasks/:id/complete", () => {
	let taskId;

	beforeEach(async () => {
		const res = await createTask({ title: "Complete Me" });
		taskId = res.body.data.id;
	});

	it("should advance todo -> in-progress", async () => {
		const res = await request(app).post(`/api/tasks/${taskId}/complete`);
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data.status).toBe("in-progress");
	});

	it("should advance in-progress -> done", async () => {
		await request(app).post(`/api/tasks/${taskId}/complete`);
		const res = await request(app).post(`/api/tasks/${taskId}/complete`);
		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("done");
	});

	it("should return 422 when task is already done", async () => {
		await request(app).post(`/api/tasks/${taskId}/complete`);
		await request(app).post(`/api/tasks/${taskId}/complete`);
		const res = await request(app).post(`/api/tasks/${taskId}/complete`);
		expect(res.status).toBe(422);
		expect(res.body.success).toBe(false);
		expect(res.body.data.message).toMatch(/already completed/i);
	});

	it("should update updatedAt on completion", async () => {
		const before = new Date().toISOString();
		const res = await request(app).post(`/api/tasks/${taskId}/complete`);
		expect(new Date(res.body.data.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
	});

	it("should return 404 for non-existent task", async () => {
		const res = await request(app).post("/api/tasks/nonexistent-id/complete");
		expect(res.status).toBe(404);
		expect(res.body.success).toBe(false);
	});
});

// --------------- Envelope Shape ---------------
describe("Response Envelope", () => {
	it("success response has { success: true, data: ... }", async () => {
		const res = await request(app).get("/api/tasks");
		expect(res.body).toHaveProperty("success", true);
		expect(res.body).toHaveProperty("data");
	});

	it("error response has { success: false, data: { message: ... } }", async () => {
		const res = await request(app).post("/api/tasks").send({});
		expect(res.body).toHaveProperty("success", false);
		expect(res.body.data).toHaveProperty("message");
		expect(typeof res.body.data.message).toBe("string");
	});
});

// --------------- Edge Cases ---------------
describe("Edge Cases", () => {
	it("should handle multiple sequential task creation", async () => {
		for (let i = 0; i < 5; i++) {
			const res = await createTask({ title: `Sequential ${i}` });
			expect(res.status).toBe(201);
		}

		const listRes = await request(app).get("/api/tasks");
		expect(listRes.body.data).toHaveLength(5);
	});

	it("should generate unique IDs for each task", async () => {
		await createTask({ title: "A" });
		await createTask({ title: "B" });
		const res = await request(app).get("/api/tasks");
		const ids = res.body.data.map((t) => t.id);
		expect(new Set(ids).size).toBe(2);
	});

	it("all endpoints start with /api", async () => {
		// Verify that a non-/api path returns 404 (Express default)
		const res = await request(app).get("/tasks");
		expect(res.status).toBe(404);
	});
});
