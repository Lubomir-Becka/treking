import { NextResponse } from "next/server";
import { cartUseCases } from "@/features/cart/composition/server";
import { resolveCartActor } from "@/shared/composition/server";
import { isJsonObject, readJsonBody } from "@/shared/server/http/readJsonBody";
import { originError } from "@/shared/server/http/originError";

type Context = { params: Promise<{ itemId: string }> };

async function itemIdFrom(context: Context) {
  const rawId = (await context.params).itemId;
  return /^[1-9]\d*$/.test(rawId) ? Number(rawId) : NaN;
}

export async function PATCH(request: Request, context: Context) {
  const denied = originError(request);
  if (denied) return denied;
  try {
    const parsedBody = await readJsonBody(request);
    if (
      !parsedBody.valid ||
      !isJsonObject(parsedBody.body) ||
      typeof parsedBody.body.quantity !== "number"
    ) {
      return NextResponse.json(
        { error: "Neplatná položka alebo množstvo." },
        { status: 400 },
      );
    }
    const itemId = await itemIdFrom(context);

    return NextResponse.json({
      data: await cartUseCases.updateItem(
        await resolveCartActor(),
        itemId,
        parsedBody.body.quantity,
      ),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CUSTOMER_ACCESS_REQUIRED") {
      return NextResponse.json({ error: "Košík je dostupný iba zákazníkom." }, { status: 403 });
    }
    if (error instanceof Error && ["INVALID_ITEM", "INVALID_QUANTITY", "ITEM_NOT_FOUND"].includes(error.message)) {
      return NextResponse.json({ error: "Neplatná položka alebo množstvo." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json({ error: "Požadované množstvo nie je skladom." }, { status: 409 });
    }
    console.error("Cart item update failed:", error);
    return NextResponse.json({ error: "Položku sa nepodarilo upraviť." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  const denied = originError(request);
  if (denied) return denied;
  try {
    return NextResponse.json({
      data: await cartUseCases.removeItem(
        await resolveCartActor(),
        await itemIdFrom(context),
      ),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CUSTOMER_ACCESS_REQUIRED") {
      return NextResponse.json({ error: "Košík je dostupný iba zákazníkom." }, { status: 403 });
    }
    if (error instanceof Error && error.message === "INVALID_ITEM") {
      return NextResponse.json({ error: "Neplatná položka." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "ITEM_NOT_FOUND") {
      return NextResponse.json({ error: "Položka v košíku neexistuje." }, { status: 404 });
    }
    console.error("Cart item removal failed:", error);
    return NextResponse.json({ error: "Položku sa nepodarilo odstrániť." }, { status: 500 });
  }
}
