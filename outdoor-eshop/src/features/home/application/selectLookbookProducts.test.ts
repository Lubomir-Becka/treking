import assert from "node:assert/strict";
import test from "node:test";
import type { ProductListItem } from "@/features/products/domain/product";
import { selectLookbookProducts } from "./selectLookbookProducts";

const products = [
  { id: 1, colorId: 11, slug: "shell-blue" },
  { id: 1, colorId: 12, slug: "shell-red" },
  { id: 2, colorId: 21, slug: "boots" },
] as ProductListItem[];

test("selects only requested lookbook variants in the configured order", () => {
  assert.deepEqual(
    selectLookbookProducts(products, ["boots", "shell-red", "missing"]),
    [products[2], products[1]],
  );
});
