import { parseCatalogProductsResponse } from "./ProductApiClient";
import type { CatalogProductDto } from "@/features/products/contracts/products";

export async function fetchFavoriteProducts(
  favoriteIds: number[],
  signal: AbortSignal,
): Promise<CatalogProductDto[]> {
  const results: CatalogProductDto[] = [];
  for (let index = 0; index < favoriteIds.length; index += 100) {
    const params = new URLSearchParams({ limit: "100" });
    for (const id of favoriteIds.slice(index, index + 100)) {
      params.append("colorId", String(id));
    }
    const response = await fetch(`/api/products?${params}`, { signal });
    if (!response.ok) throw new Error("Produkty sa nepodarilo načítať.");
    const payload = parseCatalogProductsResponse(await response.json());
    results.push(...payload.data);
  }
  return results;
}
