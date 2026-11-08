import assert from "node:assert/strict";
import test from "node:test";
import { isValidPersonName, isValidPhone, isValidRegistration, validateRegistration } from "./contactValidation";

test("validates names and phone numbers", () => {
  assert.equal(isValidPersonName(" Jana "), true);
  assert.equal(isValidPersonName(" "), false);
  assert.equal(isValidPersonName("Jana\0"), false);
  assert.equal(isValidPersonName("\nJana"), false);
  assert.equal(isValidPersonName(`${" ".repeat(50)}J`), false);
  assert.equal(isValidPhone("+421 900 123 456"), true);
  assert.equal(isValidPhone("abcdefg"), false);
  assert.equal(isValidPhone("123-45"), false);
});

test("reports the invalid registration field", () => {
  const input = { email: "jana@example.com", firstName: "Jana", lastName: "Nová", password: "password" };
  assert.equal(validateRegistration(input), null);
  assert.match(validateRegistration({ ...input, lastName: " " }) ?? "", /Priezvisko/);
  assert.match(validateRegistration({ ...input, email: "bad" }) ?? "", /e-mailovú/);
  assert.match(validateRegistration({ ...input, password: "é".repeat(37) }) ?? "", /72 bajtov/);
  assert.match(validateRegistration({ ...input, phone: "123" }) ?? "", /Telefón/);
});

test("validates registration values including the bcrypt byte limit", () => {
  const valid = { email: "jana@example.com", firstName: "Jana", lastName: "Nová", password: "password" };
  assert.equal(isValidRegistration(valid), true);
  assert.equal(isValidRegistration({ ...valid, phone: " " }), true);
  assert.equal(isValidRegistration({ ...valid, phone: "abcdefgh" }), false);
  assert.equal(isValidRegistration({ ...valid, phone: " ".repeat(21) }), false);
  assert.equal(isValidRegistration({ ...valid, phone: "\n1234567" }), false);
  assert.equal(isValidRegistration({ ...valid, email: `\n${valid.email}` }), false);
  assert.equal(isValidRegistration({ ...valid, password: "é".repeat(37) }), false);
});
