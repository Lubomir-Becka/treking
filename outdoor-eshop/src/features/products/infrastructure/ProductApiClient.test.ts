import assert from "node:assert/strict";
import test from "node:test";
import { parseCatalogProductsResponse } from "./ProductApiClient";

const product = {
  id: 1,
  colorId: 10,
  slug: "shell",
  name: "Shell",
  colorName: "Modrá",
  hexCode: "#0000ff",
  category: "Bundy",
  description: null,
  brand: "VERTEX",
  price: "199.00",
  imageUrl: "/shell.webp",
  stock: 3,
  audience: "men",
};

test("validates the catalog response and keeps its selected color variant", () => {
  assert.deepEqual(parseCatalogProductsResponse({ data: [product] }).data, [
    product,
  ]);
});

test("rejects malformed catalog response data", () => {
  assert.throws(() => parseCatalogProductsResponse({ data: [{ ...product, colorId: "10" }] }));
  assert.throws(() => parseCatalogProductsResponse({ data: "not-an-array" }));
});
