import { cookies } from "next/headers";
import type { SessionCookiePort } from "../domain/SessionCookiePort";

export class NextSessionCookieAdapter implements SessionCookiePort {
  async get(name: string) {
    return (await cookies()).get(name)?.value;
  }

  async set(name: string, value: string, expiresAt: Date) {
    (await cookies()).set(name, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
  }

  async clear(name: string) {
    (await cookies()).set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });
  }
}
