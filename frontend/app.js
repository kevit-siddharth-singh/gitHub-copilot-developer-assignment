const API_BASE = "http://localhost:3000/api/tasks";

const state = {
	tasks: [],
	search: "",
	statusFilter: "all",
	priorityFilter: "all",
	sortBy: "createdAt",
	sortOrder: "desc",
	loading: false,
	editingTaskId: null,
};

const refs = {
	body: document.getElementById("task-table-body"),
	emptyState: document.getElementById("empty-state"),
	loading: document.getElementById("loading-indicator"),
	modal: document.getElementById("task-modal"),
	modalTitle: document.getElementById("modal-title"),
	taskForm: document.getElementById("task-form"),
	titleInput: document.getElementById("task-title"),
	descriptionInput: document.getElementById("task-description"),
	priorityInput: document.getElementById("task-priority"),
	statusInput: document.getElementById("task-status"),
	searchInput: document.getElementById("search-input"),
	statusFilter: document.getElementById("status-filter"),
	priorityFilter: document.getElementById("priority-filter"),
	sortBy: document.getElementById("sort-by"),
	sortOrder: document.getElementById("sort-order"),
	openModalBtn: document.getElementById("open-modal-btn"),
	cancelModalBtn: document.getElementById("cancel-modal-btn"),
	toastContainer: document.getElementById("toast-container"),
};

const priorityRank = {
	high: 3,
	medium: 2,
	low: 1,
};

const statusRank = {
	todo: 1,
	"in-progress": 2,
	done: 3,
};

function setLoading(isLoading) {
	state.loading = isLoading;
	refs.loading.classList.toggle("hidden", !isLoading);
}

function showToast(message, variant = "error") {
	const toast = document.createElement("div");
	toast.className = `toast toast-${variant}`;
	toast.textContent = message;
	refs.toastContainer.appendChild(toast);
	setTimeout(() => toast.remove(), 2600);
}

async function fetchApi(url, options = {}) {
	const response = await fetch(url, {
		headers: { "Content-Type": "application/json" },
		...options,
	});

	let payload;
	try {
		payload = await response.json();
	} catch (error) {
		throw new Error("Invalid server response");
	}

	if (!response.ok || !payload.success) {
		const message = payload?.data?.message || "Something went wrong";
		throw new Error(message);
	}

	return payload.data;
}

function escapeHtml(value) {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function getFilteredTasks() {
	return state.tasks.filter((task) => {
		const searchMatch =
			task.title.toLowerCase().includes(state.search) ||
			(task.description || "").toLowerCase().includes(state.search);
		const statusMatch = state.statusFilter === "all" || task.status === state.statusFilter;
		const priorityMatch = state.priorityFilter === "all" || task.priority === state.priorityFilter;
		return searchMatch && statusMatch && priorityMatch;
	});
}

function sortTasks(tasks) {
	const direction = state.sortOrder === "asc" ? 1 : -1;

	return [...tasks].sort((a, b) => {
		if (state.sortBy === "title") {
			return a.title.localeCompare(b.title) * direction;
		}

		if (state.sortBy === "priority") {
			return (priorityRank[a.priority] - priorityRank[b.priority]) * direction;
		}

		if (state.sortBy === "status") {
			return (statusRank[a.status] - statusRank[b.status]) * direction;
		}

		const aTime = new Date(a.createdAt).getTime();
		const bTime = new Date(b.createdAt).getTime();
		return (aTime - bTime) * direction;
	});
}

function formatDate(isoDate) {
	return new Date(isoDate).toLocaleString();
}

function getNextStatus(status) {
	if (status === "todo") return "in-progress";
	if (status === "in-progress") return "done";
	return "done";
}

function getAdvanceMeta(status) {
	if (status === "todo") {
		return {
			nextStatus: "in-progress",
			label: "Move to In Progress",
			icon: "&#9654;",
			className: "btn-warning",
			disabled: false,
		};
	}

	if (status === "in-progress") {
		return {
			nextStatus: "done",
			label: "Move to Done",
			icon: "&#10003;",
			className: "btn-success",
			disabled: false,
		};
	}

	return {
		nextStatus: "done",
		label: "Done",
		icon: "&#10003;",
		className: "btn-success",
		disabled: true,
	};
}

function renderTasks() {
	const filteredTasks = sortTasks(getFilteredTasks());
	refs.body.innerHTML = "";

	if (!filteredTasks.length) {
		refs.emptyState.classList.remove("hidden");
		return;
	}

	refs.emptyState.classList.add("hidden");

	filteredTasks.forEach((task) => {
		const row = document.createElement("tr");
		const advanceMeta = getAdvanceMeta(task.status);

		row.innerHTML = `
			<td>
				<span class="task-title">${escapeHtml(task.title)}</span>
				<span class="task-description">${escapeHtml(task.description || "")}</span>
			</td>
			<td><span class="badge priority-${task.priority}">${escapeHtml(task.priority)}</span></td>
			<td><span class="badge status-${task.status}">${escapeHtml(task.status)}</span></td>
			<td>${formatDate(task.createdAt)}</td>
			<td>
				<div class="row-actions">
					<button class="btn btn-ghost" data-action="edit" data-id="${task.id}" type="button"><span class="btn-icon" aria-hidden="true">&#9998;</span><span>Edit</span></button>
					<button class="btn btn-danger" data-action="delete" data-id="${task.id}" type="button"><span class="btn-icon" aria-hidden="true">&#128465;</span><span>Delete</span></button>
					<button class="btn ${advanceMeta.className}" data-action="advance" data-id="${task.id}" data-next-status="${advanceMeta.nextStatus}" type="button" ${advanceMeta.disabled ? "disabled" : ""}><span class="btn-icon" aria-hidden="true">${advanceMeta.icon}</span><span>${advanceMeta.label}</span></button>
				</div>
			</td>
		`;

		refs.body.appendChild(row);
	});
}

function openModal(task = null) {
	state.editingTaskId = task ? task.id : null;
	refs.modalTitle.textContent = task ? "Edit Task" : "Add Task";
	refs.titleInput.value = task?.title || "";
	refs.descriptionInput.value = task?.description || "";
	refs.priorityInput.value = task?.priority || "medium";
	refs.statusInput.value = task?.status || "todo";
	refs.modal.classList.remove("hidden");
}

function closeModal() {
	refs.modal.classList.add("hidden");
	refs.taskForm.reset();
	refs.priorityInput.value = "medium";
	refs.statusInput.value = "todo";
	state.editingTaskId = null;
}

function resetViewFilters() {
	state.search = "";
	state.statusFilter = "all";
	state.priorityFilter = "all";
	refs.searchInput.value = "";
	refs.statusFilter.value = "all";
	refs.priorityFilter.value = "all";
}

async function loadTasks() {
	try {
		setLoading(true);
		const tasks = await fetchApi(API_BASE);
		state.tasks = Array.isArray(tasks) ? tasks : [];
		renderTasks();
	} catch (error) {
		showToast(error.message || "Failed to load tasks");
	} finally {
		setLoading(false);
	}
}

async function createTask(payload) {
	await fetchApi(API_BASE, {
		method: "POST",
		body: JSON.stringify(payload),
	});
	resetViewFilters();
	await loadTasks();
}

async function updateTask(id, payload) {
	const updated = await fetchApi(`${API_BASE}/${id}`, {
		method: "PUT",
		body: JSON.stringify(payload),
	});
	state.tasks = state.tasks.map((task) => (task.id === id ? updated : task));
	renderTasks();
}

async function deleteTask(id) {
	await fetchApi(`${API_BASE}/${id}`, { method: "DELETE" });
	state.tasks = state.tasks.filter((task) => task.id !== id);
	renderTasks();
}

refs.openModalBtn.addEventListener("click", () => openModal());
refs.cancelModalBtn.addEventListener("click", closeModal);

refs.modal.addEventListener("click", (event) => {
	if (event.target === refs.modal) {
		closeModal();
	}
});

refs.searchInput.addEventListener("input", (event) => {
	state.search = event.target.value.trim().toLowerCase();
	renderTasks();
});

refs.statusFilter.addEventListener("change", (event) => {
	state.statusFilter = event.target.value;
	renderTasks();
});

refs.priorityFilter.addEventListener("change", (event) => {
	state.priorityFilter = event.target.value;
	renderTasks();
});

refs.sortBy.addEventListener("change", (event) => {
	state.sortBy = event.target.value;
	renderTasks();
});

refs.sortOrder.addEventListener("change", (event) => {
	state.sortOrder = event.target.value;
	renderTasks();
});

refs.taskForm.addEventListener("submit", async (event) => {
	event.preventDefault();

	const payload = {
		title: refs.titleInput.value.trim(),
		description: refs.descriptionInput.value.trim(),
		priority: refs.priorityInput.value,
		status: refs.statusInput.value,
	};

	if (!payload.title) {
		showToast("Title is required");
		return;
	}

	try {
		setLoading(true);
		if (state.editingTaskId) {
			await updateTask(state.editingTaskId, payload);
			showToast("Task updated", "success");
		} else {
			await createTask(payload);
			showToast("Task created", "success");
		}
		closeModal();
	} catch (error) {
		showToast(error.message || "Failed to save task");
	} finally {
		setLoading(false);
	}
});

refs.body.addEventListener("click", async (event) => {
	const button = event.target.closest("button[data-action]");
	if (!button) return;

	const { action, id } = button.dataset;
	const task = state.tasks.find((item) => item.id === id);
	if (!task) return;

	try {
		setLoading(true);
		if (action === "edit") {
			openModal(task);
			return;
		}

		if (action === "delete") {
			await deleteTask(id);
			showToast("Task deleted", "success");
			return;
		}

		if (action === "advance") {
			if (task.status === "done") {
				showToast("Task is already completed", "success");
				return;
			}

			const payload = {
				title: task.title,
				description: task.description || "",
				priority: task.priority,
				status: button.dataset.nextStatus || getNextStatus(task.status),
			};
			await updateTask(id, payload);
			showToast(`Task moved to ${payload.status}`, "success");
		}
	} catch (error) {
		showToast(error.message || "Action failed");
	} finally {
		setLoading(false);
	}
});

loadTasks();
