import type { ActorContext, AuthenticatedActor } from "./ActorContext";
import type { UserRole } from "./UserRole";

export type AuthorizationResult =
  | { status: "allowed"; actor: AuthenticatedActor }
  | { status: "unauthenticated" }
  | { status: "forbidden" };

export function authorizeRole(actor: ActorContext, role: UserRole): AuthorizationResult {
  if (actor.type !== "authenticated") {
    return { status: "unauthenticated" };
  }

  if (actor.role !== role) {
    return { status: "forbidden" };
  }

  return { status: "allowed", actor };
}
