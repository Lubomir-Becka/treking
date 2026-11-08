import assert from "node:assert/strict";
import test from "node:test";
import { isSameOrigin } from "./sameOrigin";

test("accepts only matching scheme and host for state-changing requests", () => {
  function request(origin: string | null, host = "127.0.0.1:3000") {
    const headers = new Headers({ host });
    if (origin !== null) headers.set("origin", origin);
    return new Request("http://localhost:3000/api/admin/categories", { headers });
  }

  assert.equal(isSameOrigin(request("http://127.0.0.1:3000")), true);
  assert.equal(isSameOrigin(request("https://127.0.0.1:3000")), false);
  assert.equal(isSameOrigin(request("http://evil.example")), false);
  assert.equal(isSameOrigin(request("http://127.0.0.1:3000/path")), false);
  assert.equal(isSameOrigin(request("null")), false);
  assert.equal(isSameOrigin(request(null)), false);
  assert.equal(isSameOrigin(request("http://127.0.0.1:3000", "")), false);
});
