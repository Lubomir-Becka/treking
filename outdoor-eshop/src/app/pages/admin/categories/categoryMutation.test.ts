import assert from "node:assert/strict";
import test from "node:test";
import { runCategoryMutation } from "./categoryMutation";

test("distinguishes a failed refresh from a failed mutation", async () => {
  let saved = false;
  const result = await runCategoryMutation(
    async () => { saved = true; },
    async () => { throw new Error("refresh failed"); },
  );
  assert.equal(saved, true);
  assert.deepEqual(result, { status: "refresh-failed" });

  let refreshed = false;
  await assert.rejects(runCategoryMutation(
    async () => { throw new Error("save failed"); },
    async () => { refreshed = true; return []; },
  ), { message: "save failed" });
  assert.equal(refreshed, false);

  assert.deepEqual(await runCategoryMutation(async () => {}, async () => []), {
    status: "updated",
    categories: [],
  });
});
