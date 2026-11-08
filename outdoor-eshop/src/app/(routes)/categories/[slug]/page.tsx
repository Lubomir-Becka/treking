import { notFound } from "next/navigation";
import { Footer } from "@/app/_components/Footer/Footer";
import { Header } from "@/app/_components/Header/Header";
import { CatalogListingClient } from "@/app/_components/catalog/CatalogListingClient";
import {
  getCategory,
  getSubcategories,
  searchProducts,
} from "@/features/products/composition/server";
import { isTargetAudience } from "@/features/products/domain/product";

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
          imageUrl: item.imageUrl,
        }))}
      />
      <Footer />
    </>
  );
}
