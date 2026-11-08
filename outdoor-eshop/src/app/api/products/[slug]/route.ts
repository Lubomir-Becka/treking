import { NextResponse } from "next/server";
import { getProductDetail } from "@/features/products/composition/server";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  if (slug.length > 180 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ error: "Neplatný identifikátor produktu." }, { status: 400 });
  }

  try {
    const product = await getProductDetail(slug);

    if (!product) {
      return NextResponse.json(
        { error: "Produkt neexistuje." },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error(`Failed to load product "${slug}":`, error);
    return NextResponse.json(
      { error: "Detail produktu sa momentálne nepodarilo načítať." },
      { status: 500 },
    );
  }
}
