import { NextResponse } from "next/server";
import { createCheckoutOrder } from "@/features/checkout/composition/server";
import { resolveActor } from "@/shared/composition/server";
import { isJsonObject, readJsonBody } from "@/shared/server/http/readJsonBody";
import { parseOrderBody } from "./parseOrderBody";
import { validateOrderDetails } from "@/features/checkout/domain/OrderValidation";
import { isPaymentMethodCode, isShippingMethodCode } from "@/features/checkout/domain/checkout";

async function getUserId(): Promise<number> {
  const actor = await resolveActor();
  if (actor.type !== "authenticated") {
    throw new Error("AUTHENTICATION_REQUIRED");
  }
  if (actor.role !== "customer") {
    throw new Error("CUSTOMER_ACCESS_REQUIRED");
  }
  return actor.userId;
}

export async function POST(request: Request) {
  try {
    const parsedBody = await readJsonBody(request);
    if (!parsedBody.valid) {
      return NextResponse.json(
        { error: "Vyplňte všetky povinné údaje." },
        { status: 400 },
      );
    }
    if (isJsonObject(parsedBody.body) && parsedBody.body.termsAccepted !== true) {
      return NextResponse.json({ error: "Potvrďte súhlas s obchodnými podmienkami." }, { status: 400 });
    }
    if (isJsonObject(parsedBody.body) && !isShippingMethodCode(parsedBody.body.shippingMethod)) {
      return NextResponse.json({ error: "Vyberte platný spôsob dopravy." }, { status: 400 });
    }
    if (isJsonObject(parsedBody.body) && !isPaymentMethodCode(parsedBody.body.paymentMethod)) {
      return NextResponse.json({ error: "Vyberte platný spôsob platby." }, { status: 400 });
    }
    const body = parseOrderBody(parsedBody.body);
    if (!body) {
      return NextResponse.json(
        { error: "Vyplňte všetky povinné údaje." },
        { status: 400 },
      );
    }
    const validationError = validateOrderDetails(body);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const result = await createCheckoutOrder({
      ...body,
      userId: await getUserId(),
    });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "AUTHENTICATION_REQUIRED") {
      return NextResponse.json({ error: "Pre pokračovanie sa musíte prihlásiť." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "CUSTOMER_ACCESS_REQUIRED") {
      return NextResponse.json({ error: "Objednávky sú dostupné iba zákazníkom." }, { status: 403 });
    }
    if (error instanceof Error && error.message === "INVALID_SHIPPING_DATA") {
      return NextResponse.json({ error: "Vyplňte všetky povinné údaje." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "EMPTY_CART") {
      return NextResponse.json({ error: "Košík je prázdny." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json({ error: "Niektorá položka už nie je skladom." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "INVALID_CART_QUANTITY") {
      return NextResponse.json({ error: "Upravte množstvo položiek na maximálne 99 kusov." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "SHIPPING_METHOD_NOT_FOUND") {
      return NextResponse.json({ error: "Zvolený spôsob dopravy nie je dostupný." }, { status: 400 });
    }
    console.error("Order creation failed:", error);
    return NextResponse.json({ error: "Objednávku sa nepodarilo vytvoriť." }, { status: 500 });
  }
}
