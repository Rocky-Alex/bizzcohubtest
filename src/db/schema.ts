import { pgTable, serial, text, varchar, decimal, integer, timestamp, boolean, pgEnum, date, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Enums ---
export const roleEnum = pgEnum('role', ['SuperAdmin', 'Manager', 'Accountant', 'Sales']);
export const userStatusEnum = pgEnum('user_status', ['Active', 'Suspended']);

// --- 1. User Management (Staff) ---
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    fullName: varchar('full_name', { length: 255 }),
    email: varchar('email', { length: 255 }).unique(),
    passwordHash: text('password_hash').notNull(),
    role: varchar('role', { length: 50 }).default('Sales').notNull(),
    status: varchar('status', { length: 50 }).default('Active').notNull(),
    createdAt: timestamp('created_at').defaultNow(),

    // Fields existing in DB but were missing in schema
    username: varchar('username', { length: 255 }).unique(),
    firstName: varchar('first_name', { length: 255 }),
    lastName: varchar('last_name', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    approvalStatus: varchar('approval_status', { length: 50 }).default('approved'),
    avatar: text('avatar'),
    createdBy: varchar('created_by', { length: 255 }),
    visiblePassword: text('visible_password'),
});

// User API route uses 'username', 'first_name', 'last_name', 'phone', 'avatar', 'visible_password', 'created_by'.
// The schema.ts was likely out of sync or minimal.
// I will NOT expand users table here unless I'm sure, to avoid accidental column drops.
// But wait, if I don't include them, `drizzle-kit push` might drop them if it thinks they shouldn't exist?
// No, `drizzle-kit push` usually prompts before dropping columns.

export const settings = pgTable('settings', {
    id: serial('id').primaryKey(),
    key: varchar('key', { length: 255 }).unique().notNull(),
    value: text('value').notNull(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// --- 8. Purchase Inventory ---

export const suppliers = pgTable('suppliers', {
    supplierId: serial('supplier_id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    contactPerson: varchar('contact_person', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    email: varchar('email', { length: 255 }),
    address: text('address'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const purchaseLots = pgTable('purchase_lots', {
    lotId: serial('lot_id').primaryKey(),
    lotNumber: varchar('lot_number', { length: 100 }),
    supplierId: integer('supplier_id').references(() => suppliers.supplierId),
    supplierName: varchar('supplier_name', { length: 255 }).notNull(), // Kept for history/denormalization
    invoiceDate: date('invoice_date').notNull(),
    invoiceNumber: varchar('invoice_number', { length: 255 }).notNull(),
    totalCost: decimal('total_cost', { precision: 10, scale: 2 }).default('0'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const purchaseLotItems = pgTable('purchase_lot_items', {
    itemId: serial('item_id').primaryKey(),
    lotId: integer('lot_id').references(() => purchaseLots.lotId).notNull(),
    productType: varchar('product_type', { length: 100 }),
    brand: varchar('brand', { length: 100 }),
    series: varchar('series', { length: 100 }),
    model: varchar('model', { length: 100 }),
    processor: varchar('processor', { length: 100 }),
    processorGen: varchar('processor_gen', { length: 100 }),
    productName: varchar('product_name', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 100 }),
    quantity: integer('quantity').notNull(),
    unitCost: decimal('unit_cost', { precision: 10, scale: 2 }),
    totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
    description: text('description'),
    metadata: text('metadata'),
});

export const purchaseLotsRelations = relations(purchaseLots, ({ one, many }) => ({
    supplier: one(suppliers, {
        fields: [purchaseLots.supplierId],
        references: [suppliers.supplierId],
    }),
    items: many(purchaseLotItems),
}));

export const purchaseLotItemsRelations = relations(purchaseLotItems, ({ one }) => ({
    lot: one(purchaseLots, {
        fields: [purchaseLotItems.lotId],
        references: [purchaseLots.lotId],
    }),
}));



export const qcInventory = pgTable('qc_inventory', {
    id: serial('id').primaryKey(),
    lotId: integer('lot_id').references(() => purchaseLots.lotId),
    purchaseLotItemId: integer('purchase_lot_item_id'),
    productId: integer('product_id').references(() => products.id),
    sku: varchar('sku', { length: 100 }), // Serial Number
    productName: varchar('product_name', { length: 255 }),
    brand: varchar('brand', { length: 100 }),
    series: varchar('series', { length: 100 }),
    model: varchar('model', { length: 100 }),
    processor: varchar('processor', { length: 100 }),
    processorGen: varchar('processor_gen', { length: 100 }),
    ram: varchar('ram', { length: 100 }),
    storage: varchar('storage', { length: 100 }),
    graphics: varchar('graphics', { length: 100 }), // Graphics Card
    screenSize: varchar('screen_size', { length: 100 }),
    screenResolution: varchar('screen_resolution', { length: 100 }),
    keyboardType: varchar('keyboard_type', { length: 100 }),
    keyboardBacklit: varchar('keyboard_backlit', { length: 50 }),
    conditionStatus: varchar('condition_status', { length: 50 }),
    status: varchar('status', { length: 50 }).default('QC Passed'),
    createdAt: timestamp('created_at').defaultNow(),
});

// --- Reconstructed Deleted Tables ---

export const customers = pgTable('customers', {
    id: serial('id').primaryKey(),
    imageUrl: text('image_url'),
    name: varchar('name', { length: 255 }),
    firstName: varchar('first_name', { length: 255 }),
    lastName: varchar('last_name', { length: 255 }),
    email: varchar('email', { length: 255 }).unique(),
    phone: varchar('phone', { length: 50 }),
    address: text('address'),
    currency: varchar('currency', { length: 10 }),

    // Billing
    billingName: varchar('billing_name', { length: 255 }),
    billingAddress1: varchar('billing_address_1', { length: 255 }),
    billingCountry: varchar('billing_country', { length: 100 }),
    billingState: varchar('billing_state', { length: 100 }),
    billingCity: varchar('billing_city', { length: 100 }),
    billingZip: varchar('billing_zip', { length: 20 }),

    // Shipping
    shippingName: varchar('shipping_name', { length: 255 }),
    shippingAddress1: varchar('shipping_address_1', { length: 255 }),
    shippingCountry: varchar('shipping_country', { length: 100 }),
    shippingState: varchar('shipping_state', { length: 100 }),
    shippingCity: varchar('shipping_city', { length: 100 }),
    shippingZip: varchar('shipping_zip', { length: 20 }),

    status: varchar('status', { length: 20 }).default('Active'),
    avatar: text('avatar'),
    username: varchar('username', { length: 255 }),
    passwordHash: text('password_hash'),
    visiblePassword: text('visible_password'),
    deactivatedAt: timestamp('deactivated_at'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
    id: serial('product_id').primaryKey(),
    sku: varchar('sku', { length: 100 }).unique(),
    name: varchar('product_name', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }),
    brand: varchar('brand', { length: 100 }),
    model: varchar('model', { length: 100 }),

    // Price fields
    price: decimal('price', { precision: 10, scale: 2 }), // Generic/base price
    sellPrice: decimal('sell_price', { precision: 10, scale: 2 }),
    buyPrice: decimal('buy_price', { precision: 10, scale: 2 }),

    stockQuantity: integer('stock_quantity').default(0),
    description: text('description'),

    // Images
    imageUrl: text('image_url'),
    allImagesUrls: text('all_images_urls'), // Comma separated

    // Specs
    processor: varchar('processor', { length: 100 }),
    ram: varchar('ram', { length: 100 }),
    storage: varchar('storage', { length: 100 }),
    display: varchar('display', { length: 100 }),
    graphics: varchar('graphics', { length: 100 }),

    type: varchar('type', { length: 50 }).default('laptop'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const productSerials = pgTable('product_serials', {
    id: serial('id').primaryKey(),
    productId: integer('product_id').references(() => products.id),
    serialNumber: varchar('serial_number', { length: 255 }).unique(),
    status: varchar('status', { length: 50 }).default('Available'), // Available, Sold, Defective
    soldAt: timestamp('sold_at'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const coupons = pgTable('coupons', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 50 }).unique().notNull(),
    discountType: varchar('discount_type', { length: 20 }).notNull(), // percentage, fixed
    discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
    minPurchase: decimal('min_purchase', { precision: 10, scale: 2 }).default('0'),
    maxDiscount: decimal('max_discount', { precision: 10, scale: 2 }),
    startDate: timestamp('start_date'),
    expiryDate: timestamp('expiry_date'),
    usageLimit: integer('usage_limit'),
    usedCount: integer('used_count').default(0),
    status: varchar('status', { length: 20 }).default('active'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
    orderId: serial('order_id').primaryKey(),
    customerId: integer('customer_id').references(() => customers.id),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
    taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0'),
    shippingAmount: decimal('shipping_amount', { precision: 10, scale: 2 }).default('0'),

    orderStatus: varchar('order_status', { length: 50 }).default('Pending'),
    paymentStatus: varchar('payment_status', { length: 50 }).default('Unpaid'),
    paymentMethod: varchar('payment_method', { length: 50 }),

    shippingAddress: text('shipping_address'),
    billingAddress: text('billing_address'),

    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const orderItems = pgTable('order_items', {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').references(() => orders.orderId).notNull(),
    productId: integer('product_id').references(() => products.id),
    quantity: integer('quantity').notNull(),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal('total_price', { precision: 10, scale: 2 }),
    serialId: integer('serial_id').references(() => productSerials.id),
});

export const invoices = pgTable('invoices', {
    id: serial('id').primaryKey(),
    invoiceNo: varchar('invoice_no', { length: 50 }).unique().notNull(),
    orderId: integer('order_id').references(() => orders.orderId),
    customerId: integer('customer_id').references(() => customers.id),
    customerName: varchar('customer_name', { length: 255 }), // Snapshot
    customerEmail: varchar('customer_email', { length: 255 }),
    customerAddress: text('customer_address'),

    subTotal: decimal('sub_total', { precision: 10, scale: 2 }),
    taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }),
    discountTotal: decimal('discount_total', { precision: 10, scale: 2 }),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }),
    advanceReceived: decimal('advance_received', { precision: 10, scale: 2 }).default('0'),

    status: varchar('status', { length: 50 }).default('Unpaid'),
    paymentType: varchar('payment_type', { length: 50 }),

    isTaxable: boolean('is_taxable').default(false),
    isDiscountable: boolean('is_discountable').default(false),

    notes: text('notes'),
    createdDate: timestamp('created_date').defaultNow(),
    dueDate: timestamp('due_date'),
});

// Since invoices is a standalone table in many parts of the app, let's also define invoiceItems if they are separate from orderItems
export const invoiceItems = pgTable('invoice_items', {
    id: serial('id').primaryKey(),
    invoiceId: integer('invoice_id').references(() => invoices.id).notNull(),
    description: text('description'),
    quantity: integer('quantity'),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),
    discount: decimal('discount', { precision: 10, scale: 2 }),
    total: decimal('total', { precision: 10, scale: 2 }),
    productCode: varchar('product_code', { length: 100 }),
});

export const accountingLedger = pgTable('accounting_ledger', {
    id: serial('id').primaryKey(),
    transactionDate: timestamp('transaction_date').defaultNow(),
    type: varchar('type', { length: 50 }), // Income, Expense
    category: varchar('category', { length: 100 }),
    description: text('description'),
    amount: decimal('amount', { precision: 12, scale: 2 }),
    referenceId: varchar('reference_id', { length: 100 }), // e.g. Invoice # or PO #
    paymentMethod: varchar('payment_method', { length: 50 }),
    createdBy: varchar('created_by', { length: 100 }),
});

export const activityLogs = pgTable('activity_logs', {
    id: serial('id').primaryKey(),
    userName: text('user_name').notNull(),
    action: text('action').notNull(),
    details: text('details'),
    status: text('status'),
    role: text('role'),
    ip: text('ip'),
    timestamp: timestamp('timestamp').defaultNow(),
});

export const wishlist = pgTable('wishlist', {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id').references(() => customers.id),
    productId: integer('product_id').references(() => products.id),
    createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
    orders: many(orders),
    addresses: many(customers) // simplistic placeholder
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
    customer: one(customers, {
        fields: [orders.customerId],
        references: [customers.id],
    }),
    items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.orderId],
    }),
    product: one(products, {
        fields: [orderItems.productId],
        references: [products.id],
    }),
}));


export const roles = pgTable('roles', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).unique().notNull(),
    permissions: jsonb('permissions').default({}),
    createdAt: timestamp('created_at').defaultNow(),
});

// --- Laptop Drop Lists ---

// --- Laptop Drop Lists ---

// User requested strict "laptopmodels" table
export const laptopModels = pgTable('laptopmodels', {
    id: serial('id').primaryKey(),
    brand: varchar('brand', { length: 100 }),
    series: varchar('series', { length: 100 }),
    model: varchar('model', { length: 100 }),
});

export const ramOptions = pgTable('ram_options', {
    id: serial('id').primaryKey(),
    value: varchar('value', { length: 100 }).notNull(),
});

export const storageOptions = pgTable('storage_options', {
    id: serial('id').primaryKey(),
    value: varchar('value', { length: 100 }).notNull(),
});

export const graphicsOptions = pgTable('graphics_options', {
    id: serial('id').primaryKey(),
    value: varchar('value', { length: 100 }).notNull(),
});

export const processorOptions = pgTable('processor_options', {
    id: serial('id').primaryKey(),
    value: varchar('value', { length: 100 }).notNull(),
});

export const processorGenOptions = pgTable('processor_gen_options', {
    id: serial('id').primaryKey(),
    value: varchar('value', { length: 100 }).notNull(),
});

export const screenSizeOptions = pgTable('screen_size_options', {
    id: serial('id').primaryKey(),
    value: varchar('value', { length: 100 }).notNull(),
});

export const screenResolutionOptions = pgTable('screen_resolution_options', {
    id: serial('id').primaryKey(),
    value: varchar('value', { length: 100 }).notNull(),
});

export const keyboardTypeOptions = pgTable('keyboard_type_options', {
    id: serial('id').primaryKey(),
    value: varchar('value', { length: 100 }).notNull(),
});

export const keyboardBacklitOptions = pgTable('keyboard_backlit_options', {
    id: serial('id').primaryKey(),
    value: varchar('value', { length: 100 }).notNull(),
});

export const conditionStatusOptions = pgTable('condition_status_options', {
    id: serial('id').primaryKey(),
    value: varchar('value', { length: 100 }).notNull(),
});
