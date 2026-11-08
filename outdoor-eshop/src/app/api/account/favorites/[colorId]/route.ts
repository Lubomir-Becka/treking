import { NextResponse } from "next/server";
import { favoriteColors } from "@/features/customer/composition/server";
import { resolveActor } from "@/shared/composition/server";
import { isSameOrigin } from "@/shared/server/http/sameOrigin";

type Context = { params: Promise<{ colorId: string }> };

async function change(request: Request, context: Context, add: boolean) {
  try {
    const actor = await resolveActor();
    if (actor.type !== "authenticated") {
      return NextResponse.json({ error: "Prihláste sa do svojho účtu." }, { status: 401 });
    }
    if (actor.role !== "customer") {
      return NextResponse.json({ error: "Obľúbené položky sú dostupné iba zákazníkom." }, { status: 403 });
    }
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Neplatný pôvod požiadavky." }, { status: 403 });
    }
    const rawId = (await context.params).colorId;
    const colorId = Number(rawId);
    if (!/^[1-9]\d*$/.test(rawId) || !Number.isInteger(colorId) || colorId > 2_147_483_647) {
      return NextResponse.json({ error: "Neplatná farebná verzia produktu." }, { status: 400 });
    }
    if (add) {
      if (!await favoriteColors.add(actor.userId, colorId)) {
        return NextResponse.json({ error: "Produkt sa nenašiel alebo nie je dostupný." }, { status: 404 });
      }
    } else {
      await favoriteColors.remove(actor.userId, colorId);
    }
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Updating favorites failed:", error);
    return NextResponse.json({ error: "Obľúbenú položku sa nepodarilo upraviť." }, { status: 500 });
  }
}

export function PUT(request: Request, context: Context) {
  return change(request, context, true);
}

export function DELETE(request: Request, context: Context) {
  return change(request, context, false);
}
