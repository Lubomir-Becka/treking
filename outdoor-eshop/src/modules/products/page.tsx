import { notFound } from "next/navigation";
import { getProductDetail } from "./composition";
import ProductDetailClient from "./ProductDetailClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductDetail(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
