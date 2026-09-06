import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const dbPath = process.env.VESTRY_DB_PATH ?? resolve(process.cwd(), "data", "vestry.db");
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Contributor',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS initiatives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'planned',
    owner_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    due_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const memberCount = db.prepare("SELECT COUNT(*) AS n FROM members").get() as { n: number };
if (memberCount.n === 0) {
  const insertMember = db.prepare("INSERT INTO members (name, role) VALUES (?, ?)");
  const ada = insertMember.run("Ada Lovelace", "Team Lead").lastInsertRowid;
  const grace = insertMember.run("Grace Hopper", "Engineer").lastInsertRowid;
  insertMember.run("Alan Turing", "Designer");

  const insertInitiative = db.prepare(
    "INSERT INTO initiatives (title, description, status, owner_id, due_date) VALUES (?, ?, ?, ?, ?)",
  );
  insertInitiative.run(
    "Q3 Roadmap kickoff",
    "Align the team on quarterly goals and owners.",
    "in_progress",
    ada,
    "2026-09-15",
  );
  insertInitiative.run(
    "Onboarding playbook",
    "Document the first-week ramp for new hires.",
    "planned",
    grace,
    "2026-09-30",
  );
  insertInitiative.run(
    "Design system audit",
    "Review components for consistency.",
    "done",
    null,
    "2026-08-20",
  );
}
