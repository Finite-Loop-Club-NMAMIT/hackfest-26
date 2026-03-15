CREATE TABLE "idea_round_criteria" (
	"id" text PRIMARY KEY NOT NULL,
	"round_id" text NOT NULL,
	"name" text NOT NULL,
	"max_score" integer DEFAULT 10 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idea_rounds" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role_id" text NOT NULL,
	"team_stage" "team_stage" DEFAULT 'NOT_SELECTED' NOT NULL,
	"status" "round_status" DEFAULT 'Draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idea_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"round_id" text NOT NULL,
	"team_id" text NOT NULL,
	"evaluator_id" text NOT NULL,
	"criteria_id" text NOT NULL,
	"raw_score" integer NOT NULL,
	CONSTRAINT "unique_score" UNIQUE("round_id","team_id","evaluator_id","criteria_id")
);
--> statement-breakpoint
CREATE TABLE "idea_team_evaluations" (
	"id" text PRIMARY KEY NOT NULL,
	"round_id" text NOT NULL,
	"team_id" text NOT NULL,
	"evaluator_id" text NOT NULL,
	"raw_total_score" integer DEFAULT 0 NOT NULL,
	"normalized_total_score" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "unique_team_evaluation" UNIQUE("round_id","team_id","evaluator_id")
);
--> statement-breakpoint
ALTER TABLE "idea_round_criteria" ADD CONSTRAINT "idea_round_criteria_round_id_idea_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."idea_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_rounds" ADD CONSTRAINT "idea_rounds_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_scores" ADD CONSTRAINT "idea_scores_round_id_idea_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."idea_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_scores" ADD CONSTRAINT "idea_scores_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_scores" ADD CONSTRAINT "idea_scores_evaluator_id_dashboard_user_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "public"."dashboard_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_scores" ADD CONSTRAINT "idea_scores_criteria_id_idea_round_criteria_id_fk" FOREIGN KEY ("criteria_id") REFERENCES "public"."idea_round_criteria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_team_evaluations" ADD CONSTRAINT "idea_team_evaluations_round_id_idea_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."idea_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_team_evaluations" ADD CONSTRAINT "idea_team_evaluations_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_team_evaluations" ADD CONSTRAINT "idea_team_evaluations_evaluator_id_dashboard_user_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "public"."dashboard_user"("id") ON DELETE no action ON UPDATE no action;