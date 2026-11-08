import { NextResponse } from "next/server";
import { resolveCartActor } from "@/composition/server";
import { cartUseCases } from "@/composition/server/cart";
import { isJsonObject, readJsonBody } from "@/server/http/readJsonBody";

export async function GET() {
  try {
    return NextResponse.json({
      data: await cartUseCases.getCart(await resolveCartActor()),
    });
  } catch (error) {
    console.error("Cart load failed:", error);
    return NextResponse.json({ error: "Košík sa nepodarilo načítať." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const parsedBody = await readJsonBody(request);
    if (
      !parsedBody.valid ||
      !isJsonObject(parsedBody.body) ||
      typeof parsedBody.body.variantId !== "number" ||
      !Number.isInteger(parsedBody.body.variantId) ||
      (parsedBody.body.quantity !== undefined &&
        typeof parsedBody.body.quantity !== "number")
    ) {
      return NextResponse.json({ error: "Neplatné údaje položky." }, { status: 400 });
    }

    const cart = await cartUseCases.addItem(
      await resolveCartActor(),
      parsedBody.body.variantId,
      typeof parsedBody.body.quantity === "number" ? parsedBody.body.quantity : 1,
    );
    return NextResponse.json({ data: cart }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && ["INVALID_VARIANT", "INVALID_QUANTITY"].includes(error.message)) {
      return NextResponse.json({ error: "Neplatné údaje položky." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json({ error: "Požadované množstvo nie je skladom." }, { status: 409 });
    }
    console.error("Cart item add failed:", error);
    return NextResponse.json({ error: "Položku sa nepodarilo pridať." }, { status: 500 });
  }
}
