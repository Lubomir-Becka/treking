export type CartActor =
  | { type: "guest"; tokenHash: string }
  | { type: "authenticated"; userId: number };

export type CartItem = {
  id: number;
  variantId: number;
  productName: string;
  slug: string;
  imageUrl: string | null;
  colorName: string | null;
  size: string | null;
  sku: string;
  unitPrice: number;
  stock: number;
  quantity: number;
};

export type Cart = {
  id: number;
  items: CartItem[];
};
