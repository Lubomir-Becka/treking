async function request(path: string, method: "GET" | "PUT" | "DELETE") {
  const response = await fetch(path, { method, cache: "no-store" });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Prihláste sa do svojho účtu.");
    throw new Error("Obľúbené položky sa nepodarilo spracovať.");
  }
  return response.json() as Promise<unknown>;
}

export async function fetchFavoriteColorIds(): Promise<number[]> {
  const payload = await request("/api/account/favorites", "GET");
  if (
    typeof payload !== "object" || payload === null || !("data" in payload) ||
    !Array.isArray(payload.data) ||
    !payload.data.every((id: unknown) =>
      typeof id === "number" && Number.isInteger(id) && id > 0 && id <= 2_147_483_647)
  ) {
    throw new Error("Odpoveď obľúbených položiek nie je platná.");
  }
  return payload.data;
}

export async function changeFavoriteColor(colorId: number, add: boolean): Promise<void> {
  const payload = await request(`/api/account/favorites/${colorId}`, add ? "PUT" : "DELETE");
  if (
    typeof payload !== "object" || payload === null || !("data" in payload) ||
    typeof payload.data !== "object" || payload.data === null ||
    !("success" in payload.data) || payload.data.success !== true
  ) {
    throw new Error("Výsledok zmeny obľúbených položiek nie je známy.");
  }
}
