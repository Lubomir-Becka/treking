import type { GuestSession, UserSession } from "./Session";

export type CreateUserSessionInput = {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
};

export interface SessionRepository {
  findUserSession(tokenHash: string): Promise<UserSession | null>;
  createUserSession(input: CreateUserSessionInput): Promise<UserSession>;
  extendUserSession(id: number, expiresAt: Date): Promise<void>;
  deleteUserSession(tokenHash: string): Promise<void>;
  findGuestSession(tokenHash: string): Promise<GuestSession | null>;
  createGuestSession(tokenHash: string, expiresAt: Date): Promise<GuestSession>;
  deleteGuestSession(tokenHash: string): Promise<void>;
}
