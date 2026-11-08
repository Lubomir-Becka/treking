import assert from "node:assert/strict";
import { mock, test } from "node:test";
import {
  CategoryMutationOutcomeUnknown,
  deleteAdminCategory,
  fetchAdminCategories,
  saveAdminCategory,
} from "./AdminCategoryApiClient";

test("category mutations require a valid success response and report errors", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () =>
    Response.json({ data: { success: true } }));
  try {
    await saveAdminCategory({ name: "Test", slug: "test", parentId: null });
    await deleteAdminCategory(1);
    fetchMock.mock.mockImplementation(async () => Response.json({ data: {} }));
    await assert.rejects(deleteAdminCategory(1), CategoryMutationOutcomeUnknown);
    fetchMock.mock.mockImplementation(async () => Response.json({ error: "Konflikt." }, { status: 409 }));
    await assert.rejects(deleteAdminCategory(1), { message: "Konflikt." });
    fetchMock.mock.mockImplementation(async () => Response.json({ error: "Chyba." }, { status: 500 }));
    await assert.rejects(deleteAdminCategory(1), CategoryMutationOutcomeUnknown);
    fetchMock.mock.mockImplementation(async () => Response.json({ error: "Timeout." }, { status: 408 }));
    await assert.rejects(saveAdminCategory({ name: "Test", slug: "test", parentId: null }, 1), CategoryMutationOutcomeUnknown);
    fetchMock.mock.mockImplementation(async () => new Response("invalid"));
    await assert.rejects(deleteAdminCategory(1), CategoryMutationOutcomeUnknown);
    await assert.rejects(fetchAdminCategories(), /Odpoveď servera nie je platná/);
    fetchMock.mock.mockImplementation(async () => { throw new TypeError("fetch failed"); });
    await assert.rejects(deleteAdminCategory(1), CategoryMutationOutcomeUnknown);
    await assert.rejects(fetchAdminCategories(), /Spojenie so serverom zlyhalo/);
  } finally {
    fetchMock.mock.restore();
  }
});
