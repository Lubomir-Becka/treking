import { pgTable, unique, check, serial, varchar, boolean, timestamp, index, uniqueIndex, foreignKey, integer, text, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const loginRateLimits = pgTable("login_rate_limits", {
	key: text("key").primaryKey(),
	count: integer("count").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => [
	index("login_rate_limits_expires_at_idx").on(table.expiresAt),
]);
export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	firstName: varchar("first_name", { length: 50 }).notNull(),
	lastName: varchar("last_name", { length: 50 }).notNull(),
	email: varchar({ length: 100 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	phone: varchar({ length: 20 }),
	role: varchar({ length: 20 }).default('customer'),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("users_email_key").on(table.email),
	check("users_role_check", sql`(role)::text = ANY ((ARRAY['customer'::character varying, 'admin'::character varying])::text[])`),
	check("email_lowercase_check", sql`(email)::text = lower((email)::text)`),
]);

export const userSessions = pgTable("user_sessions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	tokenHash: varchar("token_hash", { length: 64 }).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("user_sessions_token_hash_key").on(table.tokenHash),
	index("idx_user_sessions_token_hash").using("btree", table.tokenHash.asc().nullsLast().op("text_ops")),
	index("idx_user_sessions_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [users.id],
		name: "user_sessions_user_id_fkey",
	}).onDelete("cascade"),
]);

export const guestSessions = pgTable("guest_sessions", {
	id: serial().primaryKey().notNull(),
	tokenHash: varchar("token_hash", { length: 64 }).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("guest_sessions_token_hash_key").on(table.tokenHash),
	index("idx_guest_sessions_token_hash").using("btree", table.tokenHash.asc().nullsLast().op("text_ops")),
]);

export const addresses = pgTable("addresses", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	recipientName: varchar("recipient_name", { length: 100 }).notNull(),
	street: varchar({ length: 150 }).notNull(),
	city: varchar({ length: 100 }).notNull(),
	postalCode: varchar("postal_code", { length: 20 }).notNull(),
	country: varchar({ length: 50 }).default('SK'),
	addressLabel: varchar("address_label", { length: 50 }),
	isDefault: boolean("is_default").default(false),
}, (table) => [
	index("idx_addresses_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("unique_default_address_per_user").using("btree", table.userId.asc().nullsLast().op("int4_ops")).where(sql`(is_default = true)`),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "addresses_user_id_fkey"
		}).onDelete("cascade"),
]);

export const categories = pgTable("categories", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 120 }).notNull(),
	parentId: integer("parent_id"),
}, (table) => [
	index("idx_categories_parent_id").using("btree", table.parentId.asc().nullsLast().op("int4_ops")),
	index("idx_categories_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "categories_parent_id_fkey"
		}).onDelete("set null"),
	unique("categories_slug_key").on(table.slug),
]);

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 180 }).notNull(),
	description: text(),
	brand: varchar({ length: 100 }).notNull(),
	categoryId: integer("category_id"),
	audience: varchar({ length: 10 }).default('unisex').notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_products_brand").using("btree", table.brand.asc().nullsLast().op("text_ops")),
	index("idx_products_category").using("btree", table.categoryId.asc().nullsLast().op("int4_ops")),
	index("idx_products_audience").using("btree", table.audience.asc().nullsLast().op("text_ops")),
	index("idx_products_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_products_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "products_category_id_fkey"
		}).onDelete("set null"),
	unique("products_slug_key").on(table.slug),
	check("products_audience_check", sql`(audience)::text = ANY ((ARRAY['men'::character varying, 'women'::character varying, 'unisex'::character varying])::text[])`),
]);

export const productAttributes = pgTable("product_attributes", {
	id: serial().primaryKey().notNull(),
	productId: integer("product_id").notNull(),
	attributeId: integer("attribute_id").notNull(),
	value: varchar({ length: 255 }).notNull(),
}, (table) => [
	index("idx_product_attributes_lookup").using("btree", table.attributeId.asc().nullsLast().op("int4_ops"), table.value.asc().nullsLast().op("text_ops")),
	index("idx_product_attributes_product_id").using("btree", table.productId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_attributes_product_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.attributeId],
			foreignColumns: [attributes.id],
			name: "product_attributes_attribute_id_fkey"
		}).onDelete("cascade"),
	unique("unique_attribute_per_product").on(table.productId, table.attributeId),
]);

export const attributes = pgTable("attributes", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	unit: varchar({ length: 20 }),
}, (table) => [
	unique("attributes_name_key").on(table.name),
]);

export const productColors = pgTable("product_colors", {
	id: serial().primaryKey().notNull(),
	productId: integer("product_id").notNull(),
	colorName: varchar("color_name", { length: 30 }),
	hexCode: varchar("hex_code", { length: 7 }),
}, (table) => [
	index("idx_product_colors_product_id").using("btree", table.productId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_colors_product_id_fkey"
		}).onDelete("cascade"),
	unique("unique_color_per_product").on(table.productId, table.colorName),
]);

export const productImages = pgTable("product_images", {
	id: serial().primaryKey().notNull(),
	productColorId: integer("product_color_id").notNull(),
	imageUrl: varchar("image_url", { length: 255 }).notNull(),
	altText: varchar("alt_text", { length: 150 }),
	isPrimary: boolean("is_primary").default(false),
	displayOrder: integer("display_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_product_images_color_id").using("btree", table.productColorId.asc().nullsLast().op("int4_ops")),
	uniqueIndex("unique_primary_image_per_color").using("btree", table.productColorId.asc().nullsLast().op("int4_ops")).where(sql`(is_primary = true)`),
	foreignKey({
			columns: [table.productColorId],
			foreignColumns: [productColors.id],
			name: "product_images_product_color_id_fkey"
		}).onDelete("cascade"),
]);

export const productVariants = pgTable("product_variants", {
	id: serial().primaryKey().notNull(),
	productColorId: integer("product_color_id").notNull(),
	sku: varchar({ length: 100 }).notNull(),
	size: varchar({ length: 20 }),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	stock: integer().default(0),
	isActive: boolean("is_active").default(true),
}, (table) => [
	index("idx_variants_color_id").using("btree", table.productColorId.asc().nullsLast().op("int4_ops")),
	index("idx_variants_price").using("btree", table.price.asc().nullsLast().op("numeric_ops")),
	foreignKey({
			columns: [table.productColorId],
			foreignColumns: [productColors.id],
			name: "product_variants_product_color_id_fkey"
		}).onDelete("cascade"),
	unique("unique_size_per_color").on(table.productColorId, table.size),
	unique("product_variants_sku_key").on(table.sku),
	check("product_variants_price_check", sql`price >= (0)::numeric`),
	check("product_variants_stock_check", sql`stock >= 0`),
]);

export const favorites = pgTable("favorites", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	productId: integer("product_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_favorites_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "favorites_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "favorites_product_id_fkey"
		}).onDelete("cascade"),
	unique("unique_user_product_favorite").on(table.userId, table.productId),
]);

export const carts = pgTable("carts", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	sessionId: varchar("session_id", { length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_carts_session_id").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	index("idx_carts_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "carts_user_id_fkey"
		}).onDelete("cascade"),
	unique("carts_user_id_key").on(table.userId),
	unique("carts_session_id_key").on(table.sessionId),
	check("cart_owner_check", sql`(user_id IS NOT NULL) OR (session_id IS NOT NULL)`),
]);

export const cartItems = pgTable("cart_items", {
	id: serial().primaryKey().notNull(),
	cartId: integer("cart_id").notNull(),
	productVariantId: integer("product_variant_id").notNull(),
	quantity: integer().default(1).notNull(),
}, (table) => [
	index("idx_cart_items_cart_id").using("btree", table.cartId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.cartId],
			foreignColumns: [carts.id],
			name: "cart_items_cart_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productVariantId],
			foreignColumns: [productVariants.id],
			name: "cart_items_product_variant_id_fkey"
		}).onDelete("cascade"),
	unique("unique_variant_in_cart").on(table.cartId, table.productVariantId),
	check("cart_items_quantity_check", sql`quantity > 0`),
]);

export const orderItems = pgTable("order_items", {
	id: serial().primaryKey().notNull(),
	orderId: integer("order_id").notNull(),
	productVariantId: integer("product_variant_id").notNull(),
	productName: varchar("product_name", { length: 150 }).notNull(),
	sku: varchar({ length: 100 }).notNull(),
	colorName: varchar("color_name", { length: 30 }),
	size: varchar({ length: 20 }),
	quantity: integer().notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
}, (table) => [
	index("idx_order_items_order_id").using("btree", table.orderId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productVariantId],
			foreignColumns: [productVariants.id],
			name: "order_items_product_variant_id_fkey"
		}).onDelete("restrict"),
	check("order_items_quantity_check", sql`quantity > 0`),
	check("order_items_unit_price_check", sql`unit_price >= (0)::numeric`),
]);

export const orders = pgTable("orders", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	customerEmail: varchar("customer_email", { length: 100 }).notNull(),
	orderNumber: varchar("order_number", { length: 50 }).notNull(),
	itemsSubtotal: numeric("items_subtotal", { precision: 10, scale:  2 }).notNull(),
	shippingCost: numeric("shipping_cost", { precision: 10, scale:  2 }).notNull(),
	totalPrice: numeric("total_price", { precision: 10, scale:  2 }).notNull(),
	status: varchar({ length: 30 }).default('pending'),
	shippingRecipient: varchar("shipping_recipient", { length: 100 }).notNull(),
	shippingStreet: varchar("shipping_street", { length: 150 }).notNull(),
	shippingCity: varchar("shipping_city", { length: 100 }).notNull(),
	shippingPostalCode: varchar("shipping_postal_code", { length: 20 }).notNull(),
	shippingCountry: varchar("shipping_country", { length: 50 }).default('SK').notNull(),
	shippingPhone: varchar("shipping_phone", { length: 20 }).notNull(),
	note: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_orders_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_orders_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_fkey"
		}).onDelete("restrict"),
	unique("orders_order_number_key").on(table.orderNumber),
	check("orders_items_subtotal_check", sql`items_subtotal >= (0)::numeric`),
	check("orders_shipping_cost_check", sql`shipping_cost >= (0)::numeric`),
	check("orders_total_price_check", sql`total_price >= (0)::numeric`),
	check("orders_status_check", sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'shipped'::character varying, 'delivered'::character varying, 'cancelled'::character varying])::text[])`),
	check("valid_order_total_check", sql`total_price = (items_subtotal + shipping_cost)`),
]);

export const payments = pgTable("payments", {
	id: serial().primaryKey().notNull(),
	orderId: integer("order_id").notNull(),
	paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	status: varchar({ length: 30 }).default('pending'),
	transactionId: varchar("transaction_id", { length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_payments_order_id").using("btree", table.orderId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "payments_order_id_fkey"
		}).onDelete("cascade"),
	check("payments_payment_method_check", sql`(payment_method)::text = ANY ((ARRAY['card'::character varying, 'bank_transfer'::character varying, 'cod'::character varying])::text[])`),
	check("payments_amount_check", sql`amount >= (0)::numeric`),
	check("payments_status_check", sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[])`),
]);

export const shipping = pgTable("shipping", {
	id: serial().primaryKey().notNull(),
	orderId: integer("order_id").notNull(),
	shippingMethodId: integer("shipping_method_id").notNull(),
	shippingCost: numeric("shipping_cost", { precision: 10, scale:  2 }).notNull(),
	trackingNumber: varchar("tracking_number", { length: 100 }),
	status: varchar({ length: 30 }).default('preparing'),
	shippedAt: timestamp("shipped_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_shipping_order_id").using("btree", table.orderId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "shipping_order_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.shippingMethodId],
			foreignColumns: [shippingMethods.id],
			name: "shipping_shipping_method_id_fkey"
		}).onDelete("restrict"),
	check("shipping_shipping_cost_check", sql`shipping_cost >= (0)::numeric`),
	check("shipping_status_check", sql`(status)::text = ANY ((ARRAY['preparing'::character varying, 'shipped'::character varying, 'in_transit'::character varying, 'delivered'::character varying, 'returned'::character varying])::text[])`),
]);

export const shippingMethods = pgTable("shipping_methods", {
	id: serial().primaryKey().notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	freeFromAmount: numeric("free_from_amount", { precision: 10, scale:  2 }),
	isActive: boolean("is_active").default(true),
}, (table) => [
	unique("shipping_methods_code_key").on(table.code),
	check("shipping_methods_price_check", sql`price >= (0)::numeric`),
	check("shipping_methods_free_from_amount_check", sql`free_from_amount >= (0)::numeric`),
]);
