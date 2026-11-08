import "dotenv/config";
import { db } from "../src/shared/db/client";
import { users } from "../drizzle/schema";
import { isValidCustomerEmail } from "../src/shared/domain/email";
import { BcryptPasswordService } from "../src/features/session/infrastructure/BcryptPasswordService";

async function seedAdmin() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Demo admin seed requires NODE_ENV=development.");
  }

  const email = process.env.DEMO_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.DEMO_ADMIN_PASSWORD;

  if (
    !email ||
    !isValidCustomerEmail(email) ||
    !password ||
    password.length < 8 ||
    new TextEncoder().encode(password).length > 72
  ) {
    throw new Error("Set a valid DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD (8 characters to 72 bytes).");
  }

  const passwordHash = await new BcryptPasswordService().hash(password);
  const [created] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      firstName: "Demo",
      lastName: "Admin",
      role: "admin",
      isActive: true,
    })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });

  if (!created) {
    throw new Error("An account with the demo admin email already exists; it was not changed.");
  }

  console.log("Demo admin created.");
}

seedAdmin()
  .catch((error: unknown) => {
    console.error("Demo admin seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });
