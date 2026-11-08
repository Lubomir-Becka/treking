import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:net";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import postgres from "postgres";

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
  server = spawn("./node_modules/.bin/next", ["start", "-H", "127.0.0.1", "-p", String(appPort)], {
    env: { ...process.env, DATABASE_URL: databaseUrl, NEXT_TELEMETRY_DISABLED: "1" },
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
  const [variant] = await sql`
    insert into product_variants (product_color_id, sku, size, price, stock)
    values (${color.id}, 'test-order-sku', 'M', 10, 10) returning id
  `;
  const [order] = await sql`
    insert into orders (user_id, customer_email, order_number, items_subtotal, shipping_cost,
      total_price, shipping_recipient, shipping_street, shipping_city, shipping_postal_code, shipping_phone)
    values (${customerUser.id}, 'customer@integration.test', 'TEST-ORDER-1', 30, 2, 32,
      'Test User', 'Test Street', 'Test City', '12345', '123456789') returning id
  `;
  const [delivery] = await sql`
    insert into shipping_methods (code, name, price)
    values ('courier', 'Test Courier', 2) returning id
  `;
  await sql`
    insert into shipping (order_id, shipping_method_id, shipping_cost)
    values (${order.id}, ${delivery.id}, 2)
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
}
