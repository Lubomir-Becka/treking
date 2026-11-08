import assert from "node:assert/strict";
import test from "node:test";
import { isValidCatalogQuery, MAX_CATALOG_QUERY_LENGTH } from "./catalogSearch";

test("validates catalog search length and control characters", () => {
  assert.equal(isValidCatalogQuery("horská bunda"), true);
  assert.equal(isValidCatalogQuery("a".repeat(MAX_CATALOG_QUERY_LENGTH)), true);
  assert.equal(isValidCatalogQuery("a".repeat(MAX_CATALOG_QUERY_LENGTH + 1)), false);
  assert.equal(isValidCatalogQuery("bunda\0"), false);
});
