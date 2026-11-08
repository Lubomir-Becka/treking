import { NextResponse } from "next/server";
import { isSameOrigin } from "./sameOrigin";

export function originError(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Neplatný pôvod požiadavky." }, { status: 403 });
  }
  return null;
}
