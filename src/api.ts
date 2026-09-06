import type { Initiative, Member, Status } from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listMembers: () => request<Member[]>("/api/members"),
  createMember: (name: string, role: string) =>
    request<Member>("/api/members", {
      method: "POST",
      body: JSON.stringify({ name, role }),
    }),
  deleteMember: (id: number) => request<void>(`/api/members/${id}`, { method: "DELETE" }),

  listInitiatives: () => request<Initiative[]>("/api/initiatives"),
  createInitiative: (input: {
    title: string;
    description: string;
    owner_id: number | null;
    due_date: string | null;
  }) =>
    request<Initiative>("/api/initiatives", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateInitiative: (id: number, patch: Partial<{ status: Status; owner_id: number | null }>) =>
    request<Initiative>(`/api/initiatives/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteInitiative: (id: number) =>
    request<void>(`/api/initiatives/${id}`, { method: "DELETE" }),
};
