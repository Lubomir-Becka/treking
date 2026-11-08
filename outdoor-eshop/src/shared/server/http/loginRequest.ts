import { NextResponse } from "next/server";
import { isJsonObject, readJsonBody } from "./readJsonBody";
import type { UserRole } from "@/features/session/domain/UserRole";

type Login = (input: {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}) => Promise<{ id: number; email: string; role: UserRole }>;

export async function handleLogin(request: Request, login: Login) {
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

    const result = await login({
      email: parsedBody.body.email,
      password: parsedBody.body.password,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
      userAgent: request.headers.get("user-agent") ?? undefined,
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
