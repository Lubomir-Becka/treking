import assert from "node:assert/strict";
import test from "node:test";
import { getSafeNextPath, isAdminDestination } from "./safeNextPath";

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

test("identifies administration paths without matching unrelated paths", () => {
  for (const path of ["/admin", "/admin/", "/admin/products?sort=name", "/admin#overview"]) {
    assert.equal(isAdminDestination(getSafeNextPath(path)), true);
  }
  for (const path of ["/account", "/administrator", "/shop/admin", "//attacker.example/admin"]) {
    assert.equal(isAdminDestination(getSafeNextPath(path)), false);
  }
});
