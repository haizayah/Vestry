export type Status = "planned" | "in_progress" | "done";

export interface Member {
  id: number;
  name: string;
  role: string;
  created_at: string;
}

export interface Initiative {
  id: number;
  title: string;
  description: string;
  status: Status;
  owner_id: number | null;
  owner_name: string | null;
  due_date: string | null;
  created_at: string;
}

export const STATUS_LABELS: Record<Status, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  done: "Done",
};

export const STATUS_ORDER: Status[] = ["planned", "in_progress", "done"];
