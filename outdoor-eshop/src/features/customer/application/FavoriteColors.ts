import type { FavoriteColorRepository } from "@/features/customer/domain/FavoriteColorRepository";

export function createFavoriteColorUseCases(repository: FavoriteColorRepository) {
  return {
    getFavoriteColorIds() {
      return repository.getFavoriteColorIds();
    },
    setFavoriteColor(colorId: number, shouldBeFavorite: boolean) {
      if (!Number.isSafeInteger(colorId) || colorId < 1) {
        throw new Error("INVALID_FAVORITE_COLOR");
      }
      return repository.setFavoriteColor(colorId, shouldBeFavorite);
    },
    subscribe(listener: () => void) {
      return repository.subscribe(listener);
    },
  };
}
