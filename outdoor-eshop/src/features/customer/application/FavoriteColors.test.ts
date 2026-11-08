import assert from "node:assert/strict";
import test from "node:test";
import type { FavoriteColorRepository } from "@/features/customer/domain/FavoriteColorRepository";
import { createFavoriteColorUseCases } from "./FavoriteColors";

test("favorite-color use cases delegate storage and subscriptions to the repository", () => {
  let favoriteIds = [12];
  let subscriber: (() => void) | undefined;
  const repository: FavoriteColorRepository = {
    getFavoriteColorIds: () => favoriteIds,
    setFavoriteColor: (colorId, shouldBeFavorite) => {
      favoriteIds = shouldBeFavorite
        ? [...favoriteIds, colorId]
        : favoriteIds.filter((id) => id !== colorId);
      return favoriteIds;
    },
    subscribe: (listener) => {
      subscriber = listener;
      return () => {
        subscriber = undefined;
      };
    },
  };
  const favorites = createFavoriteColorUseCases(repository);

  assert.deepEqual(favorites.getFavoriteColorIds(), [12]);
  assert.deepEqual(favorites.setFavoriteColor(13, true), [12, 13]);

  let notified = false;
  const unsubscribe = favorites.subscribe(() => {
    notified = true;
  });
  subscriber?.();
  assert.equal(notified, true);
  unsubscribe();
  assert.equal(subscriber, undefined);
});

test("favorite-color use cases reject invalid color IDs", () => {
  const repository: FavoriteColorRepository = {
    getFavoriteColorIds: () => [],
    setFavoriteColor: () => [],
    subscribe: () => () => {},
  };
  const favorites = createFavoriteColorUseCases(repository);

  assert.throws(() => favorites.setFavoriteColor(0, true), {
    message: "INVALID_FAVORITE_COLOR",
  });
});
