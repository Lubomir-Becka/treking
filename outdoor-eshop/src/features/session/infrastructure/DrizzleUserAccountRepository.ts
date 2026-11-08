import { eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { users } from "../../../../drizzle/schema";
import type {
  CreateUserAccountInput,
  UpdateUserProfileInput,
  UserAccount,
  UserAccountRepository,
} from "../domain/UserAccountRepository";

function mapUser(row: typeof users.$inferSelect): UserAccount {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    passwordHash: row.passwordHash,
    isActive: row.isActive ?? true,
  };
}

export class DrizzleUserAccountRepository implements UserAccountRepository {
  async findByEmail(email: string) {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return row ? mapUser(row) : null;
  }

  async findById(id: number) {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return row ? mapUser(row) : null;
  }

  async create(input: CreateUserAccountInput) {
    const [row] = await db
      .insert(users)
      .values({
        ...input,
        email: input.email,
      })
      .onConflictDoNothing({ target: users.email })
      .returning();

    if (!row) {
      throw new Error("EMAIL_ALREADY_REGISTERED");
    }

    return mapUser(row);
  }

  async updateProfile(id: number, input: UpdateUserProfileInput) {
    const [row] = await db
      .update(users)
      .set({
        ...(input.email ? { email: input.email } : {}),
        firstName: input.firstName,
        lastName: input.lastName,
      })
      .where(eq(users.id, id))
      .returning();

    if (!row) {
      throw new Error("Unable to update user profile.");
    }

    return mapUser(row);
  }
}
