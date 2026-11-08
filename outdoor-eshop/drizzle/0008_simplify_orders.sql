LOCK TABLE "orders", "addresses", "payments", "shipping", "shipping_methods" IN ACCESS EXCLUSIVE MODE;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "addresses") THEN
    RAISE EXCEPTION 'Cannot remove addresses: saved addresses require an explicit migration';
  END IF;
  IF EXISTS (SELECT 1 FROM "shipping" GROUP BY "order_id" HAVING count(*) > 1)
    OR EXISTS (SELECT 1 FROM "payments" GROUP BY "order_id" HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Cannot simplify orders: multiple shipments or payments exist for an order';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "shipping" s JOIN "orders" o ON o."id" = s."order_id"
    WHERE s."tracking_number" IS NOT NULL OR s."shipped_at" IS NOT NULL
      OR s."status" IS DISTINCT FROM 'preparing' OR s."shipping_cost" <> o."shipping_cost"
  ) OR EXISTS (
    SELECT 1 FROM "payments" p JOIN "orders" o ON o."id" = p."order_id"
    WHERE p."transaction_id" IS NOT NULL OR p."status" IS DISTINCT FROM 'pending'
      OR p."amount" <> o."total_price"
  ) THEN
    RAISE EXCEPTION 'Cannot simplify orders: shipment or payment contains additional information';
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_method" varchar(100);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" varchar(50);
--> statement-breakpoint
DO $$
DECLARE
  timestamp_trigger_state "char";
BEGIN
  SELECT t.tgenabled INTO timestamp_trigger_state
  FROM pg_trigger t
  WHERE t.tgrelid = 'orders'::regclass AND t.tgname = 'set_timestamp_orders'
    AND NOT t.tgisinternal;

  IF timestamp_trigger_state IN ('O', 'A') THEN
    ALTER TABLE "orders" DISABLE TRIGGER "set_timestamp_orders";
  END IF;

  UPDATE "orders" o SET "shipping_method" = m."name"
  FROM "shipping" s JOIN "shipping_methods" m ON m."id" = s."shipping_method_id"
  WHERE s."order_id" = o."id";

  UPDATE "orders" o SET "payment_method" = p."payment_method"
  FROM "payments" p WHERE p."order_id" = o."id";

  IF timestamp_trigger_state = 'O' THEN
    ALTER TABLE "orders" ENABLE TRIGGER "set_timestamp_orders";
  ELSIF timestamp_trigger_state = 'A' THEN
    ALTER TABLE "orders" ENABLE ALWAYS TRIGGER "set_timestamp_orders";
  END IF;
END $$;
--> statement-breakpoint
DROP TABLE "addresses";
--> statement-breakpoint
DROP TABLE "payments";
--> statement-breakpoint
DROP TABLE "shipping";