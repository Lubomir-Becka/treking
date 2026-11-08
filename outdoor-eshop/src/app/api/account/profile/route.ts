import { NextResponse } from "next/server";
import { resolveActor, updateCustomerProfile } from "@/shared/composition/server";
import { isJsonObject, readJsonBody } from "@/shared/server/http/readJsonBody";
import { validateOptionalPhone, validateProfileNames } from "@/shared/domain/contactValidation";
import { isValidCustomerEmail } from "@/shared/domain/email";
import { originError } from "@/shared/server/http/originError";

export async function PATCH(request: Request) {
  const denied = originError(request);
  if (denied) return denied;
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
      (parsedBody.body.phone !== undefined && typeof parsedBody.body.phone !== "string") ||
      (parsedBody.body.email !== undefined && typeof parsedBody.body.email !== "string") ||
      (parsedBody.body.currentPassword !== undefined &&
        typeof parsedBody.body.currentPassword !== "string")
    ) {
      return NextResponse.json({ error: "Skontrolujte zadané údaje." }, { status: 400 });
    }

    const nameError = validateProfileNames({
      firstName: parsedBody.body.firstName,
      lastName: parsedBody.body.lastName,
    });
    if (nameError) return NextResponse.json({ error: nameError }, { status: 400 });
    if (typeof parsedBody.body.email === "string" && !isValidCustomerEmail(parsedBody.body.email)) {
      return NextResponse.json({ error: "Zadajte platnú e-mailovú adresu (najviac 100 znakov)." }, { status: 400 });
    }
    if (typeof parsedBody.body.phone === "string") {
      const phoneError = validateOptionalPhone(parsedBody.body.phone);
      if (phoneError) return NextResponse.json({ error: phoneError }, { status: 400 });
    }
    const data = await updateCustomerProfile(actor.userId, {
      firstName: parsedBody.body.firstName,
      lastName: parsedBody.body.lastName,
      phone: parsedBody.body.phone,
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
    if (error.message === "INVALID_PHONE") {
      return NextResponse.json({ error: "Zadajte platné telefónne číslo." }, { status: 400 });
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
