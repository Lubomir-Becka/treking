import assert from "node:assert/strict";
import { test } from "node:test";
import { shippingMethods } from "./shippingMethods";
import { calculateShippingPrice } from "./shippingPrice";

test("fixed shipping options preserve prices and free-delivery threshold", () => {
  assert.deepEqual(shippingMethods.map((method) => method.code), ["courier", "pickup"]);
  const [courier, pickup] = shippingMethods;
  assert.equal(courier.name, "Kuriér na adresu");
  assert.equal(calculateShippingPrice(149.99, Number(courier.price), Number(courier.freeFromAmount)), 5.9);
  assert.equal(calculateShippingPrice(150, Number(courier.price), Number(courier.freeFromAmount)), 0);
  assert.equal(calculateShippingPrice(0, Number(pickup.price), null), 0);
});
