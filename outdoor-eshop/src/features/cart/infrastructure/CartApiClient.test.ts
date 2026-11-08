import assert from "node:assert/strict";
import test from "node:test";
import { parseCartResponse } from "./CartApiClient";

const cart = {
  id: 1,
  items: [{
    id: 2,
    variantId: 3,
    productName: "Shell",
    slug: "shell",
    imageUrl: null,
    colorName: "Modrá",
    size: "M",
    sku: "SHELL-M",
    unitPrice: 199,
    stock: 5,
    quantity: 1,
  }],
};

test("validates cart response item fields", () => {
  assert.deepEqual(parseCartResponse({ data: cart }).data, cart);
});

test("rejects malformed cart responses", () => {
  assert.throws(() =>
    parseCartResponse({ data: { ...cart, items: [{ ...cart.items[0], quantity: "1" }] } }),
  );
});
