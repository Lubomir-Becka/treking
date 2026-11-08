import assert from "node:assert/strict";
import { chromium } from "playwright";

export async function testAdminManagementUi(base, cookie, createCustomer) {
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
    const nav = page.getByRole("navigation", { name: "Správa obchodu" });
    const categories = page.getByRole("heading", { name: "Správa kategórií" }).locator("..");
    const categoryForm = categories.locator("form");
    await categoryForm.getByLabel("Názov", { exact: true }).fill("Browser kategória");
    await categoryForm.getByLabel("Slug").fill("browser-kategoria");
    await categoryForm.getByRole("button", { name: "Uložiť", exact: true }).click();
    await categories.getByText("Kategória bola uložená.").waitFor();
    await nav.getByRole("button", { name: "Účty" }).click();
    const customers = page.getByRole("heading", { name: "Správa zákazníckych účtov" }).locator("..");
    assert.equal(await customers.locator("input, select").count(), 0);
    assert.equal(await customers.getByText("admin@integration.test").count(), 0);
    const inactiveCustomer = customers.locator("li").filter({ hasText: "inactive-browser@integration.test" });
    await inactiveCustomer.getByText("Deaktivovaný", { exact: false }).waitFor();
    await createCustomer();
    await nav.getByRole("button", { name: "Kategórie" }).click();
    await nav.getByRole("button", { name: "Účty" }).click();
    await customers.getByText("new-browser@integration.test", { exact: false }).waitFor();
    const browserCustomer = customers.locator("li").filter({ hasText: "browser@integration.test" })
      .filter({ hasNotText: "inactive-browser@integration.test" })
      .filter({ hasNotText: "new-browser@integration.test" });
    await browserCustomer.waitFor();
    page.once("dialog", (dialog) => dialog.accept());
    await browserCustomer.getByRole("button", { name: "Deaktivovať" }).click();
    await browserCustomer.getByText("Deaktivovaný", { exact: false }).waitFor();
    page.once("dialog", (dialog) => dialog.accept());
    await browserCustomer.getByRole("button", { name: "Aktivovať" }).click();
    await browserCustomer.getByText("Aktívny", { exact: false }).waitFor();
    page.once("dialog", (dialog) => dialog.accept());
    await browserCustomer.getByRole("button", { name: "Odstrániť účet" }).click();
    await browserCustomer.waitFor({ state: "detached" });

    await nav.getByRole("button", { name: "Produkty" }).click();
    const products = page.getByRole("heading", { name: "Správa produktov" }).locator("..");
    assert.equal(await products.getByLabel("Názov produktu").count(), 0);
    await products.getByRole("button", { name: "Pridať produkt" }).click();
    assert.equal(await products.getByLabel("Hľadať produkt podľa názvu alebo SKU").count(), 0);
    await products.getByLabel("Názov produktu").fill("Neuložený produkt");
    page.once("dialog", (dialog) => dialog.dismiss());
    await products.getByRole("button", { name: "Späť na produkty" }).click();
    assert.equal(await products.getByLabel("Názov produktu").inputValue(), "Neuložený produkt");
    assert.equal(await products.getByLabel("Kategória").getByRole("option", { name: "Browser kategória" }).count(), 1);
    await products.getByLabel("Názov produktu").fill("Browser product");
    await products.getByLabel("Slug produktu").fill("browser-product");
    await products.getByLabel("Značka").fill("Test");
    await products.getByRole("button", { name: "Uložiť produkt" }).click();
    const inventory = page.getByRole("heading", { name: "Farby a varianty: Browser product" }).locator("..");
    await inventory.waitFor();
    await products.getByText("Produkt nemá aktívny variant", { exact: false }).waitFor();
    assert.equal(await products.getByLabel("Hľadať produkt podľa názvu alebo SKU").count(), 0);
    assert.equal(await products.getByRole("button", { name: "Pridať produkt" }).count(), 0);
    await inventory.getByLabel("Názov farby").fill("Červená");
    await inventory.getByLabel("HEX farby").fill("#ff0000");
    page.once("dialog", (dialog) => dialog.dismiss());
    await products.getByRole("button", { name: "Späť na produkty" }).click();
    assert.equal(await inventory.getByLabel("Názov farby").inputValue(), "Červená");
    await inventory.getByRole("button", { name: "Uložiť farbu" }).click();
    const color = inventory.getByRole("heading", { name: /Červená ·/ }).locator("..");
    await color.getByRole("button", { name: "Pridať veľkosti" }).click();
    await color.getByLabel("S", { exact: true }).check();
    await color.getByLabel("M", { exact: true }).check();
    await color.getByLabel("Spoločná cena v €").fill("15.50");
    await color.getByRole("button", { name: "Vytvoriť varianty" }).click();
    await color.getByText("sklad: 0", { exact: false }).first().waitFor();
    await products.getByText("Produkt nemá aktívny variant", { exact: false }).waitFor({ state: "detached" });
    const firstVariant = color.locator("li").filter({ hasText: "sklad: 0" }).first();
    await firstVariant.getByRole("button", { name: "Upraviť variant" }).click();
    await color.getByLabel("Aktívny variant").uncheck();
    await color.getByRole("button", { name: "Uložiť variant" }).click();
    await firstVariant.getByText("Deaktivovaný", { exact: false }).waitFor();
    await firstVariant.getByRole("button", { name: "Upraviť variant" }).click();
    await color.getByLabel("Aktívny variant").check();
    await color.getByLabel("Sklad").fill("3");
    await color.getByRole("button", { name: "Uložiť variant" }).click();
    await color.getByText("sklad: 3", { exact: false }).waitFor();
    await color.getByRole("button", { name: "Pridať veľkosti" }).click();
    await color.getByLabel("Typ veľkostí").selectOption("numeric");
    await color.getByLabel("35", { exact: true }).check();
    await color.getByLabel("50", { exact: true }).check();
    await color.getByLabel("Spoločná cena v €").fill("20");
    await color.getByRole("button", { name: "Vytvoriť varianty" }).click();
    await color.getByText("50 ·", { exact: false }).waitFor();
    await products.getByLabel("Názov produktu").fill("Updated product");
    await products.getByRole("button", { name: "Uložiť produkt" }).click();
    await products.getByRole("status").filter({ hasText: "Produkt bol uložený." }).waitFor();
    await products.getByRole("button", { name: "Späť na produkty" }).click();
    assert.equal(await products.getByLabel("Názov produktu").count(), 0);
    assert.equal(await products.getByRole("heading", { name: /Farby a varianty/ }).count(), 0);
    await products.getByLabel("Hľadať produkt podľa názvu alebo SKU").fill("Browser product");
    assert.equal(await products.getByText("Updated product", { exact: true }).count(), 0);
    await products.getByLabel("Hľadať produkt podľa názvu alebo SKU").fill("Updated product");
    const product = products.locator("li").filter({ hasText: "browser-product" });
    await product.getByText("Updated product").waitFor();
    await product.getByText("Varianty: 4", { exact: false }).waitFor();
    page.once("dialog", (dialog) => dialog.accept());
    await product.getByRole("button", { name: "Deaktivovať" }).click();
    await product.getByText(/Deaktivovaný/).waitFor();
    page.once("dialog", (dialog) => dialog.accept());
    await product.getByRole("button", { name: "Aktivovať", exact: true }).click();
    await product.getByText(/Aktívny/).waitFor();
    await product.getByRole("button", { name: "Upraviť" }).click();
    await page.getByRole("heading", { name: "Farby a varianty: Updated product" }).waitFor();
    assert.equal(await products.getByLabel("Hľadať produkt podľa názvu alebo SKU").count(), 0);
    assert.equal(await page.getByRole("navigation", { name: "Správa obchodu" }).count(), 1);
    await nav.getByRole("button", { name: "Kategórie" }).click();
    const category = categories.locator("li").filter({ hasText: "browser-kategoria" });
    page.once("dialog", (dialog) => dialog.accept());
    await category.getByRole("button", { name: "Odstrániť" }).click();
    await category.waitFor({ state: "detached" });
    await context.close();
    console.log("Admin customer and product browser tests passed.");
  } finally {
    await browser.close();
  }
}
