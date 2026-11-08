import { NextRequest, NextResponse } from "next/server";
import {
  getCategories,
  getSubcategories,
} from "@/features/products/composition/server";
import { isTargetAudience } from "@/features/products/domain/product";

export async function GET(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("audience");
  const audience = isTargetAudience(value) ? value : undefined;

  try {
    const categories = await getCategories(audience);
    const categoriesWithChildren = await Promise.all(
      categories.map(async (category) => ({
        name: category.name,
        slug: category.slug,
        children: (await getSubcategories(category.id, audience)).map(
          ({ name, slug }) => ({ name, slug }),
        ),
      })),
    );
    return NextResponse.json({
      data: categoriesWithChildren,
    });
  } catch (error) {
    console.error("Failed to load catalog categories:", error);
    return NextResponse.json(
      { error: "Kategórie sa momentálne nepodarilo načítať." },
      { status: 500 },
    );
  }
}
