export type JsonBodyResult =
  | { valid: true; body: unknown }
  | { valid: false };

export async function readJsonBody(request: Request): Promise<JsonBodyResult> {
  try {
    return { valid: true, body: await request.json() };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { valid: false };
    }

    throw error;
  }
}

export function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
