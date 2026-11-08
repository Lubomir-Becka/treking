export interface FavoriteColorRepository {
  getFavoriteColorIds(): number[];
  setFavoriteColor(colorId: number, shouldBeFavorite: boolean): number[];
  subscribe(listener: () => void): () => void;
}
