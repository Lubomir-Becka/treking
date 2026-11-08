import assert from "node:assert/strict";
import { chromium } from "playwright";

export async function testProductImagesUi({ base, cookie, colorId, image }) {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined });
  try {
    const context = await browser.newContext();
    await context.addCookies([{
      name: "vt_customer_session",
      value: cookie.slice("vt_customer_session=".length),
      url: base,
    }]);
    const page = await context.newPage();
    await page.goto(`${base}/admin`);
    const navigation = page.getByRole("navigation", { name: "Správa obchodu" });
    await navigation.getByRole("button", { name: "Účty" }).click();
    await page.getByRole("heading", { name: "Správa zákazníckych účtov" }).waitFor();
    await navigation.getByRole("button", { name: "Kategórie" }).click();
    assert.equal(await navigation.getByRole("button", { name: "Kategórie" }).getAttribute("aria-current"), "page");
    await page.getByRole("button", { name: "Produkty", exact: true }).click();
    const products = page.getByRole("heading", { name: "Správa produktov" }).locator("..");
    const product = products.locator("li").filter({ hasText: "order-product" });
    await product.getByRole("button", { name: "Upraviť" }).click();
    const inventory = page.getByRole("heading", { name: "Farby a varianty: Order Product" }).locator("..");
    const section = inventory.getByRole("heading", { name: /Black/ }).locator("..");
    await section.locator('input[type="file"]').setInputFiles({
      name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    });
    await section.getByRole("button", { name: "Pridať obrázok" }).click();
    await inventory.getByText("Povolené sú obrázky JPEG, PNG a WebP do 5 MB.").waitFor();
    await section.locator('input[type="file"]').setInputFiles({
      name: "image.png", mimeType: "image/png", buffer: image,
    });
    await section.getByRole("button", { name: "Pridať obrázok" }).click();
    await section.getByRole("img", { name: "Obrázok 1: Black" }).waitFor();
    await section.locator('input[type="file"]').setInputFiles({
      name: "second.png", mimeType: "image/png", buffer: image,
    });
    await section.getByRole("button", { name: "Pridať obrázok" }).click();
    const second = section.getByRole("img", { name: "Obrázok 2: Black" });
    await second.waitFor();
    const secondUrl = await second.getAttribute("src");
    assert.match(secondUrl, /^\/api\/product-images\//);
    const secondRow = second.locator("xpath=../..");
    await secondRow.getByRole("button", { name: "Nastaviť ako hlavný" }).click();
    await secondRow.getByText("Hlavný", { exact: false }).waitFor();
    const storefront = await context.newPage();
    await storefront.goto(`${base}/products/order-product?colorId=${colorId}`);
    await storefront.getByText("Produktová galéria", { exact: true }).waitFor();
    assert.ok(
      await storefront.getByText("2 / 2", { exact: true }).isVisible(),
      `Unexpected product detail: ${await storefront.locator("main").innerText()}`,
    );
    await storefront.close();
    await secondRow.getByRole("button", { name: "Posunúť vyššie" }).click();
    await page.waitForFunction((url) =>
      document.querySelector('img[alt="Obrázok 1: Black"]')?.getAttribute("src") === url, secondUrl);
    assert.equal(await section.getByRole("img", { name: "Obrázok 1: Black" }).getAttribute("src"), secondUrl);
    page.once("dialog", (dialog) => dialog.accept());
    await section.locator("li").first().getByRole("button", { name: "Odstrániť obrázok" }).click();
    await section.locator(`img[src="${secondUrl}"]`).waitFor({ state: "detached" });
    await section.getByText("1. obrázok · Hlavný").waitFor();
    page.once("dialog", (dialog) => dialog.accept());
    await section.getByRole("button", { name: "Odstrániť obrázok" }).click();
    await section.getByText("Farba zatiaľ nemá obrázky.").waitFor();
    await context.close();
    console.log("Product image administration browser tests passed.");
  } finally {
    await browser.close();
  }
}
