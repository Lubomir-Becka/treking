import assert from "node:assert/strict";
import test from "node:test";
import { isValidProductImage, MAX_IMAGE_BYTES } from "./ProductImage";

test("validates image type and size before upload", () => {
  assert.equal(isValidProductImage({ type: "image/png", size: MAX_IMAGE_BYTES }), true);
  assert.equal(isValidProductImage({ type: "image/png", size: MAX_IMAGE_BYTES + 1 }), false);
  assert.equal(isValidProductImage({ type: "image/png", size: 0 }), false);
  assert.equal(isValidProductImage({ type: "image/svg+xml", size: 42 }), false);
});
