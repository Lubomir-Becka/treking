import { NextResponse } from "next/server";
import { saveAdminProduct, setProductActive } from "@/features/products/composition/server";
import { parseAdminProduct } from "@/features/products/domain/AdminProducts";
import { isCategoryId } from "@/features/products/domain/CategoryManagement";
import { adminAccessError } from "@/shared/server/http/adminAccess";
import { isJsonObject, readJsonBody } from "@/shared/server/http/readJsonBody";
import { productError } from "../productRequest";

type Context = { params: Promise<{ id: string }> };

async function change(request: Request, context: Context, operation: "update" | "active") {
  try {
    const denied = await adminAccessError(request, true);
    if (denied) return denied;
    const rawId = (await context.params).id;
    const id = Number(rawId);
    if (!/^[1-9]\d*$/.test(rawId) || !isCategoryId(id)) {
      return NextResponse.json({ error: "Neplatný produkt." }, { status: 400 });
    }
    const body = await readJsonBody(request);
    if (!body.valid) return NextResponse.json({ error: "Neplatné údaje." }, { status: 400 });
    let found: boolean;
    if (operation === "update") {
      const input = parseAdminProduct(body.body);
      if (!input) return NextResponse.json({ error: "Skontrolujte údaje produktu." }, { status: 400 });
      found = await saveAdminProduct(input, id);
    } else {
      if (!isJsonObject(body.body) || typeof body.body.active !== "boolean") {
        return NextResponse.json({ error: "Neplatný stav produktu." }, { status: 400 });
      }
      found = await setProductActive(id, body.body.active);
    }
    if (!found) return NextResponse.json({ error: "Produkt neexistuje." }, { status: 404 });
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return productError(error);
  }
}

export function PUT(request: Request, context: Context) {
  return change(request, context, "update");
}

export function PATCH(request: Request, context: Context) {
  return change(request, context, "active");
}
