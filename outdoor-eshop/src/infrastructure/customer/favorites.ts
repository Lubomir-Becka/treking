import type { FavoriteColorRepository } from "@/domain/customer/FavoriteColorRepository";

const FAVORITE_COLORS_KEY = "vertex-favorite-colors";
const FAVORITE_COLORS_CHANGED = "vertex-favorite-colors-changed";

export function parseFavoriteColorIds(value: string | null): number[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return Array.from(
      new Set(
        parsed.filter(
          (id): id is number =>
            Number.isSafeInteger(id) && typeof id === "number" && id > 0,
        ),
      ),
    );
  } catch {
    return [];
  }
}

export function getFavoriteColorIds(): number[] {
  return parseFavoriteColorIds(
    window.localStorage.getItem(FAVORITE_COLORS_KEY),
  );
}

export function setFavoriteColor(
  colorId: number,
  shouldBeFavorite: boolean,
): number[] {
  const favoriteIds = getFavoriteColorIds();
  const nextIds = shouldBeFavorite
    ? Array.from(new Set([...favoriteIds, colorId]))
    : favoriteIds.filter((id) => id !== colorId);

  window.localStorage.setItem(FAVORITE_COLORS_KEY, JSON.stringify(nextIds));
  window.dispatchEvent(new Event(FAVORITE_COLORS_CHANGED));

  return nextIds;
}

export const localStorageFavoriteColorRepository: FavoriteColorRepository = {
  getFavoriteColorIds,
  setFavoriteColor,
  subscribe(listener) {
    const handleChange = () => listener();
    window.addEventListener(FAVORITE_COLORS_CHANGED, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(FAVORITE_COLORS_CHANGED, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  },
};
