import { NextResponse } from "next/server";
import { resolveActor, updateCustomerProfile } from "@/shared/composition/server";
import { isJsonObject, readJsonBody } from "@/shared/server/http/readJsonBody";

export async function PATCH(request: Request) {
  try {
    const actor = await resolveActor();
    if (actor.type !== "authenticated") {
      return NextResponse.json({ error: "Prihláste sa do svojho účtu." }, { status: 401 });
    }
    if (actor.role !== "customer") {
      return NextResponse.json({ error: "Profil je dostupný iba zákazníkom." }, { status: 403 });
    }

    const parsedBody = await readJsonBody(request);
    if (
      !parsedBody.valid ||
      !isJsonObject(parsedBody.body) ||
      typeof parsedBody.body.firstName !== "string" ||
      typeof parsedBody.body.lastName !== "string" ||
      (parsedBody.body.email !== undefined && typeof parsedBody.body.email !== "string") ||
      (parsedBody.body.currentPassword !== undefined &&
        typeof parsedBody.body.currentPassword !== "string")
    ) {
      return NextResponse.json({ error: "Skontrolujte zadané údaje." }, { status: 400 });
    }

    const data = await updateCustomerProfile(actor.userId, {
      firstName: parsedBody.body.firstName,
      lastName: parsedBody.body.lastName,
      email: parsedBody.body.email,
      currentPassword: parsedBody.body.currentPassword,
    });

    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (!(error instanceof Error)) {
      console.error("Customer profile update failed:", error);
      return NextResponse.json({ error: "Profil sa nepodarilo aktualizovať." }, { status: 500 });
    }

    if (error.message === "ACCOUNT_NOT_FOUND") {
      return NextResponse.json({ error: "Zákaznícky účet sa nenašiel." }, { status: 404 });
    }
    if (error.message === "INVALID_PROFILE" || error.message === "INVALID_EMAIL") {
      return NextResponse.json({ error: "Skontrolujte meno, priezvisko a e-mail." }, { status: 400 });
    }
    if (error.message === "INVALID_CREDENTIALS") {
      return NextResponse.json({ error: "Zadané heslo nie je správne." }, { status: 403 });
    }
    if (error.message === "EMAIL_ALREADY_REGISTERED") {
      return NextResponse.json({ error: "Účet s týmto e-mailom už existuje." }, { status: 409 });
    }

    console.error("Customer profile update failed:", error);
    return NextResponse.json(
      { error: "Profil sa nepodarilo aktualizovať." },
      { status: 500 },
    );
  }
}
