CREATE TABLE "addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"recipient_name" varchar(100) NOT NULL,
	"street" varchar(150) NOT NULL,
	"city" varchar(100) NOT NULL,
	"postal_code" varchar(20) NOT NULL,
	"country" varchar(50) DEFAULT 'SK',
	"address_label" varchar(50),
	"is_default" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "attributes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"unit" varchar(20),
	CONSTRAINT "attributes_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"cart_id" integer NOT NULL,
	"product_variant_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "unique_variant_in_cart" UNIQUE("cart_id","product_variant_id"),
	CONSTRAINT "cart_items_quantity_check" CHECK (quantity > 0)
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"session_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "carts_user_id_key" UNIQUE("user_id"),
	CONSTRAINT "carts_session_id_key" UNIQUE("session_id"),
	CONSTRAINT "cart_owner_check" CHECK ((user_id IS NOT NULL) OR (session_id IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"parent_id" integer,
	CONSTRAINT "categories_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "unique_user_product_favorite" UNIQUE("user_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_variant_id" integer NOT NULL,
	"product_name" varchar(150) NOT NULL,
	"sku" varchar(100) NOT NULL,
	"color_name" varchar(30),
	"size" varchar(20),
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	CONSTRAINT "order_items_quantity_check" CHECK (quantity > 0),
	CONSTRAINT "order_items_unit_price_check" CHECK (unit_price >= (0)::numeric)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"items_subtotal" numeric(10, 2) NOT NULL,
	"shipping_cost" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"status" varchar(30) DEFAULT 'pending',
	"shipping_recipient" varchar(100) NOT NULL,
	"shipping_street" varchar(150) NOT NULL,
	"shipping_city" varchar(100) NOT NULL,
	"shipping_postal_code" varchar(20) NOT NULL,
	"shipping_country" varchar(50) DEFAULT 'SK' NOT NULL,
	"shipping_phone" varchar(20) NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "orders_order_number_key" UNIQUE("order_number"),
	CONSTRAINT "orders_items_subtotal_check" CHECK (items_subtotal >= (0)::numeric),
	CONSTRAINT "orders_shipping_cost_check" CHECK (shipping_cost >= (0)::numeric),
	CONSTRAINT "orders_total_price_check" CHECK (total_price >= (0)::numeric),
	CONSTRAINT "orders_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'shipped'::character varying, 'delivered'::character varying, 'cancelled'::character varying])::text[])),
	CONSTRAINT "valid_order_total_check" CHECK (total_price = (items_subtotal + shipping_cost))
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar(30) DEFAULT 'pending',
	"transaction_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "payments_payment_method_check" CHECK ((payment_method)::text = ANY ((ARRAY['card'::character varying, 'bank_transfer'::character varying, 'cod'::character varying])::text[])),
	CONSTRAINT "payments_amount_check" CHECK (amount >= (0)::numeric),
	CONSTRAINT "payments_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "product_attributes" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"attribute_id" integer NOT NULL,
	"value" varchar(255) NOT NULL,
	CONSTRAINT "unique_attribute_per_product" UNIQUE("product_id","attribute_id")
);
--> statement-breakpoint
CREATE TABLE "product_colors" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"color_name" varchar(30),
	"hex_code" varchar(7),
	CONSTRAINT "unique_color_per_product" UNIQUE("product_id","color_name")
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_color_id" integer NOT NULL,
	"image_url" varchar(255) NOT NULL,
	"alt_text" varchar(150),
	"is_primary" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_color_id" integer NOT NULL,
	"sku" varchar(100) NOT NULL,
	"size" varchar(20),
	"price" numeric(10, 2) NOT NULL,
	"stock" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "unique_size_per_color" UNIQUE("product_color_id","size"),
	CONSTRAINT "product_variants_sku_key" UNIQUE("sku"),
	CONSTRAINT "product_variants_price_check" CHECK (price >= (0)::numeric),
	CONSTRAINT "product_variants_stock_check" CHECK (stock >= 0)
);
--> statement-breakpoint
CREATE TABLE "shipping" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"shipping_method_id" integer NOT NULL,
	"shipping_cost" numeric(10, 2) NOT NULL,
	"tracking_number" varchar(100),
	"status" varchar(30) DEFAULT 'preparing',
	"shipped_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "shipping_shipping_cost_check" CHECK (shipping_cost >= (0)::numeric),
	CONSTRAINT "shipping_status_check" CHECK ((status)::text = ANY ((ARRAY['preparing'::character varying, 'shipped'::character varying, 'in_transit'::character varying, 'delivered'::character varying, 'returned'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "shipping_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"free_from_amount" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	CONSTRAINT "shipping_methods_code_key" UNIQUE("code"),
	CONSTRAINT "shipping_methods_price_check" CHECK (price >= (0)::numeric),
	CONSTRAINT "shipping_methods_free_from_amount_check" CHECK (free_from_amount >= (0)::numeric)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"email" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"phone" varchar(20),
	"role" varchar(20) DEFAULT 'customer',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "users_email_key" UNIQUE("email"),
	CONSTRAINT "users_role_check" CHECK ((role)::text = ANY ((ARRAY['customer'::character varying, 'admin'::character varying])::text[])),
	CONSTRAINT "email_lowercase_check" CHECK ((email)::text = lower((email)::text))
);
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_pkey";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "id_new" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "products" RENAME COLUMN "id_new" TO "id";--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "is_active" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "slug" varchar(180);--> statement-breakpoint
UPDATE "products" SET "slug" = 'legacy-product-' || "id";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_colors" ADD CONSTRAINT "product_colors_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_color_id_fkey" FOREIGN KEY ("product_color_id") REFERENCES "public"."product_colors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_color_id_fkey" FOREIGN KEY ("product_color_id") REFERENCES "public"."product_colors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping" ADD CONSTRAINT "shipping_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping" ADD CONSTRAINT "shipping_shipping_method_id_fkey" FOREIGN KEY ("shipping_method_id") REFERENCES "public"."shipping_methods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_addresses_user_id" ON "addresses" USING btree ("user_id" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "unique_default_address_per_user" ON "addresses" USING btree ("user_id" int4_ops) WHERE (is_default = true);--> statement-breakpoint
CREATE INDEX "idx_cart_items_cart_id" ON "cart_items" USING btree ("cart_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_carts_session_id" ON "carts" USING btree ("session_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_carts_user_id" ON "carts" USING btree ("user_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_categories_parent_id" ON "categories" USING btree ("parent_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_categories_slug" ON "categories" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "idx_favorites_user_id" ON "favorites" USING btree ("user_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_order_items_order_id" ON "order_items" USING btree ("order_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_orders_user_id" ON "orders" USING btree ("user_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_payments_order_id" ON "payments" USING btree ("order_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_product_attributes_lookup" ON "product_attributes" USING btree ("attribute_id" int4_ops,"value" text_ops);--> statement-breakpoint
CREATE INDEX "idx_product_attributes_product_id" ON "product_attributes" USING btree ("product_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_product_colors_product_id" ON "product_colors" USING btree ("product_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_product_images_color_id" ON "product_images" USING btree ("product_color_id" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "unique_primary_image_per_color" ON "product_images" USING btree ("product_color_id" int4_ops) WHERE (is_primary = true);--> statement-breakpoint
CREATE INDEX "idx_variants_color_id" ON "product_variants" USING btree ("product_color_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_variants_price" ON "product_variants" USING btree ("price" numeric_ops);--> statement-breakpoint
CREATE INDEX "idx_shipping_order_id" ON "shipping" USING btree ("order_id" int4_ops);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_products_brand" ON "products" USING btree ("brand" text_ops);--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "products" USING btree ("category_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_products_is_active" ON "products" USING btree ("is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_products_slug" ON "products" USING btree ("slug" text_ops);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_slug_key" UNIQUE("slug");