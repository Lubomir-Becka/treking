import type { UserRole } from "./UserRole";

export type GuestActor = {
  type: "guest";
  tokenHash: string;
  expiresAt: Date;
};

export type AuthenticatedActor = {
  type: "authenticated";
  userId: number;
  sessionId: number;
  expiresAt: Date;
  role: UserRole;
};

export type AnonymousVisitor = {
  type: "anonymous";
};

export type ActorContext =
  | GuestActor
  | AuthenticatedActor
  | AnonymousVisitor;
