import assert from "node:assert/strict";
import test from "node:test";
import type { UserAccountRepository } from "@/features/session/domain/UserAccountRepository";
import type { PasswordServicePort } from "@/features/session/domain/PasswordServicePort";
import { createRegisterCustomer } from "./RegisterCustomer";
import type { createCustomerSession } from "./CreateCustomerSession";

const user = {
  id: 1,
  email: "customer@example.com",
  firstName: "Jana",
  lastName: "Nova",
  passwordHash: "hash",
  isActive: true,
};
const input = { email: user.email, firstName: "Jana", lastName: "Nova", password: "password" };
const passwords: PasswordServicePort = {
  async hash() { return "hash"; },
  async verify() { return true; },
};

function setup(create: UserAccountRepository["create"]) {
  const accounts: UserAccountRepository = {
    async findByEmail() { return null; },
    async findById() { return null; },
    create,
    async updateProfile() { return user; },
  };
  const session: ReturnType<typeof createCustomerSession> = async () => ({
    id: 1,
    userId: 1,
    tokenHash: "hash",
    expiresAt: new Date(),
    createdAt: new Date(),
    ipAddress: null,
    userAgent: null,
  });
  return createRegisterCustomer(accounts, passwords, session);
}

test("registration rejects invalid email and oversized bcrypt input", async () => {
  const register = setup(async () => user);
  await assert.rejects(register({ ...input, email: "not-an-email" }), { message: "INVALID_REGISTRATION" });
  await assert.rejects(register({ ...input, password: "é".repeat(37) }), { message: "INVALID_REGISTRATION" });
});

test("registration handles concurrent duplicate email inserts", async () => {
  const register = setup(async () => { throw new Error("EMAIL_ALREADY_REGISTERED"); });
  await assert.rejects(register(input), { message: "EMAIL_ALREADY_REGISTERED" });
});
