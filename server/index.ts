import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { db } from "./db.ts";

const app = express();
app.use(cors());
app.use(express.json());

const VALID_STATUSES = ["planned", "in_progress", "done"] as const;
type Status = (typeof VALID_STATUSES)[number];

function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (VALID_STATUSES as readonly string[]).includes(value);
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "vestry-api" });
});

// --- Members ---
app.get("/api/members", (_req, res) => {
  const members = db.prepare("SELECT * FROM members ORDER BY created_at ASC, id ASC").all();
  res.json(members);
});

app.post("/api/members", (req, res) => {
  const { name, role } = req.body ?? {};
  if (typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ error: "name is required" });
  }
  const result = db
    .prepare("INSERT INTO members (name, role) VALUES (?, ?)")
    .run(name.trim(), typeof role === "string" && role.trim() !== "" ? role.trim() : "Contributor");
  const member = db.prepare("SELECT * FROM members WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(member);
});

app.delete("/api/members/:id", (req, res) => {
  const info = db.prepare("DELETE FROM members WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "member not found" });
  res.status(204).end();
});

// --- Initiatives ---
app.get("/api/initiatives", (_req, res) => {
  const initiatives = db
    .prepare(
      `SELECT i.*, m.name AS owner_name
       FROM initiatives i
       LEFT JOIN members m ON m.id = i.owner_id
       ORDER BY i.created_at ASC, i.id ASC`,
    )
    .all();
  res.json(initiatives);
});

app.post("/api/initiatives", (req, res) => {
  const { title, description, status, owner_id, due_date } = req.body ?? {};
  if (typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required" });
  }
  const finalStatus: Status = isStatus(status) ? status : "planned";
  const result = db
    .prepare(
      "INSERT INTO initiatives (title, description, status, owner_id, due_date) VALUES (?, ?, ?, ?, ?)",
    )
    .run(
      title.trim(),
      typeof description === "string" ? description.trim() : "",
      finalStatus,
      owner_id ?? null,
      typeof due_date === "string" && due_date.trim() !== "" ? due_date.trim() : null,
    );
  const initiative = db
    .prepare(
      `SELECT i.*, m.name AS owner_name FROM initiatives i
       LEFT JOIN members m ON m.id = i.owner_id WHERE i.id = ?`,
    )
    .get(result.lastInsertRowid);
  res.status(201).json(initiative);
});

app.patch("/api/initiatives/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM initiatives WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "initiative not found" });

  const { title, description, status, owner_id, due_date } = req.body ?? {};
  if (status !== undefined && !isStatus(status)) {
    return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(", ")}` });
  }
  const current = existing as Record<string, unknown>;
  db.prepare(
    `UPDATE initiatives SET title = ?, description = ?, status = ?, owner_id = ?, due_date = ? WHERE id = ?`,
  ).run(
    typeof title === "string" && title.trim() !== "" ? title.trim() : current.title,
    typeof description === "string" ? description.trim() : current.description,
    isStatus(status) ? status : current.status,
    owner_id !== undefined ? owner_id : current.owner_id,
    due_date !== undefined ? due_date : current.due_date,
    req.params.id,
  );
  const updated = db
    .prepare(
      `SELECT i.*, m.name AS owner_name FROM initiatives i
       LEFT JOIN members m ON m.id = i.owner_id WHERE i.id = ?`,
    )
    .get(req.params.id);
  res.json(updated);
});

app.delete("/api/initiatives/:id", (req, res) => {
  const info = db.prepare("DELETE FROM initiatives WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "initiative not found" });
  res.status(204).end();
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

const port = Number(process.env.VESTRY_API_PORT ?? 3001);
app.listen(port, () => {
  console.log(`Vestry API listening on http://localhost:${port}`);
});
