import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { fetchFavoriteProducts } from "./fetchFavoriteProducts";

test("loads all favorite IDs in bounded batches without using catalog order", async () => {
  const requests: string[][] = [];
  const fetchMock = mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://localhost");
    requests.push(url.searchParams.getAll("colorId"));
    return new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
  try {
    const ids = Array.from({ length: 101 }, (_, index) => index + 1);
    await fetchFavoriteProducts(ids, new AbortController().signal);
    assert.deepEqual(requests.map((request) => request.length), [100, 1]);
    assert.deepEqual(requests.flat().map(Number), ids);
  } finally {
    fetchMock.mock.restore();
  }
});
