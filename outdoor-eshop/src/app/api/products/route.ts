import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/composition/server/products";
import { normalizeProductLimit } from "@/application/products/SearchProducts";
import { isTargetAudience } from "@/domain/products/product";
import type { CatalogProductDto } from "@/presentation/products/contracts/CatalogProductDto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") ?? undefined;
  const categorySlug = searchParams.get("category") ?? undefined;
  const rawAudience = searchParams.get("audience");
  const audience = isTargetAudience(rawAudience) ? rawAudience : undefined;
  const rawLimit = searchParams.get("limit");
  const requestedLimit = rawLimit === null ? undefined : Number(rawLimit);
  const limit = normalizeProductLimit(
    requestedLimit !== undefined && Number.isInteger(requestedLimit)
      ? requestedLimit
      : undefined,
  );

  try {
    const data = await searchProducts({
      query,
      categorySlug,
      audience,
      limit,
    });
    const catalogProducts: CatalogProductDto[] = data.map((product) => ({
      id: product.id,
      colorId: product.colorId,
      slug: product.slug,
      name: product.name,
      colorName: product.colorName,
      hexCode: product.hexCode,
      category: product.category,
      description: product.description,
      brand: product.brand,
      price: product.price,
      imageUrl: product.imageUrl,
      stock: product.stock,
      audience: product.audience,
    }));

    return NextResponse.json({
      data: catalogProducts,
      meta: {
        count: catalogProducts.length,
        limit,
        query: query?.trim() || null,
        category: categorySlug?.trim() || null,
      },
    });
  } catch (error) {
    console.error("Failed to load products:", error);
    return NextResponse.json(
      { error: "Katalóg produktov sa momentálne nepodarilo načítať." },
      { status: 500 },
    );
  }
}
