import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { authenticate, fetchSessionStatus, logout } from "./AuthApiClient";

test("auth client sends credentials, reads session status, and logs out", async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const fetchMock = mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: String(input), init });
    if (String(input).endsWith("/session")) {
      return Response.json({ data: { authenticated: true } });
    }
    if (String(input) === "/api/admin/auth/login") {
      return Response.json({ data: { role: "admin" } });
    }
    return Response.json({ data: { role: "customer" } });
  });
  try {
    assert.equal(await authenticate("login", { email: "customer@example.com", password: "password" }), "customer");
    assert.equal(await authenticate("admin-login", { email: "admin@example.com", password: "password" }), "admin");
    assert.equal(await fetchSessionStatus(), true);
    await logout();
    assert.deepEqual(requests.map((request) => request.url), [
      "/api/auth/login", "/api/admin/auth/login", "/api/auth/session", "/api/auth/logout",
    ]);
    assert.deepEqual(JSON.parse(String(requests[0].init?.body)), {
      email: "customer@example.com", password: "password",
    });
  } finally {
    fetchMock.mock.restore();
  }
});

test("auth client reports API errors and invalid session data", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () =>
    Response.json({ error: "Nesprávne heslo." }, { status: 401 }));
  try {
    await assert.rejects(authenticate("login", {}), { message: "Nesprávne heslo." });
    fetchMock.mock.mockImplementation(async () => Response.json({ data: {} }));
    await assert.rejects(authenticate("login", {}), { message: "Odpoveď prihlásenia nemá platný formát." });
    await assert.rejects(fetchSessionStatus(), { message: "Session status response is invalid." });
    fetchMock.mock.mockImplementation(async () => Response.json({ data: { role: "admin" } }));
    await assert.rejects(authenticate("login", {}), { message: "Odpoveď prihlásenia nemá platný formát." });
  } finally {
    fetchMock.mock.restore();
  }
});
