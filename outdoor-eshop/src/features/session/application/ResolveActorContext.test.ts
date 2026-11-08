import assert from "node:assert/strict";
import test from "node:test";
import { createResolveActorContext } from "./ResolveActorContext";
import type { UserAccount } from "../domain/UserAccountRepository";
import type { SessionRepository } from "../domain/SessionRepository";
import type { SessionCookiePort } from "../domain/SessionCookiePort";
import type { TokenServicePort } from "../domain/TokenServicePort";

test("session lookup reads the current role and rejects inactive or missing accounts", async () => {
  const deletedSessions: string[] = [];
  let user: UserAccount | null = {
    id: 1,
    email: "customer@example.com",
    firstName: "Jana",
    lastName: "Nová",
    phone: null,
    passwordHash: "hash",
    isActive: true,
    role: "customer",
  };
  const cookies: SessionCookiePort = {
    async get(name) {
      return name === "vt_customer_session" ? "token" : undefined;
    },
    async set() {},
    async clear() {},
  };
  const repository: SessionRepository = {
    async findUserSession() {
      return {
        id: 2,
        userId: 1,
        tokenHash: "hash",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        ipAddress: null,
        userAgent: null,
      };
    },
    async createUserSession() { throw new Error("Not used."); },
    async extendUserSession() {},
    async deleteUserSession(tokenHash) {
      deletedSessions.push(tokenHash);
    },
    async findGuestSession() { return null; },
    async createGuestSession() { throw new Error("Not used."); },
    async deleteGuestSession() {},
  };
  const tokens: TokenServicePort = {
    generateToken: () => "token",
    hashToken: () => "hash",
  };
  const resolve = createResolveActorContext(cookies, repository, tokens, {
    async findById() { return user; },
  });

  const first = await resolve();
  assert.equal(first.type === "authenticated" && first.role, "customer");
  user = { ...user, role: "admin" };
  const changed = await resolve();
  assert.equal(changed.type === "authenticated" && changed.role, "admin");
  user = { ...user, isActive: false };
  assert.equal((await resolve()).type, "anonymous");
  user = null;
  assert.equal((await resolve()).type, "anonymous");
  assert.deepEqual(deletedSessions, ["hash", "hash"]);
});
