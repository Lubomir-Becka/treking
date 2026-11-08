import assert from "node:assert/strict";
import test from "node:test";
import type { PasswordServicePort } from "../domain/PasswordServicePort";
import type {
  UserAccount,
  UserAccountRepository,
} from "../domain/UserAccountRepository";
import { createUpdateCustomerProfile } from "./UpdateCustomerProfile";

const user: UserAccount = {
  id: 7,
  email: "customer@example.com",
  firstName: "Jana",
  lastName: "Nová",
  phone: "+421900123456",
  passwordHash: "hashed-password",
  isActive: true,
  role: "customer",
};

function setup(existingEmail?: string) {
  let updated: UserAccount | null = null;
  let verifyCalls = 0;
  const accounts: UserAccountRepository = {
    async findByEmail(email) {
      return email === existingEmail
        ? { ...user, id: 8, email }
        : email === user.email
          ? user
          : null;
    },
    async findById() {
      return user;
    },
    async create() {
      return user;
    },
    async updateProfile(id, input) {
      updated = { ...user, id, ...input };
      return updated;
    },
  };
  const passwords: PasswordServicePort = {
    async hash(password) {
      return password;
    },
    async verify(password, passwordHash) {
      verifyCalls += 1;
      return password === "correct-password" && passwordHash === user.passwordHash;
    },
  };

  return {
    update: createUpdateCustomerProfile(accounts, passwords),
    getUpdated: () => updated,
    getVerifyCalls: () => verifyCalls,
  };
}

test("updates a customer's name without requiring a password", async () => {
  const setupResult = setup();
  const result = await setupResult.update(7, {
    firstName: "  Jana ",
    lastName: " Nováková ",
  });

  assert.equal(result.firstName, "Jana");
  assert.equal(result.lastName, "Nováková");
  assert.equal(setupResult.getVerifyCalls(), 0);
});

test("requires the current password to change email", async () => {
  const setupResult = setup();

  await assert.rejects(
    setupResult.update(7, {
      firstName: "Jana",
      lastName: "Nová",
      email: "new@example.com",
    }),
    { message: "INVALID_CREDENTIALS" },
  );
  assert.equal(setupResult.getUpdated(), null);
});

test("verifies the password and normalizes a new email", async () => {
  const setupResult = setup();
  const result = await setupResult.update(7, {
    firstName: "Jana",
    lastName: "Nová",
    email: "  NEW@example.com ",
    currentPassword: "correct-password",
  });

  assert.equal(result.email, "new@example.com");
  assert.equal(setupResult.getVerifyCalls(), 1);
});

test("rejects an email already used by another customer", async () => {
  const setupResult = setup("taken@example.com");

  await assert.rejects(
    setupResult.update(7, {
      firstName: "Jana",
      lastName: "Nová",
      email: "taken@example.com",
      currentPassword: "correct-password",
    }),
    { message: "EMAIL_ALREADY_REGISTERED" },
  );
  assert.equal(setupResult.getUpdated(), null);
});

test("rejects an empty email instead of silently ignoring it", async () => {
  const setupResult = setup();

  await assert.rejects(
    setupResult.update(7, {
      firstName: "Jana",
      lastName: "Nová",
      email: " ",
    }),
    { message: "INVALID_EMAIL" },
  );
});

test("rejects control characters in names", async () => {
  const setupResult = setup();
  await assert.rejects(
    setupResult.update(7, { firstName: "Jana\0", lastName: "Nová" }),
    { message: "INVALID_PROFILE" },
  );
});

test("updates, clears or preserves an optional phone without requiring a password", async () => {
  const setupResult = setup();
  const input = { firstName: "Jana", lastName: "Nová" };
  const updated = await setupResult.update(7, { ...input, phone: " +421 900 123 456 " });
  assert.equal(updated.phone, "+421 900 123 456");
  assert.equal(setupResult.getVerifyCalls(), 0);
  const cleared = await setupResult.update(7, { ...input, phone: " " });
  assert.equal(cleared.phone, null);
  const unchanged = await setupResult.update(7, input);
  assert.equal(unchanged.phone, user.phone);
});

test("rejects invalid phone numbers before updating the profile", async () => {
  const setupResult = setup();
  for (const phone of ["123", "abcdefgh", "1".repeat(21), "\n1234567"]) {
    await assert.rejects(
      setupResult.update(7, { firstName: "Jana", lastName: "Nová", phone }),
      { message: "INVALID_PHONE" },
    );
    assert.equal(setupResult.getUpdated(), null);
  }
});
