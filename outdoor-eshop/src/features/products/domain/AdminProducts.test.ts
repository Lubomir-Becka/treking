import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAdminProduct } from "./AdminProducts";

test("validates administrator product input", () => {
  const product = {
    name: " Test ", brand: " Brand ", slug: "test-product",
    categoryId: null, audience: "unisex", description: "",
  };
  assert.deepEqual(parseAdminProduct(product), {
    name: "Test", brand: "Brand", slug: "test-product",
    categoryId: null, audience: "unisex", description: null,
  });
  assert.equal(parseAdminProduct({ ...product, name: "test\0" }), null);
  assert.equal(parseAdminProduct({ ...product, name: "a".repeat(151) }), null);
  assert.equal(parseAdminProduct({ ...product, slug: "Bad slug" }), null);
  assert.equal(parseAdminProduct({ ...product, categoryId: 2_147_483_648 }), null);
});
