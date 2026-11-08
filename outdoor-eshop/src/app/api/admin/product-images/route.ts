import { NextResponse } from "next/server";
import { listProductImages } from "@/features/products/composition/server";
import { adminAccessError } from "@/shared/server/http/adminAccess";

export async function GET(request: Request) {
  try {
    const error = await adminAccessError(request);
    if (error) return error;
    return NextResponse.json({ data: await listProductImages() }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Loading product images failed:", error);
    return NextResponse.json({ error: "Obrázky sa nepodarilo načítať." }, { status: 500 });
  }
}
