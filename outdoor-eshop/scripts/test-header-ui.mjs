import assert from "node:assert/strict";
import { chromium } from "playwright";

export async function testHeaderUi(base) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
  });
  try {
    const page = await browser.newPage();
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/", "/search"]) {
        await page.goto(`${base}${path}`);
        const header = page.locator("header").first();
        const navigation = header.getByRole("navigation", { name: "Hlavná navigácia" });
        await navigation.getByText("Páni", { exact: true }).waitFor();
        assert.equal(await navigation.getByText("Dámy", { exact: true }).isVisible(), true);
        assert.equal(await header.getByLabel("VERTEX Tatran – domov").isVisible(), false);
        const positions = await header.evaluate((element) => {
          const nav = element.querySelector("nav").getBoundingClientRect();
          const search = element.querySelector("form").getBoundingClientRect();
          const actions = element.lastElementChild.getBoundingClientRect();
          return {
            navRight: nav.right,
            searchLeft: search.left,
            searchRight: search.right,
            actionsLeft: actions.left,
            actionsRight: actions.right,
          };
        });
        assert.ok(positions.navRight <= positions.searchLeft);
        assert.ok(positions.searchRight <= positions.actionsLeft);
        assert.ok(positions.actionsRight <= width);
        await navigation.getByText("Dámy", { exact: true }).click();
        assert.equal(await navigation.getByRole("link", { name: "Všetky produkty" }).getAttribute("href"), "/collections/women");
        await navigation.getByText("Páni", { exact: true }).click();
        assert.equal(await navigation.getByRole("link", { name: "Všetky produkty" }).getAttribute("href"), "/collections/men");
        await navigation.getByRole("link", { name: "Všetky produkty" }).click();
        await page.waitForURL("**/collections/men");
      }
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${base}/`);
    assert.equal(await page.locator("header").first().getByLabel("VERTEX Tatran – domov").isVisible(), true);
    console.log("Responsive header browser tests passed.");
  } finally {
    await browser.close();
  }
}
