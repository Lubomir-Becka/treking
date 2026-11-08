import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { fetchShippingOptions, submitOrder, OrderOutcomeUnknownError } from "./CheckoutApiClient";

const details = {
  email: "customer@example.com",
  firstName: "Jana",
  lastName: "Nova",
  street: "Ulica 1",
  city: "Zilina",
  postalCode: "01001",
  phone: "0912345678",
  country: "SK",
  note: "",
  shippingMethod: "courier" as const,
};

test("loads and validates shipping options", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({
    data: { options: [{ code: "courier", name: "Kuriér", price: 5.9 }] },
  }));
  try {
    assert.deepEqual(await fetchShippingOptions(), [{ code: "courier", name: "Kuriér", price: 5.9 }]);
  } finally {
    fetchMock.mock.restore();
  }
});

test("rejects malformed or unavailable shipping options", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({
    data: { options: [{ code: "packeta", name: "Packeta", price: 1 }] },
  }));
  try {
    await assert.rejects(fetchShippingOptions(), { message: "Odpoveď spôsobov dopravy nemá platný formát." });
  } finally {
    fetchMock.mock.restore();
  }
});

test("submits checkout details and preserves order API errors", async () => {
  const calls: RequestInit[] = [];
  const fetchMock = mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
    if (init) calls.push(init);
    return calls.length === 1
      ? Response.json({ data: { orderNumber: "VT-123", totalPrice: 42 } }, { status: 201 })
      : Response.json({ error: "Košík je prázdny." }, { status: 409 });
  });
  try {
    assert.deepEqual(await submitOrder(details), { orderNumber: "VT-123", totalPrice: 42 });
    assert.deepEqual(JSON.parse(String(calls[0].body)), { ...details, paymentMethod: "cod" });
    await assert.rejects(submitOrder(details), { message: "Košík je prázdny." });
  } finally {
    fetchMock.mock.restore();
  }
});

test("rejects malformed order responses and network failures", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({ data: {} }));
  try {
    await assert.rejects(submitOrder(details), OrderOutcomeUnknownError);
    fetchMock.mock.mockImplementation(async () => { throw new Error("network"); });
    await assert.rejects(submitOrder(details), OrderOutcomeUnknownError);
    fetchMock.mock.mockImplementation(async () => Response.json({ error: "Server error" }, { status: 500 }));
    await assert.rejects(submitOrder(details), OrderOutcomeUnknownError);
  } finally {
    fetchMock.mock.restore();
  }
});
