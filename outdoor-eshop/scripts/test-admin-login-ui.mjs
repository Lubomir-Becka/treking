import assert from "node:assert/strict";
import { chromium } from "playwright";

export async function testAdminLoginUi(base, password) {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined });
  try {
    const page = await browser.newPage();
    await page.goto(`${base}/login`);
    await page.getByLabel("E-mail").fill("admin@integration.test");
    await page.getByLabel("Heslo").fill(password);
    await page.getByRole("button", { name: "Prihlásiť sa" }).click();
    await page.getByRole("alert").getByText("Nesprávny e-mail alebo heslo.").waitFor();
    assert.equal(new URL(page.url()).pathname, "/login");
    await page.goto(`${base}/admin`);
    await page.getByRole("heading", { name: "Prihlásenie do administrácie" }).waitFor();
    assert.equal(new URL(page.url()).pathname, "/admin/login");
    assert.equal(await page.getByRole("button", { name: "Registrácia" }).count(), 0);
    await page.getByLabel("E-mail").fill("customer@integration.test");
    await page.getByLabel("Heslo").fill(password);
    await page.getByRole("button", { name: "Prihlásiť sa" }).click();
    await page.getByRole("alert").getByText("Nesprávny e-mail alebo heslo.").waitFor();
    await page.getByLabel("E-mail").fill("admin@integration.test");
    await page.getByRole("button", { name: "Prihlásiť sa" }).click();
    await page.getByRole("navigation", { name: "Správa obchodu" }).waitFor();
    assert.equal(new URL(page.url()).pathname, "/admin");
    await page.getByRole("button", { name: "Odhlásiť sa" }).click();
    await page.getByRole("heading", { name: "Prihlásenie do administrácie" }).waitFor();
    assert.equal(new URL(page.url()).pathname, "/admin/login");
    console.log("Separate admin login browser tests passed.");
  } finally {
    await browser.close();
  }
}
