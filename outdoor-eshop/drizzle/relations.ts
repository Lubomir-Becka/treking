import { relations } from "drizzle-orm/relations";
import { users, addresses, categories, products, productAttributes, attributes, productColors, productImages, productVariants, favorites, carts, cartItems, orders, orderItems, payments, shipping, shippingMethods } from "./schema";

export const addressesRelations = relations(addresses, ({one}) => ({
	user: one(users, {
		fields: [addresses.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	addresses: many(addresses),
	favorites: many(favorites),
	carts: many(carts),
	orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({one, many}) => ({
	category: one(categories, {
		fields: [categories.parentId],
		references: [categories.id],
		relationName: "categories_parentId_categories_id"
	}),
	categories: many(categories, {
		relationName: "categories_parentId_categories_id"
	}),
	products: many(products),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
	productAttributes: many(productAttributes),
	productColors: many(productColors),
	favorites: many(favorites),
}));

export const productAttributesRelations = relations(productAttributes, ({one}) => ({
	product: one(products, {
		fields: [productAttributes.productId],
		references: [products.id]
	}),
	attribute: one(attributes, {
		fields: [productAttributes.attributeId],
		references: [attributes.id]
	}),
}));

export const attributesRelations = relations(attributes, ({many}) => ({
	productAttributes: many(productAttributes),
}));

export const productColorsRelations = relations(productColors, ({one, many}) => ({
	product: one(products, {
		fields: [productColors.productId],
		references: [products.id]
	}),
	productImages: many(productImages),
	productVariants: many(productVariants),
}));

export const productImagesRelations = relations(productImages, ({one}) => ({
	productColor: one(productColors, {
		fields: [productImages.productColorId],
		references: [productColors.id]
	}),
}));

export const productVariantsRelations = relations(productVariants, ({one, many}) => ({
	productColor: one(productColors, {
		fields: [productVariants.productColorId],
		references: [productColors.id]
	}),
	cartItems: many(cartItems),
	orderItems: many(orderItems),
}));

export const favoritesRelations = relations(favorites, ({one}) => ({
	user: one(users, {
		fields: [favorites.userId],
		references: [users.id]
	}),
	product: one(products, {
		fields: [favorites.productId],
		references: [products.id]
	}),
}));

export const cartsRelations = relations(carts, ({one, many}) => ({
	user: one(users, {
		fields: [carts.userId],
		references: [users.id]
	}),
	cartItems: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({one}) => ({
	cart: one(carts, {
		fields: [cartItems.cartId],
		references: [carts.id]
	}),
	productVariant: one(productVariants, {
		fields: [cartItems.productVariantId],
		references: [productVariants.id]
	}),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	productVariant: one(productVariants, {
		fields: [orderItems.productVariantId],
		references: [productVariants.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	orderItems: many(orderItems),
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	payments: many(payments),
	shippings: many(shipping),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	order: one(orders, {
		fields: [payments.orderId],
		references: [orders.id]
	}),
}));

export const shippingRelations = relations(shipping, ({one}) => ({
	order: one(orders, {
		fields: [shipping.orderId],
		references: [orders.id]
	}),
	shippingMethod: one(shippingMethods, {
		fields: [shipping.shippingMethodId],
		references: [shippingMethods.id]
	}),
}));

export const shippingMethodsRelations = relations(shippingMethods, ({many}) => ({
	shippings: many(shipping),
}));