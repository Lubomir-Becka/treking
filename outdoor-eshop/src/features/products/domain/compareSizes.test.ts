import assert from "node:assert/strict";
import { test } from "node:test";
import { compareSizes } from "./compareSizes";

test("sorts clothing sizes from smallest to largest", () => {
  const sizes = ["XXL", "M", "XL", "S", "L", "XS", "XXS", "3XL", "XXXS"];

  assert.deepEqual(sizes.sort(compareSizes), [
    "XXXS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL",
  ]);
});

test("sorts numeric sizes numerically, including decimal sizes", () => {
  const sizes = ["42", "9", "40,5", "10", "40", "40.25"];

  assert.deepEqual(sizes.sort(compareSizes), [
    "9", "10", "40", "40.25", "40,5", "42",
  ]);
});

test("sorts unrecognized sizes deterministically and puts missing sizes last", () => {
  const sizes = [null, "10-12", "M", "2-4", "42", "S"];

  assert.deepEqual(sizes.sort(compareSizes), [
    "S", "M", "42", "2-4", "10-12", null,
  ]);
});

test("accepts case, whitespace and numeric prefixes in clothing sizes", () => {
  const sizes = ["2XL", " xs ", "xl", "3XL", "m", "2XS", "s"];

  assert.deepEqual(sizes.sort(compareSizes), [
    "2XS", " xs ", "s", "m", "xl", "2XL", "3XL",
  ]);
});
