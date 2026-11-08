import assert from "node:assert/strict";
import test from "node:test";
import { getSafeNextPath } from "./safeNextPath";

test("accepts internal paths with query strings and fragments", () => {
  assert.equal(
    getSafeNextPath("/checkout/cart?from=login#items"),
    "/checkout/cart?from=login#items",
  );
});

test("uses the account page for external and malformed destinations", () => {
  for (const value of [
    "//attacker.example",
    "///attacker.example",
    "/\\attacker.example",
    "https://attacker.example",
    " /account",
    "/account\n",
  ]) {
    assert.equal(getSafeNextPath(value), "/account");
  }
});

test("rejects repeated query parameters", () => {
  assert.equal(getSafeNextPath(["/account", "//attacker.example"]), "/account");
});
