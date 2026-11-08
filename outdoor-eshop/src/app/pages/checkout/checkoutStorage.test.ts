import assert from "node:assert/strict";
import test from "node:test";
import { readCheckoutDetails, readCreatedOrder, writeCheckoutDetails, writeCreatedOrder } from "./checkoutStorage";

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear() { values.clear(); },
    getItem(key) { return values.get(key) ?? null; },
    key(index) { return [...values.keys()][index] ?? null; },
    removeItem(key) { values.delete(key); },
    setItem(key, value) { values.set(key, value); },
  };
}

test("checkout state survives navigation and clears delivery data after ordering", () => {
  const storage = createStorage();
  const details = {
    email: "jana@example.com", firstName: "Jana", lastName: "Nova",
    street: "Ulica 1", city: "Zilina", postalCode: "01001", phone: "123456789",
    country: "SK", note: "", shippingMethod: "courier" as const,
  };
  writeCheckoutDetails(storage, details);
  assert.deepEqual(readCheckoutDetails(storage), details);
  writeCreatedOrder(storage, { orderNumber: "VT-123", totalPrice: 42 });
  assert.equal(readCheckoutDetails(storage), null);
  assert.deepEqual(readCreatedOrder(storage), { orderNumber: "VT-123", totalPrice: 42 });
});

test("checkout storage rejects malformed data", () => {
  const storage = createStorage();
  storage.setItem("vertex-checkout-details", "{\"shippingMethod\":\"packeta\"}");
  assert.throws(() => readCheckoutDetails(storage));
});
