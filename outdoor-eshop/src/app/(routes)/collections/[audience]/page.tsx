import { notFound } from "next/navigation";
import { Footer } from "@/app/_components/Footer/Footer";
import { Header } from "@/app/_components/Header/Header";
import { CatalogListingClient } from "@/app/_components/catalog/CatalogListingClient";
import { getCategories, searchProducts } from "@/features/products/composition/server";
import { isTargetAudience } from "@/features/products/domain/product";

const audiences = {
  men: "Páni",
  women: "Dámy",
  unisex: "Unisex",
} as const;

type Props = { params: Promise<{ audience: string }> };

export default async function AudiencePage({ params }: Props) {
  const { audience } = await params;
  if (!isTargetAudience(audience)) notFound();
  const title = audiences[audience];
  const selectedAudience = audience;
  const [products, categories] = await Promise.all([
    searchProducts({ audience: selectedAudience, limit: 100 }),
    getCategories(selectedAudience),
  ]);
  return (
    <>
      <Header />
      <CatalogListingClient
        products={products}
        title={title}
        breadcrumb={[{ label: "Kolekcia", href: "/search" }, { label: title }]}
        audience={selectedAudience}
        categories={categories.map((item) => ({
          name: item.name,
          slug: item.slug,
          imageUrl: item.imageUrl,
        }))}
      />
      <Footer />
    </>
  );
}
