import { NextResponse } from "next/server";
import { cartUseCases } from "@/features/cart/composition/server";
import { getCheckoutShippingOptions } from "@/features/checkout/composition/server";
import { resolveCartActor } from "@/shared/composition/server";

export async function GET() {
  try {
    const cart = await cartUseCases.getCart(await resolveCartActor());
    const subtotal = cart.items.reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0,
    );
    const options = await getCheckoutShippingOptions(subtotal);
    return NextResponse.json({ data: { options } });
  } catch (error) {
    if (error instanceof Error && error.message === "CUSTOMER_ACCESS_REQUIRED") {
      return NextResponse.json({ error: "Doprava je dostupná iba zákazníkom." }, { status: 403 });
    }
    console.error("Shipping quote failed:", error);
    return NextResponse.json(
      { error: "Cenu dopravy sa nepodarilo načítať." },
      { status: 500 },
    );
  }
}
