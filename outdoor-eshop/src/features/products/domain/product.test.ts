import assert from "node:assert/strict";
import test from "node:test";
import { isTargetAudience } from "./product";

test("accepts only supported audience values", () => {
  assert.equal(isTargetAudience("men"), true);
  assert.equal(isTargetAudience("women"), true);
  assert.equal(isTargetAudience("unisex"), true);
  assert.equal(isTargetAudience("all"), false);
  assert.equal(isTargetAudience(null), false);
});
