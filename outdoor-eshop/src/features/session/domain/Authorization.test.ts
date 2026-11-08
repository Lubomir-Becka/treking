import assert from "node:assert/strict";
import test from "node:test";
import { authorizeRole } from "./Authorization";
import type { AuthenticatedActor } from "./ActorContext";

const customer: AuthenticatedActor = {
  type: "authenticated",
  userId: 1,
  sessionId: 2,
  expiresAt: new Date("2099-01-01"),
  role: "customer",
};

test("admin authorization distinguishes guests, customers and admins", () => {
  assert.equal(authorizeRole({ type: "anonymous" }, "admin").status, "unauthenticated");
  assert.equal(
    authorizeRole({ type: "guest", tokenHash: "hash", expiresAt: new Date() }, "admin").status,
    "unauthenticated",
  );
  assert.equal(authorizeRole(customer, "admin").status, "forbidden");
  assert.equal(authorizeRole({ ...customer, role: "admin" }, "admin").status, "allowed");
});

test("customer authorization denies administrators", () => {
  assert.equal(authorizeRole(customer, "customer").status, "allowed");
  assert.equal(authorizeRole({ ...customer, role: "admin" }, "customer").status, "forbidden");
});
