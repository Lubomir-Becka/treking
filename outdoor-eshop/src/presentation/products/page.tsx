import type { ProductDetail } from "@/domain/products/product";
import ProductDetailClient from "./ProductDetailClient";

export default function ProductPage({
  product,
  initialColorId,
}: {
  product: ProductDetail;
  initialColorId?: number;
}) {
  return (
    <ProductDetailClient
      product={product}
      initialColorId={initialColorId}
    />
  );
}
