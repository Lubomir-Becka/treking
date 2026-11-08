import { and, asc, eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { orders, users, userSessions } from "../../../../drizzle/schema";

const fields = {
  id: users.id,
  firstName: users.firstName,
  lastName: users.lastName,
  email: users.email,
  phone: users.phone,
  isActive: users.isActive,
};

export async function listAdminCustomers() {
  const rows = await db.select(fields).from(users)
    .where(eq(users.role, "customer")).orderBy(asc(users.email), asc(users.id));
  return rows.map((row) => ({ ...row, isActive: row.isActive === true }));
}

export async function deleteAdminCustomer(id: number) {
  return db.transaction(async (tx) => {
    const [customer] = await tx.select({ id: users.id }).from(users)
      .where(and(eq(users.id, id), eq(users.role, "customer")))
      .for("update");
    if (!customer) return false;
    await tx.delete(orders).where(eq(orders.userId, id));
    await tx.delete(users).where(and(eq(users.id, id), eq(users.role, "customer")));
    return true;
  });
}

export async function setAdminCustomerActive(id: number, active: boolean) {
  return db.transaction(async (tx) => {
    const [customer] = await tx.update(users)
      .set({ isActive: active })
      .where(and(eq(users.id, id), eq(users.role, "customer")))
      .returning({ id: users.id });
    if (!customer) return false;
    if (!active) {
      await tx.delete(userSessions).where(eq(userSessions.userId, id));
    }
    return true;
  });
}
