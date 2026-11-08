import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAdminProduct, validateAdminProduct } from "./AdminProducts";

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

test("reports the invalid product field", () => {
  const product = { name: "Test", brand: "Brand", slug: "test", categoryId: null, audience: "unisex", description: "" };
  assert.equal(validateAdminProduct(product), null);
  assert.match(validateAdminProduct({ ...product, name: " " }) ?? "", /Názov produktu/);
  assert.match(validateAdminProduct({ ...product, name: `${" ".repeat(150)}T` }) ?? "", /Názov produktu/);
  assert.match(validateAdminProduct({ ...product, brand: "x".repeat(101) }) ?? "", /Značka/);
  assert.match(validateAdminProduct({ ...product, slug: "Bad slug" }) ?? "", /Slug/);
  assert.match(validateAdminProduct({ ...product, categoryId: "1" }) ?? "", /kategóriu/);
  assert.match(validateAdminProduct({ ...product, audience: "other" }) ?? "", /určenie/);
  assert.match(validateAdminProduct({ ...product, description: "x".repeat(5001) }) ?? "", /Opis/);
});
