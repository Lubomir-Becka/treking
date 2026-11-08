import assert from "node:assert/strict";
import { chromium } from "playwright";

async function assertFavoritePosition(card) {
  const position = await card.evaluate((element) => {
    const button = element.querySelector('button[aria-pressed]');
    const cardRect = element.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    return {
      position: getComputedStyle(button).position,
      top: buttonRect.top - cardRect.top,
      right: cardRect.right - buttonRect.right,
    };
  });
  assert.equal(position.position, "absolute");
  assert.ok(Math.abs(position.top - 13) < 1, `Unexpected top offset: ${position.top}`);
  assert.ok(Math.abs(position.right - 13) < 1, `Unexpected right offset: ${position.right}`);
}

export async function testFavoritesUi(base, customer, otherCustomer) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
  });
  try {
    const guest = await browser.newPage();
    await guest.goto(`${base}/wishlist`);
    await guest.getByText("Pre uloženie obľúbených produktov sa prihláste.").waitFor();
    assert.equal(await guest.getByRole("link", { name: "Prihlásiť sa" }).count(), 1);
    await guest.close();

    const context = await browser.newContext();
    await context.addCookies([{
      name: "vt_customer_session",
      value: customer.slice("vt_customer_session=".length),
      url: base,
    }]);
    const page = await context.newPage();
    await page.goto(`${base}/products/order-product`);
    const add = page.getByRole("button", { name: "Pridať medzi obľúbené" });
    await add.click();
    await page.getByRole("button", { name: "Odobrať z obľúbených" }).waitFor();
    await page.reload();
    await page.getByRole("button", { name: "Odobrať z obľúbených" }).waitFor();
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/search`);
      const card = page.locator("article").filter({ has: page.getByRole("link", { name: /Order Product/ }) }).first();
      await card.waitFor();
      await assertFavoritePosition(card);
      await card.getByRole("link", { name: /Order Product/ }).click();
      await page.waitForURL("**/products/order-product?**");
      await page.getByRole("button", { name: "Odobrať z obľúbených" }).waitFor();
    }
    await page.route("**/api/account/favorites/*", (route) => route.abort());
    await page.getByRole("button", { name: "Odobrať z obľúbených" }).click();
    await page.getByText("Zmenu sa nepodarilo overiť. Obnovte obľúbené položky.").waitFor();
    assert.equal(await page.getByRole("button", { name: "Odobrať z obľúbených" }).isDisabled(), true);
    await page.unroute("**/api/account/favorites/*");
    await page.getByRole("button", { name: "Obnoviť" }).click();
    await page.getByRole("button", { name: "Odobrať z obľúbených" }).waitFor({ state: "visible" });
    await page.waitForFunction(() => !document.querySelector('[aria-label="Odobrať z obľúbených"]')?.disabled);
    await page.goto(`${base}/wishlist`);
    await page.getByRole("link", { name: /Order Product/ }).waitFor();
    await assertFavoritePosition(page.locator("article").filter({
      has: page.getByRole("link", { name: /Order Product/ }),
    }).first());
    const remove = page.getByRole("button", { name: "Odobrať z obľúbených" });
    await remove.click();
    await page.getByText("Zatiaľ tu nemáte žiadne obľúbené produkty.").waitFor();
    await context.close();

    const otherContext = await browser.newContext();
    await otherContext.addCookies([{
      name: "vt_customer_session",
      value: otherCustomer.slice("vt_customer_session=".length),
      url: base,
    }]);
    const otherPage = await otherContext.newPage();
    await otherPage.goto(`${base}/wishlist`);
    await otherPage.getByText("Zatiaľ tu nemáte žiadne obľúbené produkty.").waitFor();
    await otherContext.close();
    console.log("Favorite browser interaction tests passed.");
  } finally {
    await browser.close();
  }
}
