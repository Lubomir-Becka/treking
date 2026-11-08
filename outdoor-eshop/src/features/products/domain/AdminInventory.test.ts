import assert from "node:assert/strict";
import { test } from "node:test";
import { parseBatchVariantInput, parseColorInput, parseInventoryId, parseVariantInput } from "./AdminInventory";

test("validates and normalizes color input", () => {
  assert.deepEqual(parseColorInput({ name: " Čierna ", hexCode: "#ABCDEF" }), {
    name: "Čierna",
    hexCode: "#abcdef",
  });

  assert.equal(parseColorInput({ name: " ", hexCode: "#abcdef" }), null);
  assert.equal(parseColorInput({ name: "Black", hexCode: "#abcd" }), null);
  assert.equal(parseColorInput({ name: "Black\0", hexCode: "#abcdef" }), null);
});

test("validates batch sizes and shared price", () => {
  assert.deepEqual(parseBatchVariantInput({ sizes: ["S", "XL"], price: "19.50" }), {
    sizes: ["S", "XL"], price: "19.50",
  });
  assert.ok(parseBatchVariantInput({ sizes: ["35", "50"], price: "0" }));
  for (const sizes of [[], ["S", "S"], ["S", "35"], ["34"], ["51"], ["4XL"]]) {
    assert.equal(parseBatchVariantInput({ sizes, price: "1" }), null);
  }
  assert.equal(parseBatchVariantInput({ sizes: ["S"], price: "-1" }), null);
});

test("validates variant price, stock, size and SKU", () => {
  const valid = { sku: " SKU-1 ", size: " M ", price: "19.50", stock: 3, isActive: true };
  assert.deepEqual(parseVariantInput(valid), { ...valid, sku: "SKU-1", size: "M" });
  for (const invalid of [
    { ...valid, sku: " " },
    { ...valid, size: "" },
    { ...valid, price: "-1" },
    { ...valid, price: "1.999" },
    { ...valid, price: "100000000" },
    { ...valid, stock: -1 },
    { ...valid, stock: 1.5 },
    { ...valid, stock: 2_147_483_648 },
    { ...valid, isActive: "true" },
  ]) {
    assert.equal(parseVariantInput(invalid), null);
  }
  assert.equal(parseInventoryId(1), 1);
  assert.equal(parseInventoryId(0), null);
  assert.equal(parseInventoryId("1"), null);
});
