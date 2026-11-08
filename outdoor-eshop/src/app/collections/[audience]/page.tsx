import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { CatalogListingClient } from "@/presentation/products/catalog/CatalogListingClient";
import { getCategories, searchProducts } from "@/composition/server/products";
import { isTargetAudience } from "@/domain/products/product";

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
          count: item.productCount,
          imageUrl: item.imageUrl,
        }))}
      />
      <Footer />
    </>
  );
}
