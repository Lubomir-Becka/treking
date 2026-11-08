import assert from "node:assert/strict";
import test from "node:test";
import { getCategoryListingIds } from "./categoryListing";

test("parent category listings include their direct child categories", () => {
  assert.deepEqual(
    getCategoryListingIds({ id: 1, parentId: null }, [{ id: 2 }, { id: 3 }]),
    [1, 2, 3],
  );
});

test("subcategory listings do not include sibling or descendant categories", () => {
  assert.deepEqual(
    getCategoryListingIds({ id: 2, parentId: 1 }, [{ id: 4 }]),
    [2],
  );
});
