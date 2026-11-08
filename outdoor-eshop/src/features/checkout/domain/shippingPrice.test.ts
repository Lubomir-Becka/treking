import assert from "node:assert/strict";
import test from "node:test";
import { calculateShippingPrice } from "./shippingPrice";

test("calculates shipping at, below, and without the free threshold", () => {
  assert.equal(calculateShippingPrice(49.99, 5.9, 50), 5.9);
  assert.equal(calculateShippingPrice(50, 5.9, 50), 0);
  assert.equal(calculateShippingPrice(100, 5.9, null), 5.9);
  assert.equal(calculateShippingPrice(0, 0, 0), 0);
});
