import assert from "node:assert/strict";
import test from "node:test";
import { parseFavoriteColorIds } from "./favorites";

test("parses unique positive favorite color variant IDs", () => {
  assert.deepEqual(parseFavoriteColorIds("[11,12,11,0,-1,\"13\"]"), [11, 12]);
});

test("returns an empty list for missing or malformed favorites", () => {
  assert.deepEqual(parseFavoriteColorIds(null), []);
  assert.deepEqual(parseFavoriteColorIds("{broken"), []);
  assert.deepEqual(parseFavoriteColorIds("{}"), []);
});
