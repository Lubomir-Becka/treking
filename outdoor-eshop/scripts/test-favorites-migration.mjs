import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import postgres from "postgres";

export async function testFavoritesMigration(port) {
  const sql = postgres(`postgres://postgres:test-password@127.0.0.1:${port}/favorites_migration`, { max: 1 });
  try {
    const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8"));
    for (const migration of journal.entries.filter((entry) => entry.idx < 7)) {
      const contents = await readFile(`drizzle/${migration.tag}.sql`, "utf8");
      for (const statement of contents.split("--> statement-breakpoint")) {
        if (statement.trim()) await sql.unsafe(statement);
      }
    }
    const [user] = await sql`
      insert into users (first_name, last_name, email, password_hash)
      values ('Test', 'User', 'legacy@integration.test', 'unused') returning id
    `;
    const [product] = await sql`
      insert into products (name, slug, brand) values ('Legacy', 'legacy', 'Test') returning id
    `;
    const [color] = await sql`
      insert into product_colors (product_id, color_name)
      values (${product.id}, 'Black') returning id
    `;
    const [otherColor] = await sql`
      insert into product_colors (product_id, color_name)
      values (${product.id}, 'Blue') returning id
    `;
    await sql`insert into favorites (user_id, product_id) values (${user.id}, ${product.id})`;

    const migration = await readFile("drizzle/0007_favorite_colors.sql", "utf8");
    const apply = () => sql.begin(async (tx) => {
      for (const statement of migration.split("--> statement-breakpoint")) {
        if (statement.trim()) await tx.unsafe(statement);
      }
    });
    await assert.rejects(apply(), /exactly one product color/);
    assert.equal((await sql`select count(*)::int as count from favorites where product_id = ${product.id}`)[0].count, 1);
    await sql`delete from product_colors where id in (${color.id}, ${otherColor.id})`;
    await assert.rejects(apply(), /exactly one product color/);
    assert.equal((await sql`select count(*)::int as count from favorites where product_id = ${product.id}`)[0].count, 1);
    const [remainingColor] = await sql`
      insert into product_colors (product_id, color_name)
      values (${product.id}, 'Black') returning id
    `;
    await apply();
    const rows = await sql`select user_id, product_color_id from favorites`;
    assert.deepEqual(rows.map((row) => [row.user_id, row.product_color_id]), [[user.id, remainingColor.id]]);
    console.log("Favorite migration preservation tests passed.");

    const [order] = await sql`
      insert into orders (user_id, customer_email, order_number, items_subtotal, shipping_cost,
        total_price, shipping_recipient, shipping_street, shipping_city, shipping_postal_code, shipping_phone)
      values (${user.id}, 'legacy@integration.test', 'LEGACY-1', 10, 2, 12,
        'Test User', 'Street', 'City', '12345', '123456789') returning id
    `;
    const [method] = await sql`
      insert into shipping_methods (code, name, price) values ('courier', 'Legacy courier', 2) returning id
    `;
    await sql`insert into shipping (order_id, shipping_method_id, shipping_cost) values (${order.id}, ${method.id}, 2)`;
    await sql`insert into payments (order_id, payment_method, amount) values (${order.id}, 'cod', 12)`;
    await sql.unsafe(`
      create function update_updated_at_column() returns trigger language plpgsql as $$
      begin new.updated_at = current_timestamp; return new; end $$;
      create trigger set_timestamp_orders before update on orders
      for each row execute function update_updated_at_column();
    `);
    const [originalOrder] = await sql`select updated_at from orders where id = ${order.id}`;
    const simplify = await readFile("drizzle/0008_simplify_orders.sql", "utf8");
    const applySimplification = () => sql.begin(async (tx) => {
      for (const statement of simplify.split("--> statement-breakpoint")) {
        if (statement.trim()) await tx.unsafe(statement);
      }
    });
    await sql`
      insert into addresses (user_id, recipient_name, street, city, postal_code)
      values (${user.id}, 'Test User', 'Street', 'City', '12345')
    `;
    await assert.rejects(applySimplification(), /saved addresses/);
    await sql`delete from addresses where user_id = ${user.id}`;
    await sql`update shipping set tracking_number = 'tracked' where order_id = ${order.id}`;
    await assert.rejects(applySimplification(), /additional information/);
    await sql`update shipping set tracking_number = null where order_id = ${order.id}`;
    await sql`insert into payments (order_id, payment_method, amount) values (${order.id}, 'cod', 12)`;
    await assert.rejects(applySimplification(), /multiple shipments or payments/);
    await sql`delete from payments where id = (select max(id) from payments where order_id = ${order.id})`;
    await applySimplification();
    const [migrated] = await sql`select order_number, shipping_method, payment_method, updated_at from orders where id = ${order.id}`;
    assert.deepEqual({ ...migrated }, {
      order_number: "LEGACY-1", shipping_method: "Legacy courier", payment_method: "cod",
      updated_at: originalOrder.updated_at,
    });
    const [trigger] = await sql`
      select tgenabled from pg_trigger where tgrelid = 'orders'::regclass and tgname = 'set_timestamp_orders'
    `;
    assert.equal(trigger.tgenabled, "O");
    const [tables] = await sql`
      select to_regclass('public.addresses') as addresses, to_regclass('public.payments') as payments,
        to_regclass('public.shipping') as shipping
    `;
    assert.deepEqual({ ...tables }, { addresses: null, payments: null, shipping: null });
    console.log("Order simplification migration tests passed.");
  } finally {
    await sql.end();
  }
}
