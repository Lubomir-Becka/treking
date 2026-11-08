import assert from "node:assert/strict";
import test from "node:test";
import { parseCategoryRequest } from "./categoryRequest";

function request(body: unknown) {
  return new Request("http://localhost/api/admin/categories", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("returns specific validation errors and rejects invalid input types", async () => {
  assert.deepEqual(await parseCategoryRequest(request({
    name: "",
    slug: "category",
    parentId: null,
  })), {
    valid: false,
    error: "Názov je povinný a môže mať najviac 100 znakov.",
  });
  assert.deepEqual(await parseCategoryRequest(request({
    name: "Category",
    slug: "category",
    parentId: 2_147_483_648,
  })), {
    valid: false,
    error: "Vyberte platnú nadradenú kategóriu.",
  });
  assert.equal((await parseCategoryRequest(request({
    name: "Category",
    slug: "category",
    parentId: "1",
  }))).valid, false);
  assert.deepEqual(await parseCategoryRequest(request({
    name: "Bad\u0000name",
    slug: "category",
    parentId: null,
  })), {
    valid: false,
    error: "Názov nesmie obsahovať riadiace znaky.",
  });
});
