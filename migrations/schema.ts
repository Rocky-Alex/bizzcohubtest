import { pgTable, unique, serial, varchar, text, timestamp, foreignKey, date, numeric, integer, jsonb, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const role = pgEnum("role", ['SuperAdmin', 'Manager', 'Accountant', 'Sales'])
export const userStatus = pgEnum("user_status", ['Active', 'Suspended'])


export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	fullName: varchar("full_name", { length: 255 }),
	email: varchar({ length: 255 }),
	passwordHash: text("password_hash").notNull(),
	role: varchar({ length: 50 }).default('Sales').notNull(),
	status: varchar({ length: 50 }).default('Active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	username: varchar({ length: 255 }),
	firstName: varchar("first_name", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	phone: varchar({ length: 50 }),
	approvalStatus: varchar("approval_status", { length: 50 }).default('approved'),
	avatar: text(),
	createdBy: varchar("created_by", { length: 255 }),
	visiblePassword: text("visible_password"),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_username_unique").on(table.username),
]);

export const purchaseLots = pgTable("purchase_lots", {
	lotId: serial("lot_id").primaryKey().notNull(),
	supplierName: varchar("supplier_name", { length: 255 }).notNull(),
	invoiceDate: date("invoice_date").notNull(),
	invoiceNumber: varchar("invoice_number", { length: 255 }).notNull(),
	totalCost: numeric("total_cost", { precision: 10, scale:  2 }).default('0'),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	lotNumber: varchar("lot_number", { length: 100 }),
	supplierId: integer("supplier_id"),
}, (table) => [
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.supplierId],
			name: "purchase_lots_supplier_id_suppliers_supplier_id_fk"
		}),
]);

export const purchaseLotItems = pgTable("purchase_lot_items", {
	itemId: serial("item_id").primaryKey().notNull(),
	lotId: integer("lot_id").notNull(),
	productName: varchar("product_name", { length: 255 }).notNull(),
	sku: varchar({ length: 100 }),
	quantity: integer().notNull(),
	unitCost: numeric("unit_cost", { precision: 10, scale:  2 }),
	totalCost: numeric("total_cost", { precision: 10, scale:  2 }),
	description: text(),
	metadata: text(),
	productType: varchar("product_type", { length: 100 }),
	brand: varchar({ length: 100 }),
	series: varchar({ length: 100 }),
	model: varchar({ length: 100 }),
	processor: varchar({ length: 100 }),
	processorGen: varchar("processor_gen", { length: 100 }),
}, (table) => [
	foreignKey({
			columns: [table.lotId],
			foreignColumns: [purchaseLots.lotId],
			name: "purchase_lot_items_lot_id_purchase_lots_lot_id_fk"
		}),
]);

export const settings = pgTable("settings", {
	id: serial().primaryKey().notNull(),
	key: varchar({ length: 255 }).notNull(),
	value: text().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("settings_key_unique").on(table.key),
]);

export const roles = pgTable("roles", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	permissions: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("roles_name_unique").on(table.name),
]);

export const suppliers = pgTable("suppliers", {
	supplierId: serial("supplier_id").primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	contactPerson: varchar("contact_person", { length: 255 }),
	phone: varchar({ length: 50 }),
	email: varchar({ length: 255 }),
	address: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const featuredProductsConfig = pgTable("featured_products_config", {
	slotNumber: integer("slot_number").primaryKey().notNull(),
	productCode: text("product_code"),
});

export const customers = pgTable("customers", {
	id: serial().primaryKey().notNull(),
	imageUrl: text("image_url"),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	currency: varchar({ length: 10 }),
	billingName: varchar("billing_name", { length: 255 }),
	billingAddress1: varchar("billing_address_1", { length: 255 }),
	billingCountry: varchar("billing_country", { length: 100 }),
	billingState: varchar("billing_state", { length: 100 }),
	billingCity: varchar("billing_city", { length: 100 }),
	shippingName: varchar("shipping_name", { length: 255 }),
	shippingAddress1: varchar("shipping_address_1", { length: 255 }),
	shippingCountry: varchar("shipping_country", { length: 100 }),
	shippingState: varchar("shipping_state", { length: 100 }),
	shippingCity: varchar("shipping_city", { length: 100 }),
	status: varchar({ length: 20 }).default('Active'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	billingZip: varchar("billing_zip", { length: 20 }),
	shippingZip: varchar("shipping_zip", { length: 20 }),
	avatar: text(),
	username: varchar({ length: 255 }),
	passwordHash: text("password_hash"),
	visiblePassword: text("visible_password"),
	deactivatedAt: timestamp("deactivated_at", { mode: 'string' }),
});

export const activityLogs = pgTable("activity_logs", {
	id: serial().primaryKey().notNull(),
	userName: text("user_name").notNull(),
	action: text().notNull(),
	details: text(),
	status: text(),
	role: text(),
	ip: text(),
	timestamp: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const qcInventory = pgTable("qc_inventory", {
	id: serial().primaryKey().notNull(),
	lotId: integer("lot_id"),
	productId: integer("product_id"),
	sku: varchar({ length: 100 }),
	productName: varchar("product_name", { length: 255 }),
	brand: varchar({ length: 100 }),
	series: varchar({ length: 100 }),
	model: varchar({ length: 100 }),
	ram: varchar({ length: 100 }),
	storage: varchar({ length: 100 }),
	graphics: varchar({ length: 100 }),
	screenSize: varchar("screen_size", { length: 100 }),
	screenResolution: varchar("screen_resolution", { length: 100 }),
	keyboardType: varchar("keyboard_type", { length: 100 }),
	keyboardBacklit: varchar("keyboard_backlit", { length: 50 }),
	conditionStatus: varchar("condition_status", { length: 50 }),
	status: varchar({ length: 50 }).default('QC Passed'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	processor: varchar({ length: 100 }),
	processorGen: varchar("processor_gen", { length: 100 }),
	purchaseLotItemId: integer("purchase_lot_item_id"),
}, (table) => [
	foreignKey({
			columns: [table.lotId],
			foreignColumns: [purchaseLots.lotId],
			name: "qc_inventory_lot_id_fkey"
		}),
]);

export const laptopmodels = pgTable("laptopmodels", {
	id: serial().primaryKey().notNull(),
	brand: varchar({ length: 100 }),
	series: varchar({ length: 100 }),
	model: varchar({ length: 100 }),
});
