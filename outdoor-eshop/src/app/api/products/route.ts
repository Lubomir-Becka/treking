import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/features/products/composition/server";
import { normalizeProductLimit } from "@/features/products/application/SearchProducts";
import { isTargetAudience } from "@/features/products/domain/product";
import type { CatalogProductDto } from "@/features/products/contracts/products";
import { isValidCatalogQuery } from "@/features/products/domain/catalogSearch";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") ?? undefined;
  const categorySlug = searchParams.get("category") ?? undefined;
  const rawAudience = searchParams.get("audience");
  const audience = isTargetAudience(rawAudience) ? rawAudience : undefined;
  const rawLimit = searchParams.get("limit");
  const rawColorIds = searchParams.getAll("colorId");
  const colorIds = rawColorIds.map(Number);
  if (
    ["q", "category", "audience", "limit"].some((key) => searchParams.getAll(key).length > 1) ||
    (query !== undefined && !isValidCatalogQuery(query)) ||
    (categorySlug !== undefined && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(categorySlug) || categorySlug.length > 120)) ||
    (rawAudience !== null && !isTargetAudience(rawAudience)) ||
    (rawLimit !== null && (!/^[1-9]\d*$/.test(rawLimit) || Number(rawLimit) > 100)) ||
    colorIds.length > 100 ||
    rawColorIds.some((id) => !/^[1-9]\d*$/.test(id)) ||
    colorIds.some((id) => !Number.isSafeInteger(id) || id < 1 || id > 2_147_483_647)
  ) {
    return NextResponse.json({ error: "Neplatné parametre katalógu." }, { status: 400 });
  }
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
      ...(colorIds.length ? { colorIds } : {}),
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
