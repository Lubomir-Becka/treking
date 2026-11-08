LOCK TABLE "favorites", "product_colors" IN ACCESS EXCLUSIVE MODE;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "favorites" f
    WHERE (SELECT count(*) FROM "product_colors" c WHERE c."product_id" = f."product_id") <> 1
  ) THEN
    RAISE EXCEPTION 'Cannot convert favorites: each existing favorite must have exactly one product color';
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "favorites" ADD COLUMN "product_color_id" integer;
--> statement-breakpoint
UPDATE "favorites" f SET "product_color_id" = c."id"
FROM "product_colors" c WHERE c."product_id" = f."product_id";
--> statement-breakpoint
ALTER TABLE "favorites" ALTER COLUMN "product_color_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_product_id_fkey";
--> statement-breakpoint
ALTER TABLE "favorites" DROP CONSTRAINT "unique_user_product_favorite";
--> statement-breakpoint
ALTER TABLE "favorites" DROP COLUMN "product_id";
--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_product_color_id_fkey"
  FOREIGN KEY ("product_color_id") REFERENCES "product_colors"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "unique_user_color_favorite" UNIQUE ("user_id", "product_color_id");