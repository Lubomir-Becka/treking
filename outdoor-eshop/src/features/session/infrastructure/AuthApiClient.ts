export async function authenticate(
  mode: "login" | "register",
  payload: Record<string, FormDataEntryValue>,
): Promise<void> {
  const response = await fetch(`/api/auth/${mode}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result: unknown = await response.json();
  if (!response.ok) {
    const message = typeof result === "object" && result !== null &&
      "error" in result && typeof result.error === "string"
      ? result.error
      : "Požiadavku sa nepodarilo dokončiť.";
    throw new Error(message);
  }
}

export async function fetchSessionStatus(): Promise<boolean> {
const response = await fetch("/api/auth/session", { cache: "no-store" });
if (!response.ok) throw new Error("Session status could not be loaded.");
const payload: unknown = await response.json();
if (
  typeof payload !== "object" || payload === null ||
  !("data" in payload) || typeof payload.data !== "object" || payload.data === null ||
  !("authenticated" in payload.data) || typeof payload.data.authenticated !== "boolean"
) {
  throw new Error("Session status response is invalid.");
}
return payload.data.authenticated;
}

export async function logout(): Promise<void> {
const response = await fetch("/api/auth/logout", { method: "POST" });
if (!response.ok) {
  const payload: unknown = await response.json();
  const message = typeof payload === "object" && payload !== null &&
    "error" in payload && typeof payload.error === "string"
    ? payload.error
    : "Odhlásenie sa nepodarilo.";
  throw new Error(message);
}
}
