ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_email" varchar(100);
--> statement-breakpoint
UPDATE "orders" AS orders
SET "customer_email" = COALESCE(users.email, 'unknown@example.invalid')
FROM "users" AS users
WHERE orders.user_id = users.id;
--> statement-breakpoint
UPDATE "orders"
SET "customer_email" = 'unknown@example.invalid'
WHERE "customer_email" IS NULL;
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "customer_email" SET NOT NULL;