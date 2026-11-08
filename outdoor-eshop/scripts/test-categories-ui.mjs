import assert from "node:assert/strict";
import { chromium } from "playwright";

export async function testCategoryRefresh(base, adminCookie) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
  });
  try {
    const context = await browser.newContext();
    const token = adminCookie.slice("vt_customer_session=".length);
    await context.addCookies([{
      name: "vt_customer_session",
      value: token,
      url: base,
    }]);
    const page = await context.newPage();
    await page.goto(`${base}/admin`);
    await page.getByRole("heading", { name: "Správa kategórií" }).waitFor();

    let remainingFailures = 2;
    let saveRequests = 0;
    await page.route(`${base}/api/admin/categories`, async (route) => {
      if (route.request().method() === "POST") saveRequests += 1;
      if (route.request().method() === "GET" && remainingFailures > 0) {
        remainingFailures -= 1;
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "Testovacia chyba obnovenia." }),
        });
        return;
      }
      await route.continue();
    });

    await page.getByLabel("Názov", { exact: true }).fill("Neplatný\u007fnázov");
    await page.getByLabel("Slug", { exact: true }).fill("test-rozhrania");
    await page.getByRole("button", { name: "Uložiť" }).click();
    await page.getByRole("alert").getByText("Názov nesmie obsahovať riadiace znaky.").waitFor();
    assert.equal(saveRequests, 0);

    await page.getByLabel("Názov", { exact: true }).fill("Test rozhrania");
    await page.getByRole("button", { name: "Uložiť" }).click();
    await page.getByRole("alert").getByText(
      "Zmena sa uložila, ale zoznam sa nepodarilo obnoviť. Skúste to znova.",
    ).waitFor();
    assert.equal(await page.getByRole("status").innerText(), "Kategória bola uložená.");
    assert.equal(saveRequests, 1);
    assert.equal(await page.getByLabel("Názov", { exact: true }).isDisabled(), true);
    assert.equal(await page.getByLabel("Slug", { exact: true }).isDisabled(), true);
    assert.equal(await page.getByLabel("Nadradená kategória").isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: "Uložiť" }).isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: "Upraviť" }).first().isDisabled(), true);

    await page.getByRole("button", { name: "Obnoviť zoznam" }).click();
    await page.getByRole("alert").getByText(
      "Zoznam kategórií sa nepodarilo obnoviť. Skúste to znova.",
    ).waitFor();
    assert.equal(await page.getByRole("button", { name: "Uložiť" }).isDisabled(), true);

    await page.getByRole("button", { name: "Obnoviť zoznam" }).click();
    await page.getByRole("list").getByText("Test rozhrania", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Obnoviť zoznam" }).count(), 0);
    await page.getByText("Zoznam kategórií sa nepodarilo obnoviť. Skúste to znova.")
      .waitFor({ state: "hidden" });
    assert.equal(await page.getByRole("button", { name: "Uložiť" }).isEnabled(), true);
    assert.equal(await page.getByLabel("Názov", { exact: true }).inputValue(), "");

    await page.unroute(`${base}/api/admin/categories`);
    let lostResponses = 0;
    let failedRefresh = false;
    await page.route(`${base}/api/admin/categories`, async (route) => {
      if (route.request().method() === "POST") {
        const response = await route.fetch();
        assert.equal(response.status(), 201);
        lostResponses += 1;
        await route.abort("failed");
        return;
      }
      if (route.request().method() === "GET" && !failedRefresh) {
        failedRefresh = true;
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "Testovacia chyba obnovenia." }),
        });
        return;
      }
      await route.continue();
    });
    await page.getByLabel("Názov", { exact: true }).fill("Neznámy výsledok");
    await page.getByLabel("Slug", { exact: true }).fill("neznamy-vysledok");
    await page.getByRole("button", { name: "Uložiť" }).click();
    await page.getByRole("alert").getByText(
      "Výsledok operácie nie je známy. Obnovte zoznam a overte, či sa zmena vykonala.",
    ).waitFor();
    assert.equal(lostResponses, 1);
    assert.equal(await page.getByRole("button", { name: "Uložiť" }).isDisabled(), true);
    assert.equal(await page.getByLabel("Názov", { exact: true }).isDisabled(), true);
    assert.equal(await page.getByLabel("Nadradená kategória").isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: "Upraviť" }).first().isDisabled(), true);

    await page.getByRole("button", { name: "Obnoviť zoznam" }).click();
    await page.getByRole("alert").getByText(
      "Zoznam kategórií sa nepodarilo obnoviť. Skúste to znova.",
    ).waitFor();
    assert.equal(await page.getByRole("button", { name: "Uložiť" }).isDisabled(), true);
    assert.equal(await page.getByLabel("Názov", { exact: true }).inputValue(), "Neznámy výsledok");
    await page.getByRole("button", { name: "Obnoviť zoznam" }).click();
    await page.getByRole("list").getByText("Neznámy výsledok", { exact: true }).waitFor();
    await page.getByRole("status").getByText(
      "Zoznam bol obnovený. Pred ďalšou zmenou overte, či sa predchádzajúca operácia vykonala.",
    ).waitFor();
    assert.equal(await page.getByRole("button", { name: "Uložiť" }).isEnabled(), true);
    assert.equal(await page.getByLabel("Názov", { exact: true }).inputValue(), "");
    assert.equal(lostResponses, 1);
    console.log("Category browser interaction tests passed.");
  } finally {
    await browser.close();
  }
}
