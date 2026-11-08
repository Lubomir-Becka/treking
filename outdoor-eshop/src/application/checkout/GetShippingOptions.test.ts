import assert from "node:assert/strict";
import test from "node:test";
import { getShippingOptions } from "./GetShippingOptions";

const methods = [
  {
    code: "packeta",
    name: "Packeta",
    price: "3.90",
    freeFromAmount: "50.00",
  },
  {
    code: "courier",
    name: "Courier",
    price: "5.90",
    freeFromAmount: null,
  },
];

test("shipping options apply active-method prices and free-shipping thresholds", async () => {
  const options = await getShippingOptions({
    async findActiveMethods() {
      return methods;
    },
  })(50);

  assert.deepEqual(options.map((option) => option.price), [0, 5.9]);
});

test("shipping quotes reject invalid subtotals", async () => {
  const quote = getShippingOptions({
    async findActiveMethods() {
      return methods;
    },
  });

  await assert.rejects(quote(Number.NaN), { message: "INVALID_SUBTOTAL" });
  await assert.rejects(quote(-1), { message: "INVALID_SUBTOTAL" });
});
