import assert from "node:assert/strict";
import { test } from "node:test";
import type { UserAccount, UserAccountRepository } from "../domain/UserAccountRepository";
import type { UserRole } from "../domain/UserRole";
import type { createCustomerSession } from "./CreateCustomerSession";
import { createLoginCustomer } from "./LoginCustomer";

function setup(user: UserAccount | null, requiredRole: UserRole) {
  const calls: number[] = [];
  const accounts: UserAccountRepository = {
    async findByEmail() { return user; },
    async findById() { return null; },
    async create() { throw new Error("Not implemented"); },
    async updateProfile() { throw new Error("Not implemented"); },
  };
  const session: ReturnType<typeof createCustomerSession> = async (input) => {
    calls.push(input.userId);
    return {
      id: 1,
      userId: input.userId,
      tokenHash: "hash",
      expiresAt: new Date(),
      createdAt: new Date(),
      ipAddress: null,
      userAgent: null,
    };
  };
  const login = createLoginCustomer(accounts, {
    async hash() { return "hash"; },
    async verify(password) { return password === "correct-password"; },
  }, {
    async assertAllowed() {},
  }, session, requiredRole);
  return { login, calls };
}

const user: UserAccount = {
  id: 1,
  email: "user@example.test",
  firstName: "Test",
  lastName: "User",
  passwordHash: "hash",
  isActive: true,
  role: "admin",
};

test("login only creates a session for the required role", async () => {
  for (const role of ["customer", "admin"] as const) {
    const valid = setup({ ...user, role }, role);
    assert.equal((await valid.login({ email: user.email, password: "correct-password" })).role, role);
    assert.deepEqual(valid.calls, [1]);

    const wrongRole = setup({ ...user, role: role === "admin" ? "customer" : "admin" }, role);
    await assert.rejects(wrongRole.login({ email: user.email, password: "correct-password" }), {
      message: "INVALID_CREDENTIALS",
    });
    assert.deepEqual(wrongRole.calls, []);
  }
});

test("login rejects inactive accounts and incorrect passwords without creating sessions", async () => {
  const inactive = setup({ ...user, isActive: false }, "admin");
  await assert.rejects(inactive.login({ email: user.email, password: "correct-password" }), {
    message: "INVALID_CREDENTIALS",
  });
  const wrongPassword = setup(user, "admin");
  await assert.rejects(wrongPassword.login({ email: user.email, password: "wrong-password" }), {
    message: "INVALID_CREDENTIALS",
  });
  assert.deepEqual(inactive.calls, []);
  assert.deepEqual(wrongPassword.calls, []);
});
