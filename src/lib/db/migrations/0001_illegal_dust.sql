ALTER TABLE "purchases" ADD COLUMN "truck_fare" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "labour_cost" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "food_cost" numeric(12, 2) DEFAULT '0' NOT NULL;