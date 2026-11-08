import assert from "node:assert/strict";
import { chromium } from "playwright";

export async function testProfileUi(base, cookie) {
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
    const page = await context.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${base}/account`);
    const form = page.getByRole("heading", { name: "Nastavenia profilu" }).locator("..").locator("form");
    const phone = form.getByLabel("Telefón");
    const submit = form.getByRole("button", { name: "Uložiť zmeny" });
    await phone.fill("123");
    await submit.click();
    await form.getByRole("alert").getByText("Telefón musí obsahovať", { exact: false }).waitFor();
    await phone.fill("+421 900 123 456");
    await submit.click();
    await form.getByRole("status").getByText("Údaje profilu boli uložené.").waitFor();
    await page.reload();
    assert.equal(await phone.inputValue(), "+421 900 123 456");
    const layout = await submit.evaluate((button) => {
      const box = button.getBoundingClientRect();
      const formBox = button.closest("form").getBoundingClientRect();
      return {
        background: getComputedStyle(button).backgroundColor,
        left: box.left,
        formLeft: formBox.left,
      };
    });
    assert.equal(layout.background, "rgb(11, 43, 32)");
    assert.ok(Math.abs(layout.left - layout.formLeft) < 1);
    await page.setViewportSize({ width: 375, height: 900 });
    const ordersLink = page.getByRole("navigation", { name: "Navigácia účtu" })
      .getByRole("link", { name: /História objednávok/ });
    const orderCountSpacing = await ordersLink.evaluate((link) => {
      const count = link.querySelector("b");
      const label = document.createRange();
      label.selectNodeContents(link.firstChild);
      return count.getBoundingClientRect().left - label.getBoundingClientRect().right;
    });
    assert.ok(orderCountSpacing >= 12, `Insufficient order count spacing: ${orderCountSpacing}`);
    const mobile = await submit.evaluate((button) => ({
      button: button.getBoundingClientRect().width,
      form: button.closest("form").getBoundingClientRect().width,
    }));
    assert.ok(Math.abs(mobile.button - mobile.form) < 1);
    await phone.fill("");
    await submit.click();
    await form.getByRole("status").getByText("Údaje profilu boli uložené.").waitFor();
    await page.reload();
    assert.equal(await phone.inputValue(), "");
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 500 });
      const navigation = page.getByRole("navigation", { name: "Navigácia účtu" });
      await navigation.getByRole("link", { name: /História objednávok/ }).click();
      await page.waitForURL("**/account#orders");
      await page.waitForFunction(() => {
        const target = document.querySelector("#orders");
        const heading = target?.querySelector("h2")?.getBoundingClientRect();
        return heading && heading.top >= 64 && heading.bottom <= window.innerHeight;
      });
      await navigation.getByRole("link", { name: "Prehľad profilu" }).click();
      await page.waitForURL("**/account#profile");
      await page.waitForFunction(() => {
        const heading = document.querySelector("#profile h2")?.getBoundingClientRect();
        return heading && heading.top >= 64 && heading.bottom <= window.innerHeight;
      });
    }
    console.log("Profile phone and layout browser tests passed.");
  } finally {
    await browser.close();
  }
}
