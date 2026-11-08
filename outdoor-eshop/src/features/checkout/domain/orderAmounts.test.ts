import assert from "node:assert/strict";
import test from "node:test";
import { calculateOrderAmounts, centsToDecimal } from "./orderAmounts";

test("calculates prices and free shipping exactly in cents", () => {
  const amounts = calculateOrderAmounts(
    [{ price: "0.10", quantity: 3 }, { price: "149.70", quantity: 1 }],
    "5.90",
    "150.00",
  );
  assert.deepEqual(amounts, { subtotalCents: 15000, shippingCents: 0, totalCents: 15000 });
  assert.equal(centsToDecimal(105), "1.05");
});

test("accepts the database maximum and rejects subtotal or total overflow", () => {
  assert.equal(
    calculateOrderAmounts([{ price: "99999999.99", quantity: 1 }], "0", null).totalCents,
    9_999_999_999,
  );
  assert.throws(
    () => calculateOrderAmounts([{ price: "99999999.99", quantity: 2 }], "0", null),
    /ORDER_TOTAL_TOO_HIGH/,
  );
  assert.throws(
    () => calculateOrderAmounts([{ price: "99999999.99", quantity: 1 }], "0.01", null),
    /ORDER_TOTAL_TOO_HIGH/,
  );
});
