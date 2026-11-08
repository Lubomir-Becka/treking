import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/shared/composition/server";
import { isSameOrigin } from "./sameOrigin";

export async function adminAccessError(request: Request, mutation = false) {
  const access = await authorizeAdmin();
  if (access.status === "unauthenticated") {
    return NextResponse.json({ error: "Prihláste sa do administrácie." }, { status: 401 });
  }
  if (access.status === "forbidden") {
    return NextResponse.json({ error: "Prístup je povolený iba administrátorom." }, { status: 403 });
  }
  if (mutation && !isSameOrigin(request)) {
    return NextResponse.json({ error: "Neplatný pôvod požiadavky." }, { status: 403 });
  }
  return null;
}
