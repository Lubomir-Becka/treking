import assert from "node:assert/strict";
import test from "node:test";
import { isValidCreateOrderInput } from "./OrderValidation";
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
  shippingMethod: "packeta",
  paymentMethod: "cod",
};

test("accepts valid order details", () => {
  assert.equal(isValidCreateOrderInput(validOrder), true);
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
