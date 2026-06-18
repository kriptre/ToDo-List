import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(__dirname, "todo.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    title     TEXT    NOT NULL,
    done      INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

const statements = {
  all: db.prepare("SELECT id, title, done, createdAt FROM tasks ORDER BY id DESC"),
  get: db.prepare("SELECT id, title, done, createdAt FROM tasks WHERE id = ?"),
  insert: db.prepare("INSERT INTO tasks (title) VALUES (?)"),
  updateDone: db.prepare("UPDATE tasks SET done = ? WHERE id = ?"),
  updateTitle: db.prepare("UPDATE tasks SET title = ? WHERE id = ?"),
  remove: db.prepare("DELETE FROM tasks WHERE id = ?"),
};

function toTask(row) {
  return { id: row.id, title: row.title, done: !!row.done, createdAt: row.createdAt };
}

export function getTasks() {
  return statements.all.all().map(toTask);
}

export function getTask(id) {
  const row = statements.get.get(id);
  return row ? toTask(row) : null;
}

export function createTask(title) {
  const info = statements.insert.run(title);
  return getTask(info.lastInsertRowid);
}

export function updateTask(id, changes) {
  if (typeof changes.done === "boolean") {
    statements.updateDone.run(changes.done ? 1 : 0, id);
  }
  if (typeof changes.title === "string" && changes.title.trim()) {
    statements.updateTitle.run(changes.title.trim(), id);
  }
  return getTask(id);
}

export function deleteTask(id) {
  return statements.remove.run(id).changes > 0;
}
