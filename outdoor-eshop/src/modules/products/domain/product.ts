export type ProductAttribute = {
  label: string;
  unit: string | null;
  value: string;
};

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
  price: number | null;
  attributes: ProductAttribute[];
  colors: ProductColor[];
};

export type ProductListItem = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  brand: string;
  category: string | null;
  categorySlug: string | null;
  price: string | null;
  imageUrl: string | null;
  filterText: string | null;
  stock: number | null;
};

export type ProductSearchCriteria = {
  query?: string;
  categorySlug?: string;
  audience?: "men" | "women" | "kids" | "unisex";
  limit?: number;
};

export type CatalogSort =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "newest";

export type CatalogFilterCriteria = ProductSearchCriteria & {
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: CatalogSort;
};

export type CategorySummary = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  productCount: number;
};
