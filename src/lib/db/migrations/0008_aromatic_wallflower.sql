CREATE TYPE "public"."inventory_mode" AS ENUM('detailed', 'simple');--> statement-breakpoint
CREATE TYPE "public"."simple_movement_type" AS ENUM('purchase', 'sale', 'adjustment');--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"movement_type" "movement_type" NOT NULL,
	"quantity_kg" numeric(12, 3) NOT NULL,
	"price_per_kg" numeric(10, 2),
	"total_value" numeric(15, 2),
	"reference_type" "simple_movement_type" NOT NULL,
	"reference_id" uuid,
	"description" text,
	"movement_date" timestamp with time zone NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_pool" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"total_quantity_kg" numeric(15, 3) DEFAULT '0' NOT NULL,
	"total_value" numeric(15, 2) DEFAULT '0' NOT NULL,
	"avg_price_per_kg" numeric(15, 2) GENERATED ALWAYS AS (CASE WHEN total_quantity_kg = 0 THEN 0 ELSE total_value / total_quantity_kg END) STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simple_purchase_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"purchase_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity_kg" numeric(12, 3) NOT NULL,
	"price_per_kg" numeric(10, 2) NOT NULL,
	"total_amount" numeric(15, 2) GENERATED ALWAYS AS (quantity_kg * price_per_kg) STORED NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "simple_purchase_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"purchase_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"account_id" uuid NOT NULL,
	"payment_date" timestamp with time zone NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "simple_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"purchase_date" timestamp with time zone NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"paid_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"due_amount" numeric(15, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED NOT NULL,
	"status" "payment_status" DEFAULT 'due' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "simple_sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sale_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity_kg" numeric(12, 3) NOT NULL,
	"price_per_kg" numeric(10, 2) NOT NULL,
	"total_amount" numeric(15, 2) GENERATED ALWAYS AS (quantity_kg * price_per_kg) STORED NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "simple_sale_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"sale_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"account_id" uuid NOT NULL,
	"payment_date" timestamp with time zone NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "simple_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid,
	"customer_name" text,
	"sale_type" "sale_type" NOT NULL,
	"is_quick_cash_sale" boolean DEFAULT false NOT NULL,
	"sale_date" timestamp with time zone NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"paid_amount" numeric(15, 2) DEFAULT '0' NOT NULL,
	"due_amount" numeric(15, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED NOT NULL,
	"status" "payment_status" DEFAULT 'due' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "inventory_mode" "inventory_mode" DEFAULT 'detailed' NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_pool" ADD CONSTRAINT "inventory_pool_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simple_purchase_items" ADD CONSTRAINT "simple_purchase_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simple_purchase_items" ADD CONSTRAINT "simple_purchase_items_purchase_id_simple_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."simple_purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simple_purchase_payments" ADD CONSTRAINT "simple_purchase_payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simple_purchase_payments" ADD CONSTRAINT "simple_purchase_payments_purchase_id_simple_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."simple_purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simple_purchase_payments" ADD CONSTRAINT "simple_purchase_payments_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simple_purchases" ADD CONSTRAINT "simple_purchases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simple_purchases" ADD CONSTRAINT "simple_purchases_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simple_sale_items" ADD CONSTRAINT "simple_sale_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simple_sale_items" ADD CONSTRAINT "simple_sale_items_sale_id_simple_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."simple_sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simple_sale_payments" ADD CONSTRAINT "simple_sale_payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simple_sale_payments" ADD CONSTRAINT "simple_sale_payments_sale_id_simple_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."simple_sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simple_sale_payments" ADD CONSTRAINT "simple_sale_payments_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simple_sales" ADD CONSTRAINT "simple_sales_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simple_sales" ADD CONSTRAINT "simple_sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_inventory_movements_org" ON "inventory_movements" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_movements_date" ON "inventory_movements" USING btree ("movement_date");--> statement-breakpoint
CREATE INDEX "idx_inventory_movements_reference" ON "inventory_movements" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "idx_simple_purchase_items_org" ON "simple_purchase_items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_simple_purchase_items_purchase" ON "simple_purchase_items" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "idx_simple_purchase_payments_org" ON "simple_purchase_payments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_simple_purchase_payments_purchase" ON "simple_purchase_payments" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "idx_simple_purchase_payments_account" ON "simple_purchase_payments" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "idx_simple_purchases_org" ON "simple_purchases" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_simple_purchases_vendor" ON "simple_purchases" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "idx_simple_purchases_date" ON "simple_purchases" USING btree ("purchase_date");--> statement-breakpoint
CREATE INDEX "idx_simple_sale_items_org" ON "simple_sale_items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_simple_sale_items_sale" ON "simple_sale_items" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "idx_simple_sale_payments_org" ON "simple_sale_payments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_simple_sale_payments_sale" ON "simple_sale_payments" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "idx_simple_sale_payments_account" ON "simple_sale_payments" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "idx_simple_sales_org" ON "simple_sales" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_simple_sales_customer" ON "simple_sales" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_simple_sales_date" ON "simple_sales" USING btree ("sale_date");