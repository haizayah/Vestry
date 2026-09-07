export type Role = "director" | "member";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  password: string;
};

export type PublicUser = Omit<User, "password">;

export const ORG_TYPES = ["church", "sports", "nonprofit", "creative", "ops", "other"] as const;
export type OrgType = (typeof ORG_TYPES)[number];

export const MODULE_IDS = ["calendar", "people", "scheduling", "events", "worship", "chat"] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

export type Song = {
  id: string;
  title: string;
  artist: string;
  key: string;
  tempo: number | null;
  notes: string;
  youtubeUrl: string;
  audioFilename: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlanItemType =
  | "song"
  | "youtube"
  | "media"
  | "announcement"
  | "sermon"
  | "notes";

export type PlanItem = {
  id: string;
  type: PlanItemType;
  title: string;
  songId?: string;
  youtubeUrl?: string;
  audioFilename?: string;
  body?: string;
};

export type AssignmentStatus = "pending" | "accepted" | "declined";

export type Assignment = {
  id: string;
  personId: string;
  position: string;
  status: AssignmentStatus;
};

export type Plan = {
  id: string;
  name: string;
  date: string;
  serviceTime: string;
  notes: string;
  items: PlanItem[];
  assignments: Assignment[];
  createdAt: string;
};

export type RepeatFreq = "none" | "weekly" | "biweekly" | "monthly";

export type RecurrenceEnds = { mode: "count"; count: number } | { mode: "until"; until: string };

export type RecurrenceRule = {
  freq: Exclude<RepeatFreq, "none">;
  interval: number;
  weekdays: number[];
  ends: RecurrenceEnds;
};

export type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  notes: string;
  recurrence: RecurrenceRule | null;
  assignments: Assignment[];
  createdAt: string;
};

export type Person = {
  id: string;
  name: string;
  email: string;
  defaultPosition: string;
  userId?: string;
};

export type Lockout = {
  id: string;
  personId: string;
  userId: string;
  start: string;
  end: string;
  note: string;
  createdAt: string;
};

export type ChatThreadKind = "team" | "plan" | "event";

export type ChatMessage = {
  id: string;
  threadKind: ChatThreadKind;
  planId?: string;
  eventId?: string;
  authorUserId: string;
  body: string;
  createdAt: string;
};

export type ActivityKind = "assigned" | "accepted" | "declined" | "event" | "series" | "plan" | "chat";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  createdAt: string;
  actorUserId: string;
  actorName: string;
  summary: string;
  href?: string;
};

export type StoreData = {
  churchName: string;
  orgType: OrgType;
  modules: ModuleId[];
  users: User[];
  people: Person[];
  songs: Song[];
  plans: Plan[];
  events: Event[];
  lockouts: Lockout[];
  messages: ChatMessage[];
  activity: ActivityItem[];
};

export const POSITIONS = [
  "Worship Leader",
  "Vocals",
  "Acoustic Guitar",
  "Electric Guitar",
  "Keys",
  "Bass",
  "Drums",
  "MD / Tracks",
  "Tech / Sound",
  "Lyrics",
] as const;

export const SPORTS_POSITIONS = [
  "Coach",
  "Captain",
  "Forward",
  "Midfielder",
  "Defender",
  "Goalkeeper",
  "Bench",
] as const;

export const GENERIC_POSITIONS = ["Lead", "Member", "Volunteer", "Staff"] as const;

export const ITEM_LABELS: Record<PlanItemType, string> = {
  song: "Song",
  youtube: "YouTube",
  media: "Audio",
  announcement: "Announcement",
  sermon: "Sermon",
  notes: "Notes",
};
