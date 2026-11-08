import { NextResponse } from "next/server";
import { resolveCartActor } from "@/shared/composition/server";
import { cartUseCases } from "@/features/cart/composition/server";
import { isJsonObject, readJsonBody } from "@/shared/server/http/readJsonBody";
import { originError } from "@/shared/server/http/originError";

export async function GET() {
  try {
    return NextResponse.json({
      data: await cartUseCases.getCart(await resolveCartActor()),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CUSTOMER_ACCESS_REQUIRED") {
      return NextResponse.json({ error: "Košík je dostupný iba zákazníkom." }, { status: 403 });
    }
    console.error("Cart load failed:", error);
    return NextResponse.json({ error: "Košík sa nepodarilo načítať." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = originError(request);
  if (denied) return denied;
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
    if (error instanceof Error && error.message === "CUSTOMER_ACCESS_REQUIRED") {
      return NextResponse.json({ error: "Košík je dostupný iba zákazníkom." }, { status: 403 });
    }
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
