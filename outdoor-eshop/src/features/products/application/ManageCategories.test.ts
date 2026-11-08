import assert from "node:assert/strict";
import test from "node:test";
import { createCategoryManagement } from "./ManageCategories";
import type { CategoryInput, CategoryManagementRepository } from "../domain/CategoryManagement";

test("validates category fields and normalizes names before saving", async () => {
  let saved: CategoryInput | null = null;
  const repository: CategoryManagementRepository = {
    async list() { return []; },
    async save(input) { saved = input; },
    async delete() {},
  };
  const categories = createCategoryManagement(repository);
  await categories.save({ name: "  Bundy  ", slug: "outdoor-bundy", parentId: null });
  assert.deepEqual(saved, { name: "Bundy", slug: "outdoor-bundy", parentId: null });
  for (const input of [
    { name: "  ", slug: "bundy", parentId: null },
    { name: "Bundy", slug: "Invalid Slug", parentId: null },
    { name: "Bundy", slug: "bundy", parentId: 0 },
    { name: "Bundy", slug: "bundy", parentId: 2_147_483_648 },
    { name: "a".repeat(101), slug: "bundy", parentId: null },
    { name: "Bundy", slug: "a".repeat(121), parentId: null },
  ]) {
    await assert.rejects(categories.save(input), { message: "INVALID_CATEGORY" });
  }
  await assert.rejects(categories.delete(0), { message: "INVALID_CATEGORY_ID" });
  await assert.rejects(categories.delete(2_147_483_648), { message: "INVALID_CATEGORY_ID" });
  await assert.rejects(categories.save({ name: "A", slug: "a", parentId: null }, Number.NaN), {
    message: "INVALID_CATEGORY_ID",
  });
});
