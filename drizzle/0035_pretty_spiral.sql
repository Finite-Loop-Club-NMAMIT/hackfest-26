CREATE TABLE "idea_round_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"round_id" text NOT NULL,
	"team_id" text NOT NULL,
	"evaluator_id" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_idea_assignment" UNIQUE("round_id","team_id","evaluator_id")
);
--> statement-breakpoint
CREATE TABLE "idea_team_round_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"round_id" text NOT NULL,
	"team_id" text NOT NULL,
	"raw_total_score" integer DEFAULT 0 NOT NULL,
	"normalized_total_score" double precision DEFAULT 0 NOT NULL,
	"evaluator_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "unique_idea_team_round_score" UNIQUE("round_id","team_id")
);
--> statement-breakpoint
ALTER TABLE "idea_round_assignments" ADD CONSTRAINT "idea_round_assignments_round_id_idea_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."idea_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_round_assignments" ADD CONSTRAINT "idea_round_assignments_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_round_assignments" ADD CONSTRAINT "idea_round_assignments_evaluator_id_dashboard_user_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "public"."dashboard_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_team_round_scores" ADD CONSTRAINT "idea_team_round_scores_round_id_idea_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."idea_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_team_round_scores" ADD CONSTRAINT "idea_team_round_scores_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;