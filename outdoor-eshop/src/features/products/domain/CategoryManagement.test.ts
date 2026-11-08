import assert from "node:assert/strict";
import test from "node:test";
import { isCategoryId, isValidCategoryParent, validateCategoryInput } from "./CategoryManagement";

test("category names reject control characters but allow normal Unicode", () => {
  for (const character of ["\u0000", "\n", "\u007f", "\u0085"]) {
    assert.equal(
      validateCategoryInput({ name: `Názov${character}kategórie`, slug: "nazov", parentId: null }),
      "Názov nesmie obsahovať riadiace znaky.",
    );
  }
  assert.equal(validateCategoryInput({ name: "Detské oblečenie", slug: "detske", parentId: null }), null);
});

test("category IDs fit the PostgreSQL integer range", () => {
  for (const id of [1, 2_147_483_647]) assert.equal(isCategoryId(id), true);
  for (const id of [0, -1, 1.5, 2_147_483_648, Number.NaN]) {
    assert.equal(isCategoryId(id), false);
  }
});

test("category parent preserves a two-level tree", () => {
  const tree = [
    { id: 1, parentId: null },
    { id: 2, parentId: 1 },
    { id: 3, parentId: null },
  ];
  assert.equal(isValidCategoryParent(tree, null, 2), true);
  assert.equal(isValidCategoryParent(tree, 3, 2), true);
  assert.equal(isValidCategoryParent(tree, 1), true);
  assert.equal(isValidCategoryParent(tree, 99), false);
  assert.equal(isValidCategoryParent(tree, 2), false);
  assert.equal(isValidCategoryParent(tree, 3, 3), false);
  assert.equal(isValidCategoryParent(tree, 3, 1), false);
  assert.equal(isValidCategoryParent(tree, 2, 1), false);
});
