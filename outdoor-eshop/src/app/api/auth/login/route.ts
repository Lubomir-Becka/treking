import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { loginCustomer } from "@/shared/composition/server";
import { isJsonObject, readJsonBody } from "@/shared/server/http/readJsonBody";

export async function POST(request: Request) {
  try {
    const parsedBody = await readJsonBody(request);
    if (
      !parsedBody.valid ||
      !isJsonObject(parsedBody.body) ||
      typeof parsedBody.body.email !== "string" ||
      typeof parsedBody.body.password !== "string"
    ) {
      return NextResponse.json({ error: "Vyplňte e-mail a heslo." }, { status: 400 });
    }

    const requestHeaders = await headers();
    const ipAddress = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const result = await loginCustomer({
      email: parsedBody.body.email,
      password: parsedBody.body.password,
      ipAddress,
      userAgent: requestHeaders.get("user-agent") ?? undefined,
    });
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return NextResponse.json({ error: "Príliš veľa pokusov. Skúste to neskôr." }, { status: 429 });
    }
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      return NextResponse.json({ error: "Nesprávny e-mail alebo heslo." }, { status: 401 });
    }
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Prihlásenie sa nepodarilo dokončiť." }, { status: 500 });
  }
}
