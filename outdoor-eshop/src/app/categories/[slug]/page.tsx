import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { CatalogListingClient } from "@/presentation/products/catalog/CatalogListingClient";
import {
  getCategory,
  getSubcategories,
  searchProducts,
} from "@/composition/server/products";
import { isTargetAudience } from "@/domain/products/product";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; audience?: string }>;
};

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const filters = await searchParams;
  const category = await getCategory(slug);
  if (!category) notFound();
  const audience = isTargetAudience(filters.audience) ? filters.audience : undefined;

  const [products, subcategories] = await Promise.all([
    searchProducts({
      categorySlug: slug,
      query: filters.q,
      audience,
      limit: 100,
    }),
    getSubcategories(category.id, audience),
  ]);

  return (
    <>
      <Header />
      <CatalogListingClient
        products={products}
        title={category.name}
        breadcrumb={[
          { label: "Kategórie", href: "/search" },
          { label: category.name },
        ]}
        query={filters.q}
        audience={audience}
        subcategories={subcategories.map((item) => ({
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
