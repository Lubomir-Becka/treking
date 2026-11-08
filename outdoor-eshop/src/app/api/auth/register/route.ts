import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { registerCustomer } from "@/shared/composition/server";
import { isJsonObject, readJsonBody } from "@/shared/server/http/readJsonBody";

export async function POST(request: Request) {
  try {
    const parsedBody = await readJsonBody(request);
    if (
      !parsedBody.valid ||
      !isJsonObject(parsedBody.body) ||
      typeof parsedBody.body.email !== "string" ||
      typeof parsedBody.body.password !== "string" ||
      typeof parsedBody.body.firstName !== "string" ||
      typeof parsedBody.body.lastName !== "string" ||
      (parsedBody.body.phone !== undefined &&
        typeof parsedBody.body.phone !== "string")
    ) {
      return NextResponse.json(
        { error: "Vyplňte platné údaje a heslo s 8 až 72 bajtmi." },
        { status: 400 },
      );
    }

    const requestHeaders = await headers();
    const result = await registerCustomer({
      email: parsedBody.body.email,
      password: parsedBody.body.password,
      firstName: parsedBody.body.firstName,
      lastName: parsedBody.body.lastName,
      phone: parsedBody.body.phone,
      ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: requestHeaders.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_REGISTERED") {
      return NextResponse.json({ error: "Účet s týmto e-mailom už existuje." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "INVALID_REGISTRATION") {
      return NextResponse.json({ error: "Vyplňte platné údaje a heslo s 8 až 72 bajtmi." }, { status: 400 });
    }
    console.error("Registration failed:", error);
    return NextResponse.json({ error: "Registráciu sa nepodarilo dokončiť." }, { status: 500 });
  }
}
