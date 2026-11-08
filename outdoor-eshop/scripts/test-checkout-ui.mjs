import assert from "node:assert/strict";
import { chromium } from "playwright";

export async function testCheckoutUi(base, cookie) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
  });
  try {
    const context = await browser.newContext();
    await context.addCookies([{
      name: "vt_customer_session",
      value: cookie.slice("vt_customer_session=".length),
      url: base,
    }]);
    const page = await context.newPage();
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/checkout/shipping`);
      const note = page.getByRole("textbox", { name: "Poznámka pre expedičný tím" });
      await note.waitFor();
      assert.equal(await page.locator('label[for="note"]').count(), 0);
      assert.equal(await note.getAttribute("maxlength"), "2000");
      const dimensions = await note.evaluate((element) => {
        const input = element.getBoundingClientRect();
        const container = element.parentElement.getBoundingClientRect();
        return { input: input.width, container: container.width };
      });
      assert.ok(Math.abs(dimensions.input - dimensions.container) < 1);
      await note.fill("Prosím, zavolajte pred doručením.");
      assert.equal(await note.inputValue(), "Prosím, zavolajte pred doručením.");
    }

    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/checkout/cart`);
      await page.evaluate(() => {
        sessionStorage.setItem("vertex-checkout-order", JSON.stringify({
          orderNumber: "VT-TEST",
          totalPrice: 15.90,
        }));
      });
      await page.goto(`${base}/checkout/confirmation`);
      const card = page.locator("main").getByRole("heading", { name: "Ďakujeme za objednávku." }).locator("..");
      const amount = card.locator("strong");
      const back = card.getByRole("link", { name: "Späť na domovskú stránku" });
      await back.waitFor();
      const spacing = await back.evaluate((link) => {
        const price = link.parentElement.querySelector("strong");
        return link.getBoundingClientRect().top - price.getBoundingClientRect().bottom;
      });
      assert.ok(spacing >= 24, `Insufficient spacing after amount: ${spacing}`);
      assert.equal(await back.getAttribute("href"), "/");
      assert.equal(await amount.innerText(), (15.90).toLocaleString("sk-SK", { style: "currency", currency: "EUR" }));
    }

    console.log("Checkout note browser tests passed.");
  } finally {
    await browser.close();
  }
}

export async function testOrderSummaryUi(base, cookie) {
    const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
    });
    try {
      const context = await browser.newContext();
      await context.addCookies([{
        name: "vt_customer_session",
        value: cookie.slice("vt_customer_session=".length),
        url: base,
      }]);
      const page = await context.newPage();
      const price = (amount) => amount.toLocaleString("sk-SK", { style: "currency", currency: "EUR" });
      for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${base}/checkout/cart`);
        const summary = page.locator("aside").filter({ has: page.getByRole("heading", { name: "Zhrnutie objednávky" }) });
        await summary.getByText("Spolu s DPH bez dopravy").waitFor();
        assert.equal(await summary.locator("strong").innerText(), price(10));
        await page.goto(`${base}/checkout/shipping`);
        await page.getByLabel("Kuriér na adresu", { exact: false }).waitFor();
        await page.waitForFunction(() => {
          const summary = [...document.querySelectorAll("aside")].find((item) => item.textContent?.includes("Zhrnutie objednávky"));
          return summary?.textContent?.includes("15,90");
        });
        assert.equal(await summary.locator("strong").innerText(), price(15.90));
        await page.getByLabel("Osobný odber", { exact: false }).check();
        assert.equal(await summary.locator("strong").innerText(), price(10));
        await page.route("**/api/checkout/shipping", (route) => route.abort());
        await page.reload();
        await page.getByText("Cenu dopravy sa nepodarilo načítať.").waitFor();
        await summary.getByText("Spolu s DPH bez dopravy").waitFor();
        assert.equal(await summary.locator("strong").innerText(), price(10));
        await page.unroute("**/api/checkout/shipping");
      }
      console.log("Order summary browser tests passed.");
    } finally {
      await browser.close();
  }
}
