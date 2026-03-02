export type SessionStatus = "live" | "draft" | "ended";

export type Role = "teacher" | "student";

export interface SessionItem {
  id: string;
  title: string;
  status: SessionStatus;
  lastActive: string;
  createdAt: string;
  description?: string;
}

export interface DecoratedSession extends SessionItem {
  lastActiveLabel: string;
  lastActiveExact: string;
  createdLabel: string;
  createdExact: string;
}
