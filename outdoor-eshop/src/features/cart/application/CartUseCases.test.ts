import assert from "node:assert/strict";
import test from "node:test";
import { createCartUseCases } from "./CartUseCases";
import type { CartRepository } from "../domain/CartRepository";

const repository: CartRepository = {
  get: async () => ({ id: 1, items: [] }),
  addItem: async () => ({ id: 1, items: [] }),
  updateItem: async () => ({ id: 1, items: [] }),
  removeItem: async () => ({ id: 1, items: [] }),
  mergeGuestCart: async () => {},
};

test("rejects invalid cart item IDs before calling the repository", async () => {
  const cartUseCases = createCartUseCases(repository);

  assert.throws(
    () => cartUseCases.updateItem({ type: "authenticated", userId: 1 }, 0, 1),
    { message: "INVALID_ITEM" },
  );
  assert.throws(
    () => cartUseCases.removeItem({ type: "authenticated", userId: 1 }, -1),
    { message: "INVALID_ITEM" },
  );
});

test("delegates guest cart merging to the repository", async () => {
  let mergedCart: { guestTokenHash: string; userId: number } | null = null;
  const cartUseCases = createCartUseCases({
    ...repository,
    mergeGuestCart: async (guestTokenHash, userId) => {
      mergedCart = { guestTokenHash, userId };
    },
  });

  await cartUseCases.mergeGuestCart("hashed-guest-token", 42);

  assert.deepEqual(mergedCart, {
    guestTokenHash: "hashed-guest-token",
    userId: 42,
  });
});
