import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/tasks", (req, res) => {
  res.json(getTasks());
});

app.post("/api/tasks", (req, res) => {
  const title = (req.body.title || "").trim();
  if (!title) {
    return res.status(400).json({ error: "Поле 'title' є обов'язковим" });
  }
  res.status(201).json(createTask(title));
});

app.patch("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!getTask(id)) {
    return res.status(404).json({ error: "Завдання не знайдено" });
  }
  res.json(updateTask(id, req.body));
});

app.delete("/api/tasks/:id", (req, res) => {
  const removed = deleteTask(Number(req.params.id));
  if (!removed) {
    return res.status(404).json({ error: "Завдання не знайдено" });
  }
  res.status(204).end();
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Внутрішня помилка сервера" });
});

app.listen(PORT, () => {
  console.log(`ToDo сервер запущено: http://localhost:${PORT}`);
});
