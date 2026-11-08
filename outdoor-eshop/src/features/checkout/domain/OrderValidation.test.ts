import assert from "node:assert/strict";
import test from "node:test";
import { isValidCreateOrderInput, isValidOrderDetails, validateOrderDetails } from "./OrderValidation";
import type { CreateOrderInput } from "./OrderRepository";

const validOrder: CreateOrderInput = {
  userId: 1,
  email: "customer@example.com",
  firstName: "Jana",
  lastName: "Horská",
  street: "Horská 1",
  city: "Poprad",
  postalCode: "05801",
  phone: "+421900000000",
  country: "SK",
  note: "",
  shippingMethod: "courier",
  paymentMethod: "cod",
};

test("accepts valid order details", () => {
  assert.equal(isValidCreateOrderInput(validOrder), true);
  const { userId: _userId, paymentMethod: _paymentMethod, ...details } = validOrder;
  assert.equal(isValidOrderDetails(details), true);
  assert.equal(isValidOrderDetails({ ...details, phone: "123" }), false);
});

test("reports specific checkout validation errors", () => {
  assert.match(validateOrderDetails({ ...validOrder, phone: "123" }) ?? "", /telefónne/);
  assert.match(validateOrderDetails({ ...validOrder, postalCode: "abc" }) ?? "", /PSČ/);
  assert.match(validateOrderDetails({ ...validOrder, firstName: "a".repeat(50), lastName: "b".repeat(50) }) ?? "", /spolu/);
  assert.match(validateOrderDetails({ ...validOrder, note: "x".repeat(2001) }) ?? "", /Poznámka/);
  assert.match(validateOrderDetails({ ...validOrder, country: "SVK" }) ?? "", /Krajina/);
});

test("rejects invalid email, required fields, and oversized notes", () => {
  assert.equal(
    isValidCreateOrderInput({ ...validOrder, email: "not-an-email" }),
    false,
  );
  assert.equal(
    isValidCreateOrderInput({ ...validOrder, firstName: " " }),
    false,
  );
  assert.equal(
    isValidCreateOrderInput({ ...validOrder, note: "x".repeat(2001) }),
    false,
  );
  assert.equal(isValidCreateOrderInput({ ...validOrder, phone: "abcdefgh" }), false);
  assert.equal(isValidCreateOrderInput({ ...validOrder, postalCode: "abcd" }), false);
  assert.equal(isValidCreateOrderInput({ ...validOrder, postalCode: "058 01" }), true);
  assert.equal(isValidCreateOrderInput({ ...validOrder, street: "Street\0" }), false);
});
