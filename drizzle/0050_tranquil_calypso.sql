CREATE TABLE "panel_criterias" (
	"id" text PRIMARY KEY NOT NULL,
	"panel_round_id" text NOT NULL,
	"criteria_name" text NOT NULL,
	"max_score" integer DEFAULT 10 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "panel_round_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"panelist_id" text NOT NULL,
	"team_id" text NOT NULL,
	"panel_round_id" text NOT NULL,
	"raw_total_score" integer,
	"normalized_total_score" double precision,
	CONSTRAINT "panel_round_team_assignment_unique" UNIQUE("panelist_id","team_id","panel_round_id")
);
--> statement-breakpoint
CREATE TABLE "panel_rounds" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" "round_status" DEFAULT 'Draft' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "panel_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"round_assignment_id" text NOT NULL,
	"criteria_id" text NOT NULL,
	"raw_score" integer,
	CONSTRAINT "panel_score_assignment_criteria_unique" UNIQUE("round_assignment_id","criteria_id")
);
--> statement-breakpoint
CREATE TABLE "panel_team_round_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"round_id" text NOT NULL,
	"raw_total_score" integer,
	"normalized_total_score" double precision,
	"panelist_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "panel_team_round_scores_unique" UNIQUE("team_id","round_id")
);
--> statement-breakpoint
CREATE TABLE "panelists" (
	"id" text PRIMARY KEY NOT NULL,
	"dashboard_user_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "panel_criterias" ADD CONSTRAINT "panel_criterias_panel_round_id_panel_rounds_id_fk" FOREIGN KEY ("panel_round_id") REFERENCES "public"."panel_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panel_round_assignments" ADD CONSTRAINT "panel_round_assignments_panelist_id_panelists_id_fk" FOREIGN KEY ("panelist_id") REFERENCES "public"."panelists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panel_round_assignments" ADD CONSTRAINT "panel_round_assignments_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panel_round_assignments" ADD CONSTRAINT "panel_round_assignments_panel_round_id_panel_rounds_id_fk" FOREIGN KEY ("panel_round_id") REFERENCES "public"."panel_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panel_scores" ADD CONSTRAINT "panel_scores_round_assignment_id_panel_round_assignments_id_fk" FOREIGN KEY ("round_assignment_id") REFERENCES "public"."panel_round_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panel_scores" ADD CONSTRAINT "panel_scores_criteria_id_panel_criterias_id_fk" FOREIGN KEY ("criteria_id") REFERENCES "public"."panel_criterias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panel_team_round_scores" ADD CONSTRAINT "panel_team_round_scores_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panel_team_round_scores" ADD CONSTRAINT "panel_team_round_scores_round_id_panel_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."panel_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panelists" ADD CONSTRAINT "panelists_dashboard_user_id_dashboard_user_id_fk" FOREIGN KEY ("dashboard_user_id") REFERENCES "public"."dashboard_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "panel_criteria_round_idx" ON "panel_criterias" USING btree ("panel_round_id");--> statement-breakpoint
CREATE INDEX "panel_assignment_round_idx" ON "panel_round_assignments" USING btree ("panel_round_id");--> statement-breakpoint
CREATE INDEX "panel_assignments_idx" ON "panel_round_assignments" USING btree ("panelist_id");--> statement-breakpoint
CREATE INDEX "panel_assignment_team_idx" ON "panel_round_assignments" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "panel_round_panelist_idx" ON "panel_round_assignments" USING btree ("panel_round_id","panelist_id");--> statement-breakpoint
CREATE INDEX "panel_round_team_idx" ON "panel_round_assignments" USING btree ("panel_round_id","team_id");--> statement-breakpoint
CREATE INDEX "panel_score_assignment_idx" ON "panel_scores" USING btree ("round_assignment_id");--> statement-breakpoint
CREATE INDEX "panel_score_criteria_idx" ON "panel_scores" USING btree ("criteria_id");--> statement-breakpoint
CREATE INDEX "panelist_dashboard_user_idx" ON "panelists" USING btree ("dashboard_user_id");