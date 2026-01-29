-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."role" AS ENUM('SuperAdmin', 'Manager', 'Accountant', 'Sales');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('Active', 'Suspended');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(255),
	"email" varchar(255),
	"password_hash" text NOT NULL,
	"role" varchar(50) DEFAULT 'Sales' NOT NULL,
	"status" varchar(50) DEFAULT 'Active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"username" varchar(255),
	"first_name" varchar(255),
	"last_name" varchar(255),
	"phone" varchar(50),
	"approval_status" varchar(50) DEFAULT 'approved',
	"avatar" text,
	"created_by" varchar(255),
	"visible_password" text,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "purchase_lots" (
	"lot_id" serial PRIMARY KEY NOT NULL,
	"supplier_name" varchar(255) NOT NULL,
	"invoice_date" date NOT NULL,
	"invoice_number" varchar(255) NOT NULL,
	"total_cost" numeric(10, 2) DEFAULT '0',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"lot_number" varchar(100),
	"supplier_id" integer
);
--> statement-breakpoint
CREATE TABLE "purchase_lot_items" (
	"item_id" serial PRIMARY KEY NOT NULL,
	"lot_id" integer NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"sku" varchar(100),
	"quantity" integer NOT NULL,
	"unit_cost" numeric(10, 2),
	"total_cost" numeric(10, 2),
	"description" text,
	"metadata" text,
	"product_type" varchar(100),
	"brand" varchar(100),
	"series" varchar(100),
	"model" varchar(100),
	"processor" varchar(100),
	"processor_gen" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"supplier_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"address" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "featured_products_config" (
	"slot_number" integer PRIMARY KEY NOT NULL,
	"product_code" text
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_url" text,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"currency" varchar(10),
	"billing_name" varchar(255),
	"billing_address_1" varchar(255),
	"billing_country" varchar(100),
	"billing_state" varchar(100),
	"billing_city" varchar(100),
	"shipping_name" varchar(255),
	"shipping_address_1" varchar(255),
	"shipping_country" varchar(100),
	"shipping_state" varchar(100),
	"shipping_city" varchar(100),
	"status" varchar(20) DEFAULT 'Active',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"billing_zip" varchar(20),
	"shipping_zip" varchar(20),
	"avatar" text,
	"username" varchar(255),
	"password_hash" text,
	"visible_password" text,
	"deactivated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_name" text NOT NULL,
	"action" text NOT NULL,
	"details" text,
	"status" text,
	"role" text,
	"ip" text,
	"timestamp" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "qc_inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"lot_id" integer,
	"product_id" integer,
	"sku" varchar(100),
	"product_name" varchar(255),
	"brand" varchar(100),
	"series" varchar(100),
	"model" varchar(100),
	"ram" varchar(100),
	"storage" varchar(100),
	"graphics" varchar(100),
	"screen_size" varchar(100),
	"screen_resolution" varchar(100),
	"keyboard_type" varchar(100),
	"keyboard_backlit" varchar(50),
	"condition_status" varchar(50),
	"status" varchar(50) DEFAULT 'QC Passed',
	"created_at" timestamp DEFAULT now(),
	"processor" varchar(100),
	"processor_gen" varchar(100),
	"purchase_lot_item_id" integer
);
--> statement-breakpoint
CREATE TABLE "laptopmodels" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand" varchar(100),
	"series" varchar(100),
	"model" varchar(100)
);
--> statement-breakpoint
ALTER TABLE "purchase_lots" ADD CONSTRAINT "purchase_lots_supplier_id_suppliers_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("supplier_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_lot_items" ADD CONSTRAINT "purchase_lot_items_lot_id_purchase_lots_lot_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."purchase_lots"("lot_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_inventory" ADD CONSTRAINT "qc_inventory_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "public"."purchase_lots"("lot_id") ON DELETE no action ON UPDATE no action;
*/