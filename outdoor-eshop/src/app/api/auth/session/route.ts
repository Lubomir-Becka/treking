import { NextResponse } from "next/server";
import { resolveActor } from "@/composition/server";

export async function GET() {
  try {
    const actor = await resolveActor();
    return NextResponse.json(
      { data: { authenticated: actor.type === "authenticated" } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Session status lookup failed:", error);
    return NextResponse.json(
      { error: "Stav prihlásenia sa nepodarilo načítať." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
