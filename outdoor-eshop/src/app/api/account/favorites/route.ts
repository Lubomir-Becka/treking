import { NextResponse } from "next/server";
import { favoriteColors } from "@/features/customer/composition/server";
import { resolveActor } from "@/shared/composition/server";

export async function GET() {
  try {
    const actor = await resolveActor();
    if (actor.type !== "authenticated") {
      return NextResponse.json({ error: "Prihláste sa do svojho účtu." }, { status: 401 });
    }
    if (actor.role !== "customer") {
      return NextResponse.json({ error: "Obľúbené položky sú dostupné iba zákazníkom." }, { status: 403 });
    }
    return NextResponse.json(
      { data: await favoriteColors.list(actor.userId) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Loading favorites failed:", error);
    return NextResponse.json({ error: "Obľúbené položky sa nepodarilo načítať." }, { status: 500 });
  }
}
