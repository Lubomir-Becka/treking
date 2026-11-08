import { NextResponse } from "next/server";

export function productError(error: unknown) {
  const cause = error instanceof Error ? error.cause : error;
  if (typeof cause === "object" && cause !== null && "code" in cause) {
    if (cause.code === "23505") {
      return NextResponse.json({ error: "Produkt s týmto slugom už existuje." }, { status: 409 });
    }
    if (cause.code === "23503") {
      return NextResponse.json({ error: "Zvolená kategória neexistuje." }, { status: 400 });
    }
  }
  console.error("Product management failed:", error);
  return NextResponse.json({ error: "Operáciu s produktom sa nepodarilo vykonať." }, { status: 500 });
}
