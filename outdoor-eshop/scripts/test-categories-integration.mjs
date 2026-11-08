import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:net";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import postgres from "postgres";
import sharp from "sharp";
import bcrypt from "bcryptjs";

// Run after npm run build. This creates and removes its own PostgreSQL container.
function command(program, args, options = {}) {
  const result = spawnSync(program, args, { encoding: "utf8", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${program} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout.trim();
}

async function unusedPort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Cannot allocate a port.");
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

async function waitForDatabase(sql) {
  let lastError;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      await sql`select 1`;
      return;
    } catch (error) {
      lastError = error;
      await delay(500);
    }
  }
  throw new Error("Test database did not start.", { cause: lastError });
}

async function waitForServer(url, server) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error("Test server exited before becoming ready.");
    try {
      await fetch(`${url}/api/admin/categories`);
      return;
    } catch {
      await delay(500);
    }
  }
  throw new Error("Test server did not start.");
}

let containerId;
let sql;
let server;
let imageDirectory;
let serverOutput = "";
try {
  containerId = command("docker", [
    "run", "--detach", "--rm",
    "--env", "POSTGRES_PASSWORD=test-password",
    "--env", "POSTGRES_DB=category_integration",
    "--publish", "127.0.0.1::5432",
    "postgres:16-alpine",
  ]);
  const mapping = command("docker", ["port", containerId, "5432/tcp"]);
  const port = Number(mapping.split(":").at(-1));
  assert.ok(port > 0, `Invalid database port: ${mapping}`);
  const databaseUrl = `postgres://postgres:test-password@127.0.0.1:${port}/category_integration`;
  sql = postgres(databaseUrl, { max: 1, connect_timeout: 2 });
  await waitForDatabase(sql);
  await sql`create database favorites_migration`;
  const { testFavoritesMigration } = await import("./test-favorites-migration.mjs");
  await testFavoritesMigration(port);
  await sql`create database seed_verification`;
  const seedUrl = new URL(databaseUrl);
  seedUrl.pathname = "/seed_verification";
  command("npm", ["run", "db:migrate"], {
    env: { ...process.env, DATABASE_URL: seedUrl.toString() },
  });
  command("npm", ["run", "db:seed"], {
    env: { ...process.env, DATABASE_URL: seedUrl.toString() },
  });
  const seedDb = postgres(seedUrl.toString(), { max: 1 });
  try {
    assert.ok((await seedDb`select count(*)::int as count from products`)[0].count > 0);
    assert.ok((await seedDb`select count(*)::int as count from product_variants`)[0].count > 0);
  } finally {
    await seedDb.end();
  }
  command("npm", ["run", "db:migrate"], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  async function createSession(role, email = `${role}@integration.test`) {
    const token = randomBytes(32).toString("hex");
    const hash = createHash("sha256").update(token).digest("hex");
    const [user] = await sql`
      insert into users (first_name, last_name, email, password_hash, role)
      values ('Test', 'User', ${email}, 'unused', ${role})
      returning id
    `;
    await sql`
      insert into user_sessions (user_id, token_hash, expires_at)
      values (${user.id}, ${hash}, now() + interval '1 hour')
    `;
    return `vt_customer_session=${token}`;
  }

  const admin = await createSession("admin");
  const customer = await createSession("customer");
  const otherCustomer = await createSession("customer", "other@integration.test");
  const appPort = await unusedPort();
  const base = `http://127.0.0.1:${appPort}`;
  imageDirectory = await mkdtemp(join(tmpdir(), "product-images-test-"));
  server = spawn("./node_modules/.bin/next", ["start", "-H", "127.0.0.1", "-p", String(appPort)], {
    env: { ...process.env, DATABASE_URL: databaseUrl, PRODUCT_IMAGE_DIRECTORY: imageDirectory, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
  server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });
  await waitForServer(base, server);

  async function request(method, path, cookie, body, origin = base) {
    const headers = {};
    if (cookie) headers.cookie = cookie;
    if (origin !== null) headers.origin = origin;
    if (body !== undefined) headers["content-type"] = "application/json";
    return fetch(`${base}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  const loginPassword = "integration-login-password";
  const loginHash = await bcrypt.hash(loginPassword, 4);
  await sql`update users set password_hash = ${loginHash} where email in ('admin@integration.test', 'customer@integration.test')`;
  const login = (path, email) => request("POST", path, undefined, { email, password: loginPassword });
  const invalidRegistration = await request("POST", "/api/auth/register", undefined, {
    email: "invalid-phone@integration.test",
    password: loginPassword,
    firstName: "Jana",
    lastName: "Nová",
    phone: "abcdefgh",
  });
  assert.equal(invalidRegistration.status, 400);
  assert.match((await invalidRegistration.json()).error, /Telefón/);
  assert.equal((await request("POST", "/api/auth/login", undefined, {
    email: "customer@integration.test",
    password: "a".repeat(73),
  })).status, 401);
  const adminThroughCustomer = await login("/api/auth/login", "admin@integration.test");
  assert.equal(adminThroughCustomer.status, 401);
  assert.equal(adminThroughCustomer.headers.get("set-cookie"), null);
  const customerThroughAdmin = await login("/api/admin/auth/login", "customer@integration.test");
  assert.equal(customerThroughAdmin.status, 401);
  assert.equal(customerThroughAdmin.headers.get("set-cookie"), null);
  const customerLogin = await login("/api/auth/login", "customer@integration.test");
  assert.equal(customerLogin.status, 200);
  assert.equal((await customerLogin.json()).data.role, "customer");
  const customerLoginCookie = customerLogin.headers.get("set-cookie")?.split(";")[0];
  assert.ok(customerLoginCookie);
  const profileInput = { firstName: "Test", lastName: "User" };
  assert.equal((await request("PATCH", "/api/account/profile", undefined, { ...profileInput, phone: "1234567" })).status, 401);
  const invalidPhone = await request("PATCH", "/api/account/profile", customerLoginCookie, { ...profileInput, phone: "123" });
  assert.equal(invalidPhone.status, 400);
  assert.match((await invalidPhone.json()).error, /Telefón/);
  assert.equal((await request("PATCH", "/api/account/profile", customerLoginCookie, { ...profileInput, phone: null })).status, 400);
  const updatedProfile = await request("PATCH", "/api/account/profile", customerLoginCookie, { ...profileInput, phone: " +421 900 123 456 " });
  assert.equal(updatedProfile.status, 200);
  assert.equal((await updatedProfile.json()).data.phone, "+421 900 123 456");
  assert.equal((await sql`select phone from users where email = 'customer@integration.test'`)[0].phone, "+421 900 123 456");
  const preservedProfile = await request("PATCH", "/api/account/profile", customerLoginCookie, profileInput);
  assert.equal((await preservedProfile.json()).data.phone, "+421 900 123 456");
  const clearedProfile = await request("PATCH", "/api/account/profile", customerLoginCookie, { ...profileInput, phone: "" });
  assert.equal((await clearedProfile.json()).data.phone, null);
  assert.equal((await sql`select phone from users where email = 'customer@integration.test'`)[0].phone, null);
  assert.equal((await request("GET", "/api/admin/products", customerLoginCookie)).status, 403);
  const failedAdminLogin = await request("POST", "/api/admin/auth/login", customerLoginCookie, {
    email: "customer@integration.test", password: loginPassword,
  });
  assert.equal(failedAdminLogin.status, 401);
  assert.equal(failedAdminLogin.headers.get("set-cookie"), null);
  assert.equal((await request("GET", "/api/auth/session", customerLoginCookie)).status, 200);
  assert.equal((await (await request("GET", "/api/auth/session", customerLoginCookie)).json()).data.authenticated, true);
  const adminLogin = await login("/api/admin/auth/login", "admin@integration.test");
  assert.equal(adminLogin.status, 200);
  assert.equal((await adminLogin.json()).data.role, "admin");
  const adminLoginCookie = adminLogin.headers.get("set-cookie")?.split(";")[0];
  assert.ok(adminLoginCookie);
  assert.equal((await request("GET", "/api/admin/products", adminLoginCookie)).status, 200);
  const adminRedirect = await fetch(`${base}/admin`, { redirect: "manual" });
  assert.equal(adminRedirect.status, 307);
  assert.equal(new URL(adminRedirect.headers.get("location"), base).pathname, "/admin/login");
  const oldLoginRedirect = await fetch(`${base}/login?next=%2Fadmin`, { redirect: "manual" });
  assert.equal(oldLoginRedirect.status, 307);
  assert.equal(new URL(oldLoginRedirect.headers.get("location"), base).pathname, "/admin/login");
  if (process.env.CATEGORY_UI_TEST === "1") {
    const { testAdminLoginUi } = await import("./test-admin-login-ui.mjs");
    await testAdminLoginUi(base, loginPassword);
    const { testCheckoutUi } = await import("./test-checkout-ui.mjs");
    await testCheckoutUi(base, customerLoginCookie);
    const { testProfileUi } = await import("./test-profile-ui.mjs");
    await testProfileUi(base, customerLoginCookie);
    const { testHeaderUi } = await import("./test-header-ui.mjs");
    await testHeaderUi(base);
  }

  const customerPath = "/api/admin/customers";
  const createdCookie = await createSession("customer", "created@integration.test");
  await sql`update users set password_hash = ${loginHash} where email = 'created@integration.test'`;
  assert.equal((await request("GET", customerPath)).status, 401);
  assert.equal((await request("GET", customerPath, customer)).status, 403);
  assert.equal((await request("POST", customerPath, admin, {})).status, 405);
  const customerList = await (await request("GET", customerPath, admin)).json();
  const createdCustomer = customerList.data.find((entry) => entry.email === "created@integration.test");
  assert.ok(createdCustomer);
  assert.equal("passwordHash" in createdCustomer, false);
  const [adminUser] = await sql`select id from users where role = 'admin' limit 1`;
  assert.equal(customerList.data.some((entry) => entry.id === adminUser.id), false);
  assert.equal((await request("DELETE", `${customerPath}/${adminUser.id}`, admin)).status, 404);
  assert.equal((await request("PUT", `${customerPath}/${createdCustomer.id}`, admin, {})).status, 405);
  assert.equal((await request("PATCH", `${customerPath}/${createdCustomer.id}`, admin, {})).status, 400);
  assert.equal((await request("PATCH", `${customerPath}/${createdCustomer.id}`, admin, { active: "false" })).status, 400);
  assert.equal((await request("PATCH", `${customerPath}/invalid`, admin, { active: false })).status, 400);
  assert.equal((await request("PATCH", `${customerPath}/2147483647`, admin, { active: false })).status, 404);
  assert.equal((await request("PATCH", `${customerPath}/${adminUser.id}`, admin, { active: false })).status, 404);
  assert.equal((await request("PATCH", `${customerPath}/${createdCustomer.id}`, customer, { active: false })).status, 403);
  assert.equal((await request("PATCH", `${customerPath}/${createdCustomer.id}`, admin, { active: false }, "http://evil.example")).status, 403);
  assert.equal((await request("PATCH", `${customerPath}/${createdCustomer.id}`, admin, { active: false })).status, 200);
  const inactiveCustomers = (await (await request("GET", customerPath, admin)).json()).data;
  assert.equal(inactiveCustomers.find((entry) => entry.id === createdCustomer.id).isActive, false);
  assert.equal((await sql`select count(*)::int as count from user_sessions where user_id = ${createdCustomer.id}`)[0].count, 0);
  assert.equal((await login("/api/auth/login", "created@integration.test")).status, 401);
  assert.equal((await (await request("GET", "/api/auth/session", createdCookie)).json()).data.authenticated, false);
  assert.equal((await request("PATCH", `${customerPath}/${createdCustomer.id}`, admin, { active: true })).status, 200);
  assert.equal((await (await request("GET", "/api/auth/session", createdCookie)).json()).data.authenticated, false);
  assert.equal((await login("/api/auth/login", "created@integration.test")).status, 200);
  assert.equal((await request("DELETE", `${customerPath}/${createdCustomer.id}`, customer)).status, 403);
  assert.equal((await request("DELETE", `${customerPath}/${createdCustomer.id}`, admin, undefined, "http://evil.example")).status, 403);

  const productsPath = "/api/admin/products";
  assert.equal((await request("GET", `/api/products?q=${"a".repeat(201)}`)).status, 400);
  assert.equal((await request("GET", "/api/products?colorId=2147483648")).status, 400);
  assert.equal((await request("GET", "/api/products?limit=invalid")).status, 400);
  assert.equal((await request("GET", "/api/products?audience=invalid")).status, 400);
  assert.equal((await request("GET", "/api/categories?audience=invalid")).status, 400);
  assert.equal((await request("GET", "/api/categories?audience=men&audience=women")).status, 400);
  const newProduct = {
    name: "Created product", slug: "created-product", brand: "Brand",
    categoryId: null, audience: "unisex", description: "",
  };
  assert.equal((await request("GET", productsPath)).status, 401);
  assert.equal((await request("GET", productsPath, customer)).status, 403);
  assert.equal((await request("POST", productsPath, admin, newProduct, "http://evil.example")).status, 403);
  assert.equal((await request("POST", productsPath, admin, { ...newProduct, name: "bad\0name" })).status, 400);
  const missingCategory = await request("POST", productsPath, admin, { ...newProduct, categoryId: 2_147_483_647 });
  assert.equal(missingCategory.status, 400);
  assert.match((await missingCategory.json()).error, /kategória neexistuje/);
  const invalidSlug = await request("POST", productsPath, admin, { ...newProduct, slug: "Invalid slug" });
  assert.equal(invalidSlug.status, 400);
  assert.match((await invalidSlug.json()).error, /Slug/);
  assert.equal((await request("POST", productsPath, admin, newProduct)).status, 201);
  assert.equal((await request("POST", productsPath, admin, newProduct)).status, 409);
  const productsList = await (await request("GET", productsPath, admin)).json();
  const createdProduct = productsList.data.find((entry) => entry.slug === newProduct.slug);
  assert.ok(createdProduct);
  assert.equal((await request("PUT", `${productsPath}/${createdProduct.id}`, admin, {
    ...newProduct, name: "Updated product",
  })).status, 200);
  assert.equal((await request("PATCH", `${productsPath}/${createdProduct.id}`, admin, { active: false })).status, 200);
  assert.equal((await sql`select is_active from products where id = ${createdProduct.id}`)[0].is_active, false);
  assert.equal((await request("PATCH", `${productsPath}/${createdProduct.id}`, admin, { active: true })).status, 200);
  const inventoryPath = `${productsPath}/${createdProduct.id}/inventory`;
  const colorInput = { action: "saveColor", input: { name: "Zelená", hexCode: "#112233" } };
  assert.equal((await request("GET", inventoryPath)).status, 401);
  assert.equal((await request("GET", inventoryPath, customer)).status, 403);
  assert.equal((await request("POST", inventoryPath, admin, colorInput, "http://evil.example")).status, 403);
  assert.equal((await request("POST", inventoryPath, admin, { ...colorInput, input: { name: "", hexCode: "invalid" } })).status, 400);
  assert.equal((await request("POST", inventoryPath, admin, colorInput)).status, 200);
  assert.equal((await request("POST", inventoryPath, admin, colorInput)).status, 409);
  let inventory = (await (await request("GET", inventoryPath, admin)).json()).data;
  assert.equal(inventory.length, 1);
  const inventoryColorId = inventory[0].id;
  const variantInput = {
    action: "saveVariant", colorId: inventoryColorId,
    input: { sku: "INVENTORY-M", size: "M", price: "20.50", stock: 5, isActive: true },
  };
  const invalidStock = await request("POST", inventoryPath, admin, { ...variantInput, input: { ...variantInput.input, stock: -1 } });
  assert.equal(invalidStock.status, 400);
  assert.match((await invalidStock.json()).error, /Sklad/);
  assert.equal((await request("POST", inventoryPath, admin, { ...variantInput, colorId: 2_147_483_647 })).status, 404);
  assert.equal((await request("POST", inventoryPath, admin, variantInput)).status, 200);
  assert.equal((await request("POST", inventoryPath, admin, variantInput)).status, 409);
  assert.equal((await request("POST", inventoryPath, admin, {
    ...variantInput, input: { ...variantInput.input, sku: "INVENTORY-S", size: "S" },
  })).status, 200);
  inventory = (await (await request("GET", inventoryPath, admin)).json()).data;
  assert.deepEqual(inventory[0].variants.map((item) => item.size), ["S", "M"]);
  const variantId = inventory[0].variants[1].id;
  const [customerOrder] = await sql`
    insert into orders (user_id, customer_email, order_number, items_subtotal, shipping_cost, total_price,
      shipping_recipient, shipping_street, shipping_city, shipping_postal_code, shipping_phone)
    values (${createdCustomer.id}, 'created@integration.test', 'DELETE-ME', 20.50, 0, 20.50,
      'Test User', 'Street', 'City', '12345', '123')
    returning id
  `;
  await sql`
    insert into order_items (order_id, product_variant_id, product_name, sku, quantity, unit_price)
    values (${customerOrder.id}, ${variantId}, 'Product', 'INVENTORY-M', 1, 20.50)
  `;
  await sql`insert into favorites (user_id, product_color_id) values (${createdCustomer.id}, ${inventoryColorId})`;
  const [customerCart] = await sql`insert into carts (user_id) values (${createdCustomer.id}) returning id`;
  await sql`insert into cart_items (cart_id, product_variant_id, quantity) values (${customerCart.id}, ${variantId}, 1)`;
  assert.equal((await request("PATCH", `${customerPath}/${createdCustomer.id}`, admin, { active: false })).status, 200);
  assert.equal((await sql`select count(*)::int as count from orders where id = ${customerOrder.id}`)[0].count, 1);
  assert.equal((await sql`select count(*)::int as count from favorites where user_id = ${createdCustomer.id}`)[0].count, 1);
  assert.equal((await sql`select count(*)::int as count from carts where id = ${customerCart.id}`)[0].count, 1);
  assert.equal((await request("DELETE", `${customerPath}/${createdCustomer.id}`, admin)).status, 200);
  assert.equal((await sql`select count(*)::int as count from users where id = ${createdCustomer.id}`)[0].count, 0);
  assert.equal((await sql`select count(*)::int as count from orders where id = ${customerOrder.id}`)[0].count, 0);
  assert.equal((await sql`select count(*)::int as count from order_items where order_id = ${customerOrder.id}`)[0].count, 0);
  assert.equal((await sql`select count(*)::int as count from user_sessions where user_id = ${createdCustomer.id}`)[0].count, 0);
  assert.equal((await sql`select count(*)::int as count from favorites where user_id = ${createdCustomer.id}`)[0].count, 0);
  assert.equal((await sql`select count(*)::int as count from carts where id = ${customerCart.id}`)[0].count, 0);
  assert.equal((await sql`select count(*)::int as count from cart_items where cart_id = ${customerCart.id}`)[0].count, 0);
  assert.equal((await request("POST", inventoryPath, admin, {
    ...variantInput, variantId, input: { ...variantInput.input, stock: 7, isActive: false },
  })).status, 200);
  assert.equal((await request("POST", inventoryPath, admin, {
    action: "deleteColor", colorId: inventoryColorId,
  })).status, 409);
  const updatedProducts = (await (await request("GET", productsPath, admin)).json()).data;
  const inventoryProduct = updatedProducts.find((item) => item.id === createdProduct.id);
  assert.equal(inventoryProduct.variantCount, 2);
  assert.equal(inventoryProduct.activeVariantCount, 1);
  assert.deepEqual(inventoryProduct.skus.sort(), ["INVENTORY-M", "INVENTORY-S"]);
  const catalogInventory = (await (await request("GET", `/api/products?colorId=${inventoryColorId}`)).json()).data;
  assert.equal(catalogInventory.length, 1);
  assert.equal(catalogInventory[0].stock, 5);
  const [otherUser] = await sql`select id from users where email = 'other@integration.test'`;
  await sql`insert into favorites (user_id, product_color_id) values (${otherUser.id}, ${inventoryColorId})`;
  await sql`insert into product_images (product_color_id, image_url, is_primary) values (${inventoryColorId}, '/color-test.jpg', true)`;
  assert.equal((await request("POST", inventoryPath, admin, {
    action: "saveColor", colorId: inventoryColorId, input: { name: "Modrá", hexCode: "#abcdef" },
  })).status, 200);
  const [inventoryColor] = await sql`select color_name from product_colors where id = ${inventoryColorId}`;
  assert.equal(inventoryColor.color_name, "Modrá");
  assert.equal((await sql`select count(*)::int as count from favorites where user_id = ${otherUser.id} and product_color_id = ${inventoryColorId}`)[0].count, 1);
  inventory = (await (await request("GET", inventoryPath, admin)).json()).data;
  assert.equal(inventory[0].imageUrl, "/color-test.jpg");
  assert.equal(inventory[0].variants.length, 2);
  await sql`delete from favorites where user_id = ${otherUser.id} and product_color_id = ${inventoryColorId}`;
  await sql`delete from product_images where product_color_id = ${inventoryColorId}`;
  assert.equal((await request("POST", inventoryPath, admin, {
    action: "saveColor", input: { name: "Prázdna", hexCode: "#000000" },
  })).status, 200);
  inventory = (await (await request("GET", inventoryPath, admin)).json()).data;
  const emptyColor = inventory.find((entry) => entry.name === "Prázdna");
  assert.equal((await request("POST", inventoryPath, admin, { action: "deleteColor", colorId: emptyColor.id })).status, 200);
  const batch = { action: "createVariants", colorId: inventoryColorId, input: { sizes: ["XS", "XL"], price: "30.50" } };
  assert.equal((await request("POST", inventoryPath, customer, batch)).status, 403);
  assert.equal((await request("POST", inventoryPath, admin, { ...batch, input: { ...batch.input, sizes: ["S", "35"] } })).status, 400);
  assert.equal((await request("POST", inventoryPath, admin, batch)).status, 200);
  const batchRows = await sql`select size, stock, price, sku from product_variants where product_color_id = ${inventoryColorId} and size in ('XS', 'XL') order by size`;
  assert.equal(batchRows.length, 2);
  assert.ok(batchRows.every((row) => row.stock === 0 && row.price === "30.50" && row.sku.startsWith("VT-")));
  assert.notEqual(batchRows[0].sku, batchRows[1].sku);
  assert.equal((await request("POST", inventoryPath, admin, { ...batch, input: { ...batch.input, sizes: ["XS", "XXL"] } })).status, 409);
  assert.equal((await sql`select count(*)::int as count from product_variants where product_color_id = ${inventoryColorId} and size = 'XXL'`)[0].count, 0);
  assert.equal((await request("POST", inventoryPath, admin, { ...batch, input: { sizes: ["35", "50"], price: "14" } })).status, 200);
  assert.equal((await request("POST", "/api/admin/products/2147483647/inventory", admin, variantInput)).status, 404);
  if (process.env.CATEGORY_UI_TEST === "1") {
    await createSession("customer", "browser@integration.test");
    await createSession("customer", "inactive-browser@integration.test");
    await sql`update users set is_active = false where email = 'inactive-browser@integration.test'`;
    const { testAdminManagementUi } = await import("./test-admin-management-ui.mjs");
    await testAdminManagementUi(base, admin, () => createSession("customer", "new-browser@integration.test"));
  }

  const path = "/api/admin/categories";
  const input = { name: "Root", slug: "root", parentId: null };
  for (const [method, target, body] of [
    ["GET", path, undefined],
    ["POST", path, input],
    ["PUT", `${path}/1`, input],
    ["DELETE", `${path}/1`, undefined],
  ]) {
    assert.equal((await request(method, target, null, body)).status, 401, `${method} guest`);
    assert.equal((await request(method, target, customer, body)).status, 403, `${method} customer`);
  }
  for (const origin of [null, "http://evil.example", base.replace("http:", "https:")]) {
    assert.equal((await request("POST", path, admin, input, origin)).status, 403);
  }
  assert.equal((await request("PUT", `${path}/1`, admin, input, null)).status, 403);
  assert.equal((await request("DELETE", `${path}/1`, admin, undefined, "http://evil.example")).status, 403);
  assert.equal((await request("POST", path, admin, { ...input, name: "" })).status, 400);
  const invalidName = await request("POST", path, admin, { ...input, name: "Bad\u0000name" });
  assert.equal(invalidName.status, 400);
  assert.equal((await invalidName.json()).error, "Názov nesmie obsahovať riadiace znaky.");
  assert.equal((await request("POST", path, admin, { ...input, parentId: 2_147_483_648 })).status, 400);
  assert.equal((await request("DELETE", `${path}/2147483648`, admin)).status, 400);
  assert.equal((await request("DELETE", `${path}/1e0`, admin)).status, 400);
  assert.equal((await request("PUT", `${path}/01`, admin, input)).status, 400);
  assert.equal((await request("POST", path, admin, input)).status, 201);
  assert.equal((await request("POST", path, admin, input)).status, 409);

  async function categories() {
    const response = await request("GET", path, admin);
    assert.equal(response.status, 200);
    return (await response.json()).data;
  }
  let rows = await categories();
  const root = rows.find((row) => row.slug === "root");
  assert.ok(root);
  const invalidUpdate = await request("PUT", `${path}/${root.id}`, admin, {
    ...input, name: "Bad\u0000name",
  });
  assert.equal(invalidUpdate.status, 400);
  assert.equal((await invalidUpdate.json()).error, "Názov nesmie obsahovať riadiace znaky.");
  assert.equal((await categories()).find((row) => row.id === root.id).name, "Root");

  assert.equal((await request("POST", path, admin, {
    name: "Zeta", slug: "bundy", parentId: null,
  })).status, 201);
  assert.equal((await request("POST", path, admin, {
    name: "Alpha", slug: "alpha", parentId: null,
  })).status, 201);
  async function publicCategoryNames() {
    const response = await request("GET", "/api/categories");
    assert.equal(response.status, 200);
    return (await response.json()).data.map((category) => category.name);
  }
  assert.deepEqual(await publicCategoryNames(), ["Alpha", "Root", "Zeta"]);
  rows = await categories();
  const zeta = rows.find((row) => row.name === "Zeta");
  assert.ok(zeta);
  assert.equal((await request("PUT", `${path}/${zeta.id}`, admin, {
    name: "Zeta", slug: "zeta", parentId: null,
  })).status, 200);
  assert.deepEqual(await publicCategoryNames(), ["Alpha", "Root", "Zeta"]);

  if (process.env.CATEGORY_UI_TEST === "1") {
    const { testCategoryRefresh } = await import("./test-categories-ui.mjs");
    await testCategoryRefresh(base, admin);
  }
  assert.equal((await request("POST", path, admin, {
    name: "Child", slug: "child", parentId: root.id,
  })).status, 201);
  rows = await categories();
  const child = rows.find((row) => row.slug === "child");
  assert.ok(child);
  assert.equal((await request("POST", path, admin, {
    name: "Third", slug: "third", parentId: child.id,
  })).status, 400);
  assert.equal((await request("PUT", `${path}/${root.id}`, admin, {
    ...input, parentId: child.id,
  })).status, 400);
  assert.equal((await request("PUT", `${path}/${child.id}`, admin, {
    name: "Child", slug: "child", parentId: child.id,
  })).status, 400);
  assert.equal((await request("POST", path, admin, {
    name: "Missing", slug: "missing", parentId: 2_147_483_647,
  })).status, 400);
  assert.equal((await request("DELETE", `${path}/${root.id}`, admin)).status, 409);
  await sql`insert into products (name, slug, brand, category_id)
    values ('Test', 'test-product', 'Test', ${child.id})`;
  assert.equal((await request("DELETE", `${path}/${child.id}`, admin)).status, 409);
  await sql`delete from products where slug = 'test-product'`;
  assert.equal((await request("PUT", `${path}/${child.id}`, admin, {
    name: "Updated", slug: "updated", parentId: root.id,
  })).status, 200);
  assert.equal((await request("DELETE", `${path}/${child.id}`, admin)).status, 200);
  assert.equal((await request("DELETE", `${path}/${root.id}`, admin)).status, 200);
  assert.equal((await request("DELETE", `${path}/${root.id}`, admin)).status, 404);

  for (const slug of ["race-a", "race-b"]) {
    assert.equal((await request("POST", path, admin, {
      name: slug, slug, parentId: null,
    })).status, 201);
  }
  rows = await categories();
  const a = rows.find((row) => row.slug === "race-a");
  const b = rows.find((row) => row.slug === "race-b");
  assert.ok(a && b);
  const concurrent = await Promise.all([
    request("PUT", `${path}/${a.id}`, admin, { name: a.name, slug: a.slug, parentId: b.id }),
    request("PUT", `${path}/${b.id}`, admin, { name: b.name, slug: b.slug, parentId: a.id }),
  ]);
  assert.deepEqual(concurrent.map((response) => response.status).sort(), [200, 400]);

  const [customerUser] = await sql`select id from users where email = 'customer@integration.test'`;
  const [product] = await sql`
    insert into products (name, slug, brand) values ('Order Product', 'order-product', 'Test')
    returning id
  `;
  const [color] = await sql`
    insert into product_colors (product_id, color_name) values (${product.id}, 'Black') returning id
  `;
  const [secondColor] = await sql`
    insert into product_colors (product_id, color_name) values (${product.id}, 'Blue') returning id
  `;
  const [variant] = await sql`
    insert into product_variants (product_color_id, sku, size, price, stock)
    values (${color.id}, 'test-order-sku', 'M', 10, 10) returning id
  `;
  await sql`
    insert into product_images (product_color_id, image_url, is_primary)
    values (${color.id}, '/test-image.jpg', true)
  `;
  const imagePath = `/api/admin/product-images/${color.id}`;
  const image = await sharp({ create: { width: 3, height: 3, channels: 3, background: "red" } }).png().toBuffer();
  function imageForm(content, type = "image/png") {
    const form = new FormData();
    form.append("image", new Blob([content], { type }), "image.png");
    return form;
  }
  async function imageRequest(method, cookie, body, origin = base) {
    return fetch(`${base}${imagePath}`, {
      method,
      headers: { ...(cookie ? { cookie } : {}), origin },
      body,
    });
  }
  assert.equal((await imageRequest("POST", customer, imageForm(image))).status, 403);
  assert.equal((await imageRequest("POST", admin, imageForm(Buffer.from("invalid")))).status, 400);
  assert.equal((await imageRequest("POST", admin, imageForm(image))).status, 200);
  assert.equal((await imageRequest("POST", admin, imageForm(image))).status, 200);
  const galleryPath = `/api/admin/product-images/${color.id}`;
  let gallery = (await (await request("GET", `${productsPath}/${product.id}/inventory`, admin)).json()).data
    .find((entry) => entry.id === color.id).images;
  assert.equal(gallery.length, 3);
  const imageOrder = gallery.map((entry) => entry.id).reverse();
  assert.equal((await request("PATCH", galleryPath, customer, { type: "order", imageIds: imageOrder })).status, 403);
  assert.equal((await request("PATCH", galleryPath, admin, { type: "order", imageIds: [imageOrder[0]] })).status, 409);
  assert.equal((await request("PATCH", galleryPath, admin, { type: "order", imageIds: imageOrder })).status, 200);
  assert.equal((await request("PATCH", galleryPath, admin, { type: "primary", imageId: imageOrder[1] })).status, 200);
  gallery = (await (await request("GET", `${productsPath}/${product.id}/inventory`, admin)).json()).data
    .find((entry) => entry.id === color.id).images;
  assert.deepEqual(gallery.map((entry) => entry.id), imageOrder);
  assert.equal(gallery.find((entry) => entry.isPrimary).id, imageOrder[1]);
  const productDetail = (await (await request("GET", "/api/products/order-product")).json()).data;
  assert.deepEqual(productDetail.colors.find((entry) => entry.id === color.id).images.map((entry) => entry.url), gallery.map((entry) => entry.url));
  for (const entry of gallery.filter((item) => item.url.startsWith("/api/product-images/"))) {
    assert.equal((await request("PATCH", galleryPath, admin, { type: "delete", imageId: entry.id })).status, 200);
  }
  assert.equal((await imageRequest("PUT", null, imageForm(image))).status, 401);
  assert.equal((await imageRequest("PUT", customer, imageForm(image))).status, 403);
  assert.equal((await imageRequest("PUT", admin, imageForm(image), "http://evil.example")).status, 403);
  assert.equal((await imageRequest("PUT", admin, imageForm(Buffer.from("not an image")))).status, 400);
  assert.equal((await imageRequest("PUT", admin, imageForm(image, "image/jpeg"))).status, 400);
  assert.equal((await imageRequest("PUT", admin, imageForm(Buffer.alloc(5 * 1024 * 1024 + 1)))).status, 400);
  assert.equal((await imageRequest("PUT", admin, imageForm(image))).status, 200);
  const [uploaded] = await sql`select image_url from product_images where product_color_id = ${color.id} and is_primary`;
  const served = await fetch(`${base}${uploaded.image_url}`);
  assert.equal(served.status, 200);
  assert.equal(served.headers.get("content-type"), "image/webp");
  assert.equal((await sharp(Buffer.from(await served.arrayBuffer())).metadata()).format, "webp");
  const catalog = await (await request("GET", `/api/products?colorIds=${color.id}`)).text();
  assert.match(catalog, /api\/product-images\//);
  await sql`insert into product_images (product_color_id, image_url, is_primary) values (${color.id}, '/fallback.jpg', false)`;
  assert.equal((await imageRequest("DELETE", admin)).status, 200);
  const [fallback] = await sql`select image_url from product_images where product_color_id = ${color.id} and is_primary`;
  assert.equal(fallback.image_url, "/fallback.jpg");
  assert.equal((await fetch(`${base}${uploaded.image_url}`)).status, 404);
  assert.equal((await imageRequest("DELETE", admin)).status, 200);
  const withoutImage = await (await request("GET", `/api/products?colorIds=${color.id}`)).text();
  assert.match(withoutImage, /Order Product/);
  if (process.env.CATEGORY_UI_TEST === "1") {
    const { testProductImagesUi } = await import("./test-product-images-ui.mjs");
    await testProductImagesUi({ base, cookie: admin, colorId: color.id, image });
  }
  await sql`insert into product_images (product_color_id, image_url, is_primary) values (${color.id}, '/test-image.jpg', true)`;
  if (process.env.IMAGE_DOCKER_TEST === "1") {
    const { testProductImagesDocker } = await import("./test-product-images-docker.mjs");
    await testProductImagesDocker({
      databaseUrl,
      port: await unusedPort(),
      cookie: admin,
      colorId: color.id,
      image,
    });
    await sql`delete from product_images where product_color_id = ${color.id} and is_primary`;
    await sql`insert into product_images (product_color_id, image_url, is_primary) values (${color.id}, '/test-image.jpg', true)`;
  }
  const favoritesPath = "/api/account/favorites";
  const favoriteColor = `${favoritesPath}/${color.id}`;
  for (const [method, target] of [
    ["GET", favoritesPath],
    ["PUT", favoriteColor],
    ["DELETE", favoriteColor],
  ]) {
    assert.equal((await request(method, target)).status, 401);
    assert.equal((await request(method, target, admin)).status, 403);
  }
  assert.equal((await request("PUT", favoriteColor, customer, undefined, "http://evil.example")).status, 403);
  assert.equal((await request("PUT", `${favoritesPath}/2147483648`, customer)).status, 400);
  assert.equal((await request("PUT", `${favoritesPath}/2147483647`, customer)).status, 404);
  assert.equal((await request("PUT", favoriteColor, customer)).status, 200);
  assert.equal((await request("PUT", favoriteColor, customer)).status, 200);
  assert.equal((await request("PUT", `${favoritesPath}/${secondColor.id}`, customer)).status, 200);
  assert.deepEqual(
    (await (await request("GET", favoritesPath, customer)).json()).data.sort((a, b) => a - b),
    [color.id, secondColor.id].sort((a, b) => a - b),
  );
  assert.deepEqual((await (await request("GET", favoritesPath, otherCustomer)).json()).data, []);
  assert.equal((await request("DELETE", favoriteColor, otherCustomer)).status, 200);
  assert.equal((await (await request("GET", favoritesPath, customer)).json()).data.length, 2);
  assert.equal((await request("DELETE", favoriteColor, customer)).status, 200);
  assert.equal((await request("DELETE", `${favoritesPath}/${secondColor.id}`, customer)).status, 200);
  assert.deepEqual((await (await request("GET", favoritesPath, customer)).json()).data, []);
  await sql`update products set is_active = false where id = ${product.id}`;
  assert.equal((await request("PUT", favoriteColor, customer)).status, 404);
  await sql`update products set is_active = true where id = ${product.id}`;
  if (process.env.CATEGORY_UI_TEST === "1") {
    const { testFavoritesUi } = await import("./test-favorites-ui.mjs");
    await testFavoritesUi(base, customer, otherCustomer);
  }
  const [order] = await sql`
    insert into orders (user_id, customer_email, order_number, items_subtotal, shipping_cost,
      total_price, shipping_method, shipping_recipient, shipping_street, shipping_city, shipping_postal_code, shipping_phone)
    values (${customerUser.id}, 'customer@integration.test', 'TEST-ORDER-1', 30, 2, 32,
      'Test Courier', 'Test User', 'Test Street', 'Test City', '12345', '123456789') returning id
  `;
  await sql`
    insert into order_items (order_id, product_variant_id, product_name, sku, color_name, size, quantity, unit_price)
    values (${order.id}, ${variant.id}, 'First item', 'first', 'Black', 'M', 1, 10),
      (${order.id}, ${variant.id}, 'Second item', 'second', 'Black', 'M', 2, 10)
  `;
  await sql`
    insert into orders (user_id, customer_email, order_number, items_subtotal, shipping_cost,
      total_price, shipping_recipient, shipping_street, shipping_city, shipping_postal_code, shipping_phone)
    values (${customerUser.id}, 'customer@integration.test', 'TEST-ORDER-2', 0, 0, 0,
      'Test User', 'Test Street', 'Test City', '12345', '123456789')
  `;
  const account = await request("GET", "/account", customer);
  const accountHtml = await account.text();
  assert.equal(account.status, 200);
  assert.doesNotMatch(accountHtml, /Overený účet|Účet je aktívny/);
  assert.match(accountHtml, /TEST-ORDER-1/);
  assert.match(accountHtml, /TEST-ORDER-2/);
  const detail = await request("GET", "/account/orders/TEST-ORDER-1", customer);
  const detailHtml = await detail.text();
  assert.equal(detail.status, 200);
  assert.match(detailHtml, /First item/);
  assert.match(detailHtml, /Second item/);
  assert.match(detailHtml, /Test Courier/);
  assert.equal((await request("GET", "/account/orders/TEST-ORDER-1", otherCustomer)).status, 404);
  assert.equal((await request("GET", "/account/orders/TEST-ORDER-1")).url.includes("/login"), true);
  const [cart] = await sql`
    insert into carts (user_id) values (${customerUser.id})
    on conflict (user_id) do update set user_id = excluded.user_id returning id
  `;
  const [cartItem] = await sql`insert into cart_items (cart_id, product_variant_id, quantity) values (${cart.id}, ${variant.id}, 1) returning id`;
  if (process.env.CATEGORY_UI_TEST === "1") {
    const { testOrderSummaryUi } = await import("./test-checkout-ui.mjs");
    await testOrderSummaryUi(base, customer);
  }
  assert.equal((await request("DELETE", `/api/cart/items/${cartItem.id}`, otherCustomer)).status, 404);
  assert.equal((await request("PATCH", `/api/cart/items/${cartItem.id}e0`, customer, { quantity: 1 })).status, 400);
  const checkoutDetails = {
    email: "customer@integration.test",
    firstName: "Test",
    lastName: "User",
    street: "Test Street",
    city: "Test City",
    postalCode: "12345",
    phone: "123456789",
    country: "SK",
    shippingMethod: "courier",
    paymentMethod: "cod",
    termsAccepted: true,
  };
  const missingTerms = await request("POST", "/api/orders", customer, { ...checkoutDetails, termsAccepted: false });
  assert.equal(missingTerms.status, 400);
  assert.match((await missingTerms.json()).error, /súhlas/);
  const invalidPostalCode = await request("POST", "/api/orders", customer, { ...checkoutDetails, postalCode: "invalid" });
  assert.equal(invalidPostalCode.status, 400);
  assert.match((await invalidPostalCode.json()).error, /PSČ/);
  const invalidPayment = await request("POST", "/api/orders", customer, { ...checkoutDetails, paymentMethod: "card" });
  assert.equal(invalidPayment.status, 400);
  assert.match((await invalidPayment.json()).error, /platby/);
  await sql`update products set is_active = false where id = ${product.id}`;
  assert.equal((await request("POST", "/api/orders", customer, checkoutDetails)).status, 409);
  await sql`update products set is_active = true where id = ${product.id}`;
  const checkout = await request("POST", "/api/orders", customer, checkoutDetails);
  assert.equal(checkout.status, 201, await checkout.clone().text());
  const createdNumber = (await checkout.json()).data.orderNumber;
  const [createdOrder] = await sql`
    select shipping_method, payment_method, shipping_cost from orders where order_number = ${createdNumber}
  `;
  assert.equal(createdOrder.shipping_method, "Kuriér na adresu");
  assert.equal(createdOrder.payment_method, "cod");
  assert.equal(createdOrder.shipping_cost, "5.90");
  assert.match(await (await request("GET", `/account/orders/${createdNumber}`, customer)).text(), /Kuriér na adresu/);
  console.log("Category API integration tests passed.");
} catch (error) {
  console.error(error);
  if (serverOutput) console.error(serverOutput);
  process.exitCode = 1;
} finally {
  if (server && server.exitCode === null) {
    const stopped = new Promise((resolve) => server.once("exit", resolve));
    server.kill("SIGTERM");
    await stopped;
  }
  if (sql) await sql.end({ timeout: 5 });
  if (containerId) command("docker", ["rm", "--force", containerId]);
  if (imageDirectory) await rm(imageDirectory, { recursive: true, force: true });
}
