import type {
  CatalogProductDto,
  CatalogProductsResponse,
} from "@/features/products/contracts/products";

function isCatalogProduct(item: unknown): item is CatalogProductDto {
  if (typeof item !== "object" || item === null) return false;
  const product = item as Record<string, unknown>;
  return (
    Number.isSafeInteger(product.id) &&
    Number.isSafeInteger(product.colorId) &&
    typeof product.slug === "string" &&
    typeof product.name === "string" &&
    (typeof product.colorName === "string" || product.colorName === null) &&
    (typeof product.hexCode === "string" || product.hexCode === null) &&
    (typeof product.category === "string" || product.category === null) &&
    (typeof product.description === "string" || product.description === null) &&
    typeof product.brand === "string" &&
    (typeof product.price === "string" || product.price === null) &&
    (typeof product.imageUrl === "string" || product.imageUrl === null) &&
    (typeof product.stock === "number" || product.stock === null) &&
    (product.audience === "men" ||
      product.audience === "women" ||
      product.audience === "unisex")
  );
}

function isCatalogProductsResponse(
  value: unknown,
): value is CatalogProductsResponse {
  if (typeof value !== "object" || value === null || !("data" in value) || !Array.isArray(value.data)) {
    return false;
  }
  return value.data.every(isCatalogProduct);
}

export function parseCatalogProductsResponse(
  value: unknown,
): CatalogProductsResponse {
  if (!isCatalogProductsResponse(value)) {
    throw new Error("Odpoveď katalógu nemá platný formát.");
  }
  return value;
}

export async function fetchProducts(
  query: string,
  signal: AbortSignal,
  categorySlug?: string,
  audience?: "men" | "women" | "unisex",
): Promise<CatalogProductDto[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (categorySlug) params.set("category", categorySlug);
  if (audience) params.set("audience", audience);

  const response = await fetch(`/api/products?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error("Nepodarilo sa načítať katalóg produktov.");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Odpoveď katalógu nemá platný formát.");
  }
  return parseCatalogProductsResponse(payload).data;
}
