import { NextResponse } from "next/server";
import { createAdminVariants, deleteEmptyAdminColor, listAdminInventory, saveAdminColor, saveAdminVariant } from "@/features/products/composition/server";
import { parseBatchVariantInput, parseColorInput, parseInventoryId, parseVariantInput, validateBatchVariantInput, validateColorInput, validateVariantInput } from "@/features/products/domain/AdminInventory";
import { adminAccessError } from "@/shared/server/http/adminAccess";
import { isJsonObject, readJsonBody } from "@/shared/server/http/readJsonBody";

type Context = { params: Promise<{ id: string }> };

function inventoryError(error: unknown) {
  const cause = error instanceof Error ? error.cause : error;
  if (typeof cause === "object" && cause !== null && "code" in cause && cause.code === "23505") {
    return NextResponse.json({ error: "Farba, veľkosť alebo SKU už existuje." }, { status: 409 });
  }
  console.error("Product inventory management failed:", error);
  return NextResponse.json({ error: "Zmenu produktu sa nepodarilo vykonať." }, { status: 500 });
}

async function productId(context: Context) {
  const rawId = (await context.params).id;
  return /^[1-9]\d*$/.test(rawId) ? parseInventoryId(Number(rawId)) : null;
}

export async function GET(request: Request, context: Context) {
  try {
    const denied = await adminAccessError(request);
    if (denied) return denied;
    const id = await productId(context);
    if (!id) return NextResponse.json({ error: "Neplatný produkt." }, { status: 400 });
    const colors = await listAdminInventory(id);
    if (!colors) return NextResponse.json({ error: "Produkt neexistuje." }, { status: 404 });
    return NextResponse.json({ data: colors }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return inventoryError(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const denied = await adminAccessError(request, true);
    if (denied) return denied;
    const id = await productId(context);
    const body = await readJsonBody(request);
    if (!id || !body.valid || !isJsonObject(body.body)) {
      return NextResponse.json({ error: "Neplatné údaje." }, { status: 400 });
    }
    const data = body.body;
    let found = false;
    if (data.action === "saveColor") {
      const input = parseColorInput(data.input);
      const colorId = data.colorId === undefined ? undefined : parseInventoryId(data.colorId);
      if (colorId === null) return NextResponse.json({ error: "Neplatná farba." }, { status: 400 });
      if (!input) return NextResponse.json({ error: validateColorInput(data.input) }, { status: 400 });
      found = await saveAdminColor(id, input, colorId);
    } else if (data.action === "createVariants") {
      const colorId = parseInventoryId(data.colorId);
      const input = parseBatchVariantInput(data.input);
      if (!colorId) return NextResponse.json({ error: "Neplatná farba." }, { status: 400 });
      if (!input) return NextResponse.json({ error: validateBatchVariantInput(data.input) }, { status: 400 });
      found = await createAdminVariants(id, colorId, input);
    } else if (data.action === "saveVariant") {
      const colorId = parseInventoryId(data.colorId);
      const variantId = data.variantId === undefined ? undefined : parseInventoryId(data.variantId);
      const input = parseVariantInput(data.input);
      if (!colorId || variantId === null) return NextResponse.json({ error: "Neplatná farba alebo variant." }, { status: 400 });
      if (!input) return NextResponse.json({ error: validateVariantInput(data.input) }, { status: 400 });
      found = await saveAdminVariant(id, colorId, input, variantId);
    } else if (data.action === "deleteColor") {
      const colorId = parseInventoryId(data.colorId);
      if (!colorId) return NextResponse.json({ error: "Neplatná farba." }, { status: 400 });
      const result = await deleteEmptyAdminColor(id, colorId);
      if (result === "in-use") {
        return NextResponse.json({ error: "Farbu s variantmi, obrázkami alebo obľúbenými položkami nemožno odstrániť." }, { status: 409 });
      }
      found = result === "deleted";
    } else {
      return NextResponse.json({ error: "Neplatná operácia." }, { status: 400 });
    }
    if (!found) return NextResponse.json({ error: "Produkt, farba alebo variant neexistuje." }, { status: 404 });
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return inventoryError(error);
  }
}
