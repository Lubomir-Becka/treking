import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { changeFavoriteColor, fetchFavoriteColorIds } from "./favorites";

test("favorite API validates responses and reports failures", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({ data: [1, 2] }));
  try {
    assert.deepEqual(await fetchFavoriteColorIds(), [1, 2]);
    fetchMock.mock.mockImplementation(async () => Response.json({ data: [0] }));
    await assert.rejects(fetchFavoriteColorIds(), /nie je platná/);
    fetchMock.mock.mockImplementation(async () => Response.json({ data: { success: true } }));
    await changeFavoriteColor(1, true);
    assert.equal(fetchMock.mock.calls.at(-1)?.arguments[1]?.method, "PUT");
    await changeFavoriteColor(1, false);
    assert.equal(fetchMock.mock.calls.at(-1)?.arguments[1]?.method, "DELETE");
    fetchMock.mock.mockImplementation(async () => Response.json({ data: {} }));
    await assert.rejects(changeFavoriteColor(1, true), /nie je známy/);
    fetchMock.mock.mockImplementation(async () => Response.json({ error: "Unauthorized" }, { status: 401 }));
    await assert.rejects(fetchFavoriteColorIds(), /Prihláste/);
  } finally {
    fetchMock.mock.restore();
  }
});
