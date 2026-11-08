import { NextResponse } from "next/server";
import { createAdminProduct, listAdminProducts } from "@/features/products/composition/server";
import { parseAdminProduct, validateAdminProduct } from "@/features/products/domain/AdminProducts";
import { adminAccessError } from "@/shared/server/http/adminAccess";
import { readJsonBody } from "@/shared/server/http/readJsonBody";
import { productError } from "./productRequest";

export async function GET(request: Request) {
  try {
    const denied = await adminAccessError(request);
    if (denied) return denied;
    return NextResponse.json({ data: await listAdminProducts() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return productError(error);
  }
}

export async function POST(request: Request) {
  try {
    const denied = await adminAccessError(request, true);
    if (denied) return denied;
    const body = await readJsonBody(request);
    const input = body.valid ? parseAdminProduct(body.body) : null;
    if (!input) return NextResponse.json({ error: body.valid ? validateAdminProduct(body.body) : "Neplatné údaje produktu." }, { status: 400 });
    const id = await createAdminProduct(input);
    return NextResponse.json({ data: { success: true, id } }, { status: 201 });
  } catch (error) {
    return productError(error);
  }
}
