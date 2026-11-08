import { NextResponse } from "next/server";
import { revokeSession } from "@/shared/composition/server";

export async function POST() {
  try {
    await revokeSession();
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Logout failed:", error);
    return NextResponse.json({ error: "Odhlásenie sa nepodarilo dokončiť." }, { status: 500 });
  }
}
