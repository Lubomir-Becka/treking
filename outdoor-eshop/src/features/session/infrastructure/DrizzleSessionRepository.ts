import { eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import {
  guestSessions,
  userSessions,
} from "../../../../drizzle/schema";
import type {
  CreateUserSessionInput,
  SessionRepository,
} from "../domain/SessionRepository";
import type { GuestSession, UserSession } from "../domain/Session";

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function mapUserSession(row: typeof userSessions.$inferSelect): UserSession {
  return {
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: toDate(row.expiresAt),
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    createdAt: toDate(row.createdAt ?? new Date()),
  };
}

function mapGuestSession(row: typeof guestSessions.$inferSelect): GuestSession {
  return {
    id: row.id,
    tokenHash: row.tokenHash,
    expiresAt: toDate(row.expiresAt),
    createdAt: toDate(row.createdAt ?? new Date()),
  };
}

export class DrizzleSessionRepository implements SessionRepository {
  async findUserSession(tokenHash: string) {
    const [row] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.tokenHash, tokenHash))
      .limit(1);
    return row ? mapUserSession(row) : null;
  }

  async createUserSession(input: CreateUserSessionInput) {
    const [row] = await db
      .insert(userSessions)
      .values({
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt.toISOString(),
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      })
      .returning();

    if (!row) {
      throw new Error("Unable to create customer session.");
    }

    return mapUserSession(row);
  }

  async extendUserSession(id: number, expiresAt: Date) {
    await db
      .update(userSessions)
      .set({ expiresAt: expiresAt.toISOString() })
      .where(eq(userSessions.id, id));
  }

  async deleteUserSession(tokenHash: string) {
    await db.delete(userSessions).where(eq(userSessions.tokenHash, tokenHash));
  }

  async findGuestSession(tokenHash: string) {
    const [row] = await db
      .select()
      .from(guestSessions)
      .where(eq(guestSessions.tokenHash, tokenHash))
      .limit(1);
    return row ? mapGuestSession(row) : null;
  }

  async createGuestSession(tokenHash: string, expiresAt: Date) {
    const [row] = await db
      .insert(guestSessions)
      .values({
        tokenHash,
        expiresAt: expiresAt.toISOString(),
      })
      .returning();

    if (!row) {
      throw new Error("Unable to create guest session.");
    }

    return mapGuestSession(row);
  }

  async deleteGuestSession(tokenHash: string) {
    await db.delete(guestSessions).where(eq(guestSessions.tokenHash, tokenHash));
  }
}
