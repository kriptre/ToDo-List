const API = "/api/tasks";

const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const counter = document.getElementById("counter");
const subtitle = document.getElementById("subtitle");
const errorEl = document.getElementById("error");
const clearBtn = document.getElementById("clear-done");
const tabs = document.querySelectorAll(".tabs__item");
const ring = document.getElementById("ring");
const ringLabel = document.getElementById("ring-label");

let tasks = [];
let filter = "all";

async function request(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let message = `Помилка ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) message = data.error;
    } catch (_) {}
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearError() {
  errorEl.hidden = true;
}

async function load() {
  try {
    tasks = await request(API);
    clearError();
    render();
  } catch (err) {
    showError("Не вдалося завантажити завдання: " + err.message);
  }
}

async function add(title) {
  const text = title.trim();
  if (!text) return;
  try {
    const task = await request(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: text }),
    });
    tasks.unshift(task);
    clearError();
    render();
  } catch (err) {
    showError("Не вдалося додати: " + err.message);
  }
}

async function toggle(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  try {
    const updated = await request(`${API}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
    Object.assign(task, updated);
    clearError();
    render();
  } catch (err) {
    showError("Не вдалося оновити: " + err.message);
  }
}

async function remove(id, element) {
  try {
    await request(`${API}/${id}`, { method: "DELETE" });
    if (element) {
      element.classList.add("is-removing");
      await new Promise((r) => setTimeout(r, 260));
    }
    tasks = tasks.filter((t) => t.id !== id);
    clearError();
    render();
  } catch (err) {
    showError("Не вдалося видалити: " + err.message);
  }
}

async function clearDone() {
  const done = tasks.filter((t) => t.done);
  for (const task of done) {
    await remove(task.id);
  }
}

function visibleTasks() {
  if (filter === "active") return tasks.filter((t) => !t.done);
  if (filter === "done") return tasks.filter((t) => t.done);
  return tasks;
}

function render() {
  const items = visibleTasks();
  list.innerHTML = "";

  if (items.length === 0) {
    list.appendChild(emptyState());
  } else {
    for (const task of items) list.appendChild(taskElement(task));
  }

  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const left = total - done;

  counter.textContent = total === 0 ? "Немає завдань" : `Активних: ${left} з ${total}`;
  subtitle.textContent = total === 0 ? "Список порожній" : `${done} виконано, ${left} попереду`;

  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  ring.style.setProperty("--p", percent);
  ringLabel.textContent = percent + "%";
}

function taskElement(task) {
  const li = document.createElement("li");
  li.className = "task" + (task.done ? " is-done" : "");

  const check = document.createElement("button");
  check.className = "check";
  check.type = "button";
  check.setAttribute("aria-label", task.done ? "Зняти відмітку" : "Виконано");
  check.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>';
  check.addEventListener("click", () => toggle(task.id));

  const title = document.createElement("span");
  title.className = "task__title";
  title.textContent = task.title;

  const del = document.createElement("button");
  del.className = "task__del";
  del.type = "button";
  del.setAttribute("aria-label", "Видалити");
  del.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>';
  del.addEventListener("click", () => remove(task.id, li));

  li.append(check, title, del);
  return li;
}

function emptyState() {
  const li = document.createElement("li");
  li.className = "empty";
  const isAll = filter === "all";
  li.innerHTML =
    `<div class="empty__icon">${isAll ? "🗒️" : "🔍"}</div>` +
    `<p>${isAll ? "Поки що немає завдань" : "Немає завдань у цьому фільтрі"}</p>`;
  return li;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  add(input.value);
  input.value = "";
  input.focus();
});

clearBtn.addEventListener("click", clearDone);

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    filter = tab.dataset.filter;
    render();
  });
});

load();
