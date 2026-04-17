CREATE TABLE "support" (
	"id" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"team_id" text,
	"submitted_by" text,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support" ADD CONSTRAINT "support_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support" ADD CONSTRAINT "support_submitted_by_participant_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."participant"("id") ON DELETE cascade ON UPDATE no action;