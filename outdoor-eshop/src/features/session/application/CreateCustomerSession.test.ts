import assert from "node:assert/strict";
import test from "node:test";
import { createCustomerSession } from "./CreateCustomerSession";
import type { SessionCookiePort } from "../domain/SessionCookiePort";
import type { SessionRepository } from "../domain/SessionRepository";
import type { TokenServicePort } from "../domain/TokenServicePort";
import type { GuestCartMergePort } from "../domain/GuestCartMergePort";

async function createSessionWithGuest(role: "customer" | "admin") {
  const operations: string[] = [];
  const cookies: SessionCookiePort = {
    get: async (name) =>
      name === "vt_guest_session" ? "guest-token" : undefined,
    set: async () => {
      operations.push("set-customer-cookie");
    },
    clear: async () => {
      operations.push("clear-guest-cookie");
    },
  };
  const repository: SessionRepository = {
    findUserSession: async () => null,
    createUserSession: async (input) => {
      operations.push("create-customer-session");
      return {
        id: 1,
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        createdAt: new Date(),
      };
    },
    extendUserSession: async () => {},
    deleteUserSession: async () => {},
    findGuestSession: async () => null,
    createGuestSession: async () => {
      throw new Error("Not used by this test.");
    },
    deleteGuestSession: async (tokenHash) => {
      assert.equal(tokenHash, "hash:guest-token");
      operations.push("delete-guest-session");
    },
  };
  const tokens: TokenServicePort = {
    generateToken: () => "customer-token",
    hashToken: (token) => `hash:${token}`,
  };
  const guestCartMerger: GuestCartMergePort = {
    mergeGuestCart: async (tokenHash, userId) => {
      assert.equal(tokenHash, "hash:guest-token");
      assert.equal(userId, 17);
      operations.push("merge-guest-cart");
    },
  };

  await createCustomerSession(
    cookies,
    repository,
    tokens,
    guestCartMerger,
  )({ userId: 17, role });

  return operations;
}

test("merges guest cart before deleting its session and clearing its cookie", async () => {
  const operations = await createSessionWithGuest("customer");

  assert.deepEqual(operations, [
    "create-customer-session",
    "merge-guest-cart",
    "delete-guest-session",
    "clear-guest-cookie",
    "set-customer-cookie",
  ]);
});

test("admin login preserves the guest cart and cookie", async () => {
  const operations = await createSessionWithGuest("admin");
  assert.deepEqual(operations, [
    "create-customer-session",
    "set-customer-cookie",
  ]);
});
