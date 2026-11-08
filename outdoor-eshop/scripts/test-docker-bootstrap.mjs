import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import postgres from "postgres";

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

const project = `eshop-bootstrap-test-${randomBytes(6).toString("hex")}`;
const appPort = await unusedPort();
const databasePort = await unusedPort();
const adminerPort = await unusedPort();
const password = randomBytes(18).toString("hex");
const env = {
  ...process.env,
  DB_USER: "bootstrap_test",
  DB_PASSWORD: password,
  DEMO_ADMIN_EMAIL: "admin@example.test",
  DEMO_ADMIN_PASSWORD: `Demo-${randomBytes(12).toString("hex")}`,
  BOOTSTRAP_MODE: "demo",
  APP_PORT: String(appPort),
  POSTGRES_PORT: String(databasePort),
  ADMINER_PORT: String(adminerPort),
};
const composeArgs = ["compose", "--env-file", "/dev/null", "-p", project, "-f", "../docker/docker-compose.yaml"];

function compose(args, expectSuccess = true) {
  const result = spawnSync("docker", [...composeArgs, ...args], { env, encoding: "utf8" });
  if (result.error) throw result.error;
  if (expectSuccess && result.status !== 0) {
    throw new Error(`Docker Compose failed: ${result.stderr}\n${result.stdout}`);
  }
  return result;
}

let sql;
try {
  compose(["up", "-d", "--build", "app"]);
  const base = `http://127.0.0.1:${appPort}`;
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if ((await fetch(`${base}/api/auth/session`)).ok) {
        ready = true;
        break;
      }
    } catch {
      await delay(500);
    }
  }
  assert.ok(ready, "Application did not start.");
  sql = postgres(`postgres://bootstrap_test:${password}@127.0.0.1:${databasePort}/outdoor_eshop`, { max: 1 });
  const [product] = await sql`select id from products order by id limit 1`;
  assert.ok(product, "Seed products are missing.");
  const login = await fetch(`${base}/api/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: base },
    body: JSON.stringify({ email: env.DEMO_ADMIN_EMAIL, password: env.DEMO_ADMIN_PASSWORD }),
  });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).data.role, "admin");
  await sql`update products set name = 'Restart preservation test' where id = ${product.id}`;
  compose(["run", "--rm", "--no-deps", "init"]);
  const [preserved] = await sql`select name from products where id = ${product.id}`;
  assert.equal(preserved.name, "Restart preservation test");
  const [adminCount] = await sql`select count(*)::int as count from users where role = 'admin'`;
  assert.equal(adminCount.count, 1);
  compose(["up", "-d", "--force-recreate", "app"]);
  const [afterRestart] = await sql`select name from products where id = ${product.id}`;
  assert.equal(afterRestart.name, "Restart preservation test");
  await sql`create database missing_credentials`;
  const missingCredentials = compose([
    "run", "--rm", "--no-deps", "-e", "DEMO_ADMIN_PASSWORD=", "-e",
    `DATABASE_URL=postgres://bootstrap_test:${password}@postgres:5432/missing_credentials`,
    "init",
  ], false);
  assert.notEqual(missingCredentials.status, 0);
  assert.match(missingCredentials.stderr, /Set a valid DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD/);
  const empty = postgres(`postgres://bootstrap_test:${password}@127.0.0.1:${databasePort}/missing_credentials`, { max: 1 });
  try {
    const [marker] = await empty`select to_regclass('public.demo_bootstrap') as marker`;
    assert.equal(marker.marker, null);
  } finally {
    await empty.end();
  }
  await sql`create database preexisting`;
  const existing = postgres(`postgres://bootstrap_test:${password}@127.0.0.1:${databasePort}/preexisting`, { max: 1 });
  try {
    await existing`create table existing_data (value text)`;
    await existing`insert into existing_data values ('preserved')`;
    const result = compose([
      "run", "--rm", "--no-deps", "-e",
      `DATABASE_URL=postgres://bootstrap_test:${password}@postgres:5432/preexisting`,
      "init",
    ], false);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Database is not empty/);
    compose([
      "run", "--rm", "--no-deps", "-e", "BOOTSTRAP_MODE=existing", "-e",
      `DATABASE_URL=postgres://bootstrap_test:${password}@postgres:5432/preexisting`,
      "init",
    ]);
    const [row] = await existing`select value from existing_data`;
    assert.equal(row.value, "preserved");
  } finally {
    await existing.end();
  }
  console.log("Docker first startup, demo admin, restart and existing database checks passed.");
} finally {
  if (sql) await sql.end();
  compose(["down", "--volumes", "--remove-orphans"]);
  const image = `${project}-app`;
  const inspect = spawnSync("docker", ["image", "inspect", image], { encoding: "utf8" });
  if (inspect.error) throw inspect.error;
  if (inspect.status === 0) {
    const removal = spawnSync("docker", ["image", "rm", image], { encoding: "utf8" });
    if (removal.error || removal.status !== 0) {
      throw new Error(`Could not remove test image ${image}: ${removal.stderr}`);
    }
  }
}
