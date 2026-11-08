import assert from "node:assert/strict";
import test from "node:test";
import { isValidCreateOrderInput, isValidOrderDetails } from "./OrderValidation";
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
});
