import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_PRODUCT_LIMIT,
  normalizeProductLimit,
} from "@/modules/products/application/SearchProducts";
import { searchProducts } from "@/modules/products/composition";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") ?? undefined;
  const categorySlug = searchParams.get("category") ?? undefined;
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
      limit,
    });

    return NextResponse.json({
      data,
      meta: {
        count: data.length,
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
