import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/shared/composition/server";
import { originError } from "./originError";

export async function adminAccessError(request: Request, mutation = false) {
  const access = await authorizeAdmin();
  if (access.status === "unauthenticated") {
    return NextResponse.json({ error: "Prihláste sa do administrácie." }, { status: 401 });
  }
  if (access.status === "forbidden") {
    return NextResponse.json({ error: "Prístup je povolený iba administrátorom." }, { status: 403 });
  }
  return mutation ? originError(request) : null;
}
