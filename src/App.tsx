import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import {
  type Initiative,
  type Member,
  type Status,
  STATUS_LABELS,
  STATUS_ORDER,
} from "./types";
import "./App.css";

export default function App() {
  const [members, setMembers] = useState<Member[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const [m, i] = await Promise.all([api.listMembers(), api.listInitiatives()]);
      setMembers(m);
      setInitiatives(i);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const counts = useMemo(() => {
    const base: Record<Status, number> = { planned: 0, in_progress: 0, done: 0 };
    for (const item of initiatives) base[item.status] += 1;
    return base;
  }, [initiatives]);

  async function withErrorHandling(fn: () => Promise<void>) {
    try {
      await fn();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>V</span>
          <div>
            <h1>Vestry</h1>
            <p>Team management planning center</p>
          </div>
        </div>
        <div className="stats">
          {STATUS_ORDER.map((s) => (
            <div className="stat" key={s}>
              <span className="stat-value">{counts[s]}</span>
              <span className="stat-label">{STATUS_LABELS[s]}</span>
            </div>
          ))}
          <div className="stat">
            <span className="stat-value">{members.length}</span>
            <span className="stat-label">Members</span>
          </div>
        </div>
      </header>

      {error && <div className="banner error">{error}</div>}

      <div className="layout">
        <aside className="sidebar">
          <TeamPanel
            members={members}
            onCreate={(name, role) =>
              withErrorHandling(async () => {
                await api.createMember(name, role);
                await refresh();
              })
            }
            onDelete={(id) =>
              withErrorHandling(async () => {
                await api.deleteMember(id);
                await refresh();
              })
            }
          />
          <NewInitiativePanel
            members={members}
            onCreate={(input) =>
              withErrorHandling(async () => {
                await api.createInitiative(input);
                await refresh();
              })
            }
          />
        </aside>

        <main className="board">
          {loading ? (
            <p className="empty">Loading planning board…</p>
          ) : (
            STATUS_ORDER.map((status) => (
              <Column
                key={status}
                status={status}
                members={members}
                initiatives={initiatives.filter((i) => i.status === status)}
                onMove={(id, next) =>
                  withErrorHandling(async () => {
                    await api.updateInitiative(id, { status: next });
                    await refresh();
                  })
                }
                onAssign={(id, owner_id) =>
                  withErrorHandling(async () => {
                    await api.updateInitiative(id, { owner_id });
                    await refresh();
                  })
                }
                onDelete={(id) =>
                  withErrorHandling(async () => {
                    await api.deleteInitiative(id);
                    await refresh();
                  })
                }
              />
            ))
          )}
        </main>
      </div>
    </div>
  );
}

function TeamPanel({
  members,
  onCreate,
  onDelete,
}: {
  members: Member[];
  onCreate: (name: string, role: string) => void;
  onDelete: (id: number) => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  return (
    <section className="panel">
      <h2>Team</h2>
      <ul className="member-list">
        {members.map((m) => (
          <li key={m.id} className="member">
            <div className="avatar" aria-hidden>
              {m.name.charAt(0).toUpperCase()}
            </div>
            <div className="member-info">
              <span className="member-name">{m.name}</span>
              <span className="member-role">{m.role}</span>
            </div>
            <button
              className="icon-btn"
              title="Remove member"
              onClick={() => onDelete(m.id)}
            >
              ×
            </button>
          </li>
        ))}
        {members.length === 0 && <li className="muted">No members yet.</li>}
      </ul>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onCreate(name, role);
          setName("");
          setRole("");
        }}
      >
        <input
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Member name"
        />
        <input
          placeholder="Role (optional)"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Member role"
        />
        <button type="submit" className="btn primary">
          Add member
        </button>
      </form>
    </section>
  );
}

function NewInitiativePanel({
  members,
  onCreate,
}: {
  members: Member[];
  onCreate: (input: {
    title: string;
    description: string;
    owner_id: number | null;
    due_date: string | null;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");

  return (
    <section className="panel">
      <h2>New initiative</h2>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          onCreate({
            title,
            description,
            owner_id: ownerId ? Number(ownerId) : null,
            due_date: dueDate || null,
          });
          setTitle("");
          setDescription("");
          setOwnerId("");
          setDueDate("");
        }}
      >
        <input
          placeholder="Initiative title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Initiative title"
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Initiative description"
          rows={2}
        />
        <select
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          aria-label="Initiative owner"
        >
          <option value="">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-label="Due date"
        />
        <button type="submit" className="btn primary">
          Create initiative
        </button>
      </form>
    </section>
  );
}

function Column({
  status,
  initiatives,
  members,
  onMove,
  onAssign,
  onDelete,
}: {
  status: Status;
  initiatives: Initiative[];
  members: Member[];
  onMove: (id: number, next: Status) => void;
  onAssign: (id: number, owner_id: number | null) => void;
  onDelete: (id: number) => void;
}) {
  const currentIndex = STATUS_ORDER.indexOf(status);
  const prev = STATUS_ORDER[currentIndex - 1];
  const next = STATUS_ORDER[currentIndex + 1];

  return (
    <section className={`column column-${status}`}>
      <header className="column-header">
        <h3>{STATUS_LABELS[status]}</h3>
        <span className="count">{initiatives.length}</span>
      </header>
      <div className="cards">
        {initiatives.map((item) => (
          <article className="card" key={item.id}>
            <div className="card-top">
              <h4>{item.title}</h4>
              <button className="icon-btn" title="Delete" onClick={() => onDelete(item.id)}>
                ×
              </button>
            </div>
            {item.description && <p className="card-desc">{item.description}</p>}
            <div className="card-meta">
              <select
                className="owner-select"
                value={item.owner_id ?? ""}
                onChange={(e) => onAssign(item.id, e.target.value ? Number(e.target.value) : null)}
                aria-label={`Owner for ${item.title}`}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {item.due_date && <span className="due">Due {item.due_date}</span>}
            </div>
            <div className="card-actions">
              {prev && (
                <button className="btn small" onClick={() => onMove(item.id, prev)}>
                  ← {STATUS_LABELS[prev]}
                </button>
              )}
              {next && (
                <button className="btn small" onClick={() => onMove(item.id, next)}>
                  {STATUS_LABELS[next]} →
                </button>
              )}
            </div>
          </article>
        ))}
        {initiatives.length === 0 && <p className="empty">Nothing here yet.</p>}
      </div>
    </section>
  );
}
