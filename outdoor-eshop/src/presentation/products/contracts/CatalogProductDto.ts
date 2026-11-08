export type CatalogProductDto = {
  id: number;
  colorId: number;
  slug: string;
  name: string;
  colorName: string | null;
  hexCode: string | null;
  category: string | null;
  description: string | null;
  brand: string;
  price: string | null;
  imageUrl: string | null;
  stock: number | null;
  audience: "men" | "women" | "unisex";
};

export type CatalogProductsResponse = {
  data: CatalogProductDto[];
};
