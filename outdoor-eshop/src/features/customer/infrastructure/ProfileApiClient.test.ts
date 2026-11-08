import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { updateProfile } from "./ProfileApiClient";

test("profile client validates success and reports server errors", async () => {
  const profile = { firstName: "Jana", lastName: "Nova", email: "jana@example.com", phone: "+421900123456" };
  const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({ data: profile }));
  try {
    assert.deepEqual(await updateProfile(profile), profile);
    fetchMock.mock.mockImplementation(async () => Response.json({ data: { ...profile, phone: null } }));
    assert.equal((await updateProfile({ ...profile, phone: "" })).phone, null);
    fetchMock.mock.mockImplementation(async () =>
      Response.json({ error: "E-mail je obsadený." }, { status: 409 }));
    await assert.rejects(updateProfile(profile), { message: "E-mail je obsadený." });
    fetchMock.mock.mockImplementation(async () => Response.json({ data: { firstName: "Jana" } }));
    await assert.rejects(updateProfile(profile), { message: "Profil sa nepodarilo aktualizovať." });
  } finally {
    fetchMock.mock.restore();
  }
});
