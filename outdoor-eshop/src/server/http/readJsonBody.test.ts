import assert from "node:assert/strict";
import test from "node:test";
import { readJsonBody } from "./readJsonBody";

test("returns parsed JSON values", async () => {
  const result = await readJsonBody(
    new Request("https://example.test", {
      method: "POST",
      body: JSON.stringify({ value: 1 }),
    }),
  );

  assert.deepEqual(result, { valid: true, body: { value: 1 } });
});

test("reports malformed JSON without throwing", async () => {
  const result = await readJsonBody(
    new Request("https://example.test", {
      method: "POST",
      body: "{",
    }),
  );

  assert.deepEqual(result, { valid: false });
});
