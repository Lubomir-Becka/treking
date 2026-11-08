import assert from "node:assert/strict";
import { chromium } from "playwright";

export async function testCatalogUi(base) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
  });
  try {
    const page = await browser.newPage();
    await page.goto(`${base}/search?q=Catalog%20Check`);
    await page.getByText("Catalog Check 24", { exact: true }).waitFor();
    assert.equal(await page.getByText("Catalog Check 27", { exact: true }).count(), 0);
    await page.getByRole("button", { name: "Načítať ďalšie" }).click();
    await page.getByText("Catalog Check 27", { exact: true }).waitFor();
    await page.getByLabel("Maximálna cena (€)").fill("850");
    await page.getByText("Catalog Check 24", { exact: true }).waitFor();
    assert.equal(await page.getByText("Catalog Check 27", { exact: true }).count(), 0);
    await page.getByLabel("Maximálna cena (€)").fill("");
    await page.getByLabel("Zoradiť:").selectOption("price-desc");
    await page.getByText("Catalog Check 27", { exact: true }).waitFor();
  } finally {
    await browser.close();
  }
}
