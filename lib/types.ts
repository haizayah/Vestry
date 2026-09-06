export type Role = "director" | "member";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  password: string;
};

export type PublicUser = Omit<User, "password">;

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

export type StoreData = {
  churchName: string;
  users: User[];
  people: Person[];
  songs: Song[];
  plans: Plan[];
  lockouts: Lockout[];
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

export const ITEM_LABELS: Record<PlanItemType, string> = {
  song: "Song",
  youtube: "YouTube",
  media: "Audio",
  announcement: "Announcement",
  sermon: "Sermon",
  notes: "Notes",
};
