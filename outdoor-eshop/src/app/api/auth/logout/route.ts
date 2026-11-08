import { NextResponse } from "next/server";
import { revokeSession } from "@/shared/composition/server";
import { originError } from "@/shared/server/http/originError";

export async function POST(request: Request) {
  const denied = originError(request);
  if (denied) return denied;
  try {
    await revokeSession();
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Logout failed:", error);
    return NextResponse.json({ error: "Odhlásenie sa nepodarilo dokončiť." }, { status: 500 });
  }
}
