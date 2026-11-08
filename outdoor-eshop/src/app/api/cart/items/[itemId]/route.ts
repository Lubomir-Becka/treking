import { NextResponse } from "next/server";
import { cartUseCases } from "@/features/cart/composition/server";
import { resolveCartActor } from "@/shared/composition/server";
import { isJsonObject, readJsonBody } from "@/shared/server/http/readJsonBody";

type Context = { params: Promise<{ itemId: string }> };

export async function PATCH(request: Request, context: Context) {
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
    const itemId = Number((await context.params).itemId);

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

export async function DELETE(_request: Request, context: Context) {
  try {
    return NextResponse.json({
      data: await cartUseCases.removeItem(
        await resolveCartActor(),
        Number((await context.params).itemId),
      ),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CUSTOMER_ACCESS_REQUIRED") {
      return NextResponse.json({ error: "Košík je dostupný iba zákazníkom." }, { status: 403 });
    }
    if (error instanceof Error && error.message === "INVALID_ITEM") {
      return NextResponse.json({ error: "Neplatná položka." }, { status: 400 });
    }
    console.error("Cart item removal failed:", error);
    return NextResponse.json({ error: "Položku sa nepodarilo odstrániť." }, { status: 500 });
  }
}
