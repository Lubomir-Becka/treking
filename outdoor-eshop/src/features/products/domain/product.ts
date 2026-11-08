export type ProductVariant = {
  id: number;
  sku: string;
  size: string | null;
  price: number;
  stock: number;
};

export type ProductImage = {
  url: string;
  alt: string;
  order: number;
  isPrimary: boolean;
};

export type ProductColor = {
  id: number;
  name: string;
  hexCode: string;
  images: ProductImage[];
  variants: ProductVariant[];
};

export type ProductDetail = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  brand: string;
  category: string | null;
  categorySlug: string | null;
  audience: TargetAudience;
  price: number | null;
  colors: ProductColor[];
};

export type ProductListItem = {
  id: number;
  colorId: number;
  name: string;
  slug: string;
  colorName: string | null;
  hexCode: string | null;
  description: string | null;
  brand: string;
  category: string | null;
  categorySlug: string | null;
  audience: TargetAudience;
  price: string | null;
  imageUrl: string | null;
  stock: number | null;
};

export type ProductSearchCriteria = {
  query?: string;
  categorySlug?: string;
  audience?: TargetAudience;
  limit?: number;
  colorIds?: number[];
  slugs?: string[];
  offset?: number;
  maxPrice?: string;
  stockOnly?: boolean;
  sort?: "featured" | "price-asc" | "price-desc";
};

export type TargetAudience = "men" | "women" | "unisex";

export function isTargetAudience(value: unknown): value is TargetAudience {
  return value === "men" || value === "women" || value === "unisex";
}

export type CategorySummary = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  imageUrl: string | null;
  productCount: number;
};
