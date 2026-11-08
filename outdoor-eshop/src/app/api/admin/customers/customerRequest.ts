import { NextResponse } from "next/server";

export function customerError(error: unknown) {
  const cause = error instanceof Error ? error.cause : error;
  if (typeof cause === "object" && cause !== null && "code" in cause && cause.code === "23505") {
    return NextResponse.json({ error: "Účet s týmto e-mailom už existuje." }, { status: 409 });
  }
  console.error("Customer management failed:", error);
  return NextResponse.json({ error: "Operáciu s účtom sa nepodarilo vykonať." }, { status: 500 });
}
