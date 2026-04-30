CREATE TYPE "public"."team_committee" AS ENUM('Organising Committee', 'Technical Committee', 'Sponsorship Committee', 'Social Media & Media Committee', 'Digital Committee', 'Documentation Committee', 'Publicity Committee', 'Operations Committee', 'Event Management Committee', 'Crew Committee');--> statement-breakpoint
CREATE TABLE "faculty_member" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"designation" text NOT NULL,
	"department" text NOT NULL,
	"photo" text,
	"cloudinary_id" text,
	"social_links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"committee" "team_committee" NOT NULL,
	"photo" text,
	"cloudinary_id" text,
	"social_links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "faculty_member_is_active_idx" ON "faculty_member" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "faculty_member_order_idx" ON "faculty_member" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "team_member_committee_idx" ON "team_member" USING btree ("committee");--> statement-breakpoint
CREATE INDEX "team_member_is_active_idx" ON "team_member" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "team_member_order_idx" ON "team_member" USING btree ("display_order");