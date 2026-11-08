import { notFound } from "next/navigation";
import { getProductDetail } from "@/composition/server/products";
import ProductPage from "@/presentation/products/page";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ colorId?: string }>;
};

export default async function ProductRoute({ params, searchParams }: Props) {
  const [{ slug }, { colorId }] = await Promise.all([params, searchParams]);
  const product = await getProductDetail(slug);

  if (!product) {
    notFound();
  }

  const selectedColorId = colorId ? Number(colorId) : undefined;
  return (
    <ProductPage
      product={product}
      initialColorId={
        Number.isInteger(selectedColorId) ? selectedColorId : undefined
      }
    />
  );
}
