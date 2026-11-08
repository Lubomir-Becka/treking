import assert from "node:assert/strict";
import test from "node:test";
import { isValidCreateOrderInput } from "@/domain/checkout/OrderValidation";
import { parseOrderBody } from "./parseOrderBody";

const validOrder = {
  email: "customer@example.com",
  shippingMethod: "packeta",
  firstName: "Jana",
  lastName: "Nová",
  street: "Horská 1",
  city: "Poprad",
  postalCode: "058 01",
  phone: "+421900000000",
  country: "SK",
  note: "Zavolať pred doručením",
  paymentMethod: "cod",
};

test("parses supported order fields without accepting unchecked enum values", () => {
  assert.deepEqual(parseOrderBody(validOrder), validOrder);
  assert.equal(
    parseOrderBody({ ...validOrder, paymentMethod: "unknown" }),
    null,
  );
  assert.equal(
    parseOrderBody({ ...validOrder, shippingMethod: "unknown" }),
    null,
  );
});

test("rejects non-object bodies and invalid field types", () => {
  assert.equal(parseOrderBody(null), null);
  assert.equal(parseOrderBody([]), null);
  assert.equal(parseOrderBody({ ...validOrder, phone: 123 }), null);
  assert.equal(parseOrderBody({ ...validOrder, note: false }), null);
  assert.equal(parseOrderBody({ ...validOrder, paymentMethod: "card" }), null);
});

test("leaves business validation to the order use case", () => {
  const parsed = parseOrderBody({ ...validOrder, email: "not-an-email" });
  assert.ok(parsed);
  assert.equal(isValidCreateOrderInput({ ...parsed, userId: 1 }), false);
});

test("allows omitted optional address details", () => {
  const { country: _country, note: _note, ...requiredFields } = validOrder;
  assert.deepEqual(parseOrderBody(requiredFields), requiredFields);
});
