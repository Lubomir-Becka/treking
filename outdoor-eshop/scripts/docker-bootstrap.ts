import { spawnSync } from "node:child_process";
import bcrypt from "bcryptjs";
import postgres from "postgres";
import { isValidCustomerEmail } from "../src/shared/domain/email";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const sql = postgres(databaseUrl, { max: 1 });

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed with status ${result.status}.`);
}

async function bootstrap() {
  const mode = process.env.BOOTSTRAP_MODE ?? "demo";
  if (mode !== "demo" && mode !== "existing") {
    throw new Error("BOOTSTRAP_MODE must be demo or existing.");
  }
  await sql`select pg_advisory_lock(782041639)`;
  try {
    const [marker] = await sql`
      select to_regclass('public.demo_bootstrap') is not null as exists
    `;
    if (!marker.exists) {
      const [existing] = await sql`
        select exists (
          select 1 from pg_catalog.pg_class c
          join pg_catalog.pg_namespace n on n.oid = c.relnamespace
          where n.nspname in ('public', 'drizzle') and c.relkind in ('r', 'p')
        ) as exists
      `;
      if (existing.exists) {
        if (mode === "existing") {
          console.log("Using existing database without automatic migration or seed.");
          return;
        }
        throw new Error("Database is not empty and has no bootstrap marker; migrate it manually.");
      }
      if (mode === "existing") throw new Error("Existing database mode requires a nonempty database.");
    } else {
      const [state] = await sql`select complete from demo_bootstrap where id = 1`;
      if (!state) throw new Error("Invalid bootstrap marker; inspect the database manually.");
      if (state.complete) {
        console.log("Database was already initialized.");
        return;
      }
      if (mode === "existing") throw new Error("Demo initialization is incomplete; retry in demo mode.");
    }

    const email = process.env.DEMO_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.DEMO_ADMIN_PASSWORD;
    if (!email || !isValidCustomerEmail(email) || !password ||
      password.length < 8 || new TextEncoder().encode(password).length > 72) {
      throw new Error("Set a valid DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD (8 characters to 72 bytes).");
    }

    if (!marker.exists) {
      await sql.begin(async (tx) => {
        await tx`create table demo_bootstrap (id integer primary key check (id = 1), complete boolean not null)`;
        await tx`insert into demo_bootstrap (id, complete) values (1, false)`;
      });
    }
    run("npm", ["run", "db:migrate"]);
    run("npm", ["run", "db:seed"]);
    const passwordHash = await bcrypt.hash(password, 12);
    await sql.begin(async (tx) => {
      await tx`
        insert into users (first_name, last_name, email, password_hash, role, is_active)
        values ('Demo', 'Admin', ${email}, ${passwordHash}, 'admin', true)
      `;
      await tx`update demo_bootstrap set complete = true where id = 1`;
    });
    console.log("Demo database initialized.");
  } finally {
    await sql`select pg_advisory_unlock(782041639)`;
  }
}

bootstrap()
  .catch((error: unknown) => {
    console.error("Database bootstrap failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
