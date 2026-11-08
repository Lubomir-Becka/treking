import { NextResponse } from "next/server";
import { cartUseCases } from "@/composition/server/cart";
import { getCheckoutShippingOptions } from "@/composition/server/checkout";
import { resolveCartActor } from "@/composition/server";

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
    console.error("Shipping quote failed:", error);
    return NextResponse.json(
      { error: "Cenu dopravy sa nepodarilo načítať." },
      { status: 500 },
    );
  }
}
