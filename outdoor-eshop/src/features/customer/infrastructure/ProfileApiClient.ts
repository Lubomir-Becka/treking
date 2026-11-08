type Profile = { firstName: string; lastName: string; email: string };
type UpdateProfile = {
  firstName: string;
  lastName: string;
  email?: string;
  currentPassword?: string;
};

export async function updateProfile(input: UpdateProfile): Promise<Profile> {
  const response = await fetch("/api/account/profile", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null &&
      "error" in payload && typeof payload.error === "string"
      ? payload.error
      : "Profil sa nepodarilo aktualizovať.";
    throw new Error(message);
  }
  if (
    typeof payload !== "object" || payload === null ||
    !("data" in payload) || typeof payload.data !== "object" || payload.data === null ||
    !("firstName" in payload.data) || typeof payload.data.firstName !== "string" ||
    !("lastName" in payload.data) || typeof payload.data.lastName !== "string" ||
    !("email" in payload.data) || typeof payload.data.email !== "string"
  ) {
    throw new Error("Profil sa nepodarilo aktualizovať.");
  }
  return {
    firstName: payload.data.firstName,
    lastName: payload.data.lastName,
    email: payload.data.email,
  };
}
