import assert from "node:assert/strict";
import test from "node:test";
import { combinedCartQuantity, isAllowedCartQuantity } from "./cartQuantities";

test("merged carts preserve requested quantities even above the purchase limit", () => {
  const quantity = combinedCartQuantity(60, 50);
  assert.equal(quantity, 110);
  assert.equal(isAllowedCartQuantity(quantity), false);
  assert.equal(isAllowedCartQuantity(99), true);
});
