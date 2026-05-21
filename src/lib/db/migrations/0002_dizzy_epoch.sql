CREATE TABLE "consumption_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"consumable_id" uuid NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"used_at" timestamp with time zone NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "consumables_log" ADD COLUMN "stock_quantity" numeric(12, 3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "consumption_logs" ADD CONSTRAINT "consumption_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumption_logs" ADD CONSTRAINT "consumption_logs_consumable_id_consumables_log_id_fk" FOREIGN KEY ("consumable_id") REFERENCES "public"."consumables_log"("id") ON DELETE no action ON UPDATE no action;