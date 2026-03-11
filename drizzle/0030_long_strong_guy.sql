CREATE TYPE "public"."round_status" AS ENUM('Draft', 'Active', 'Completed');--> statement-breakpoint
CREATE TABLE "mentor_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"round_assignment_id" text NOT NULL,
	"feedback" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentor_round_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"mentor_id" text NOT NULL,
	"team_id" text NOT NULL,
	"mentor_round_id" text NOT NULL,
	CONSTRAINT "mentor_round_team_assignment_unique" UNIQUE("mentor_id","team_id","mentor_round_id")
);
--> statement-breakpoint
CREATE TABLE "mentor_rounds" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" "round_status" DEFAULT 'Draft' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentors" (
	"id" text PRIMARY KEY NOT NULL,
	"dashboard_user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "judge_criterias" (
	"id" text PRIMARY KEY NOT NULL,
	"judge_round_id" text NOT NULL,
	"criteria_name" text NOT NULL,
	"max_score" integer DEFAULT 10 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "judge_round_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"judge_id" text NOT NULL,
	"team_id" text NOT NULL,
	"judge_round_id" text NOT NULL,
	"raw_total_score" integer DEFAULT 0 NOT NULL,
	"normalized_total_score" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "judge_round_team_assignment_unique" UNIQUE("judge_id","team_id","judge_round_id")
);
--> statement-breakpoint
CREATE TABLE "judge_rounds" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" "round_status" DEFAULT 'Draft' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "judge_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"round_assignment_id" text NOT NULL,
	"criteria_id" text NOT NULL,
	"raw_score" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "judge_score_assignment_criteria_unique" UNIQUE("round_assignment_id","criteria_id")
);
--> statement-breakpoint
CREATE TABLE "judges" (
	"id" text PRIMARY KEY NOT NULL,
	"dashboard_user_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mentor_feedback" ADD CONSTRAINT "mentor_feedback_round_assignment_id_mentor_round_assignments_id_fk" FOREIGN KEY ("round_assignment_id") REFERENCES "public"."mentor_round_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_round_assignments" ADD CONSTRAINT "mentor_round_assignments_mentor_id_mentors_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_round_assignments" ADD CONSTRAINT "mentor_round_assignments_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_round_assignments" ADD CONSTRAINT "mentor_round_assignments_mentor_round_id_mentor_rounds_id_fk" FOREIGN KEY ("mentor_round_id") REFERENCES "public"."mentor_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentors" ADD CONSTRAINT "mentors_dashboard_user_id_dashboard_user_id_fk" FOREIGN KEY ("dashboard_user_id") REFERENCES "public"."dashboard_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judge_criterias" ADD CONSTRAINT "judge_criterias_judge_round_id_judge_rounds_id_fk" FOREIGN KEY ("judge_round_id") REFERENCES "public"."judge_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judge_round_assignments" ADD CONSTRAINT "judge_round_assignments_judge_id_judges_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."judges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judge_round_assignments" ADD CONSTRAINT "judge_round_assignments_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judge_round_assignments" ADD CONSTRAINT "judge_round_assignments_judge_round_id_judge_rounds_id_fk" FOREIGN KEY ("judge_round_id") REFERENCES "public"."judge_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judge_scores" ADD CONSTRAINT "judge_scores_round_assignment_id_judge_round_assignments_id_fk" FOREIGN KEY ("round_assignment_id") REFERENCES "public"."judge_round_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judge_scores" ADD CONSTRAINT "judge_scores_criteria_id_judge_criterias_id_fk" FOREIGN KEY ("criteria_id") REFERENCES "public"."judge_criterias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judges" ADD CONSTRAINT "judges_dashboard_user_id_dashboard_user_id_fk" FOREIGN KEY ("dashboard_user_id") REFERENCES "public"."dashboard_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mentor_feedback_assignment_idx" ON "mentor_feedback" USING btree ("round_assignment_id");--> statement-breakpoint
CREATE INDEX "mentor_assignment_round_idx" ON "mentor_round_assignments" USING btree ("mentor_round_id");--> statement-breakpoint
CREATE INDEX "mentor_assignments_idx" ON "mentor_round_assignments" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX "mentor_assignment_team_idx" ON "mentor_round_assignments" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "mentor_round_mentor_idx" ON "mentor_round_assignments" USING btree ("mentor_round_id","mentor_id");--> statement-breakpoint
CREATE INDEX "mentor_round_team_idx" ON "mentor_round_assignments" USING btree ("mentor_round_id","team_id");--> statement-breakpoint
CREATE INDEX "mentor_dashboard_user_idx" ON "mentors" USING btree ("dashboard_user_id");--> statement-breakpoint
CREATE INDEX "judge_criteria_round_idx" ON "judge_criterias" USING btree ("judge_round_id");--> statement-breakpoint
CREATE INDEX "judge_assignment_round_idx" ON "judge_round_assignments" USING btree ("judge_round_id");--> statement-breakpoint
CREATE INDEX "judge_assignments_idx" ON "judge_round_assignments" USING btree ("judge_id");--> statement-breakpoint
CREATE INDEX "judge_assignment_team_idx" ON "judge_round_assignments" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "judge_round_judge_idx" ON "judge_round_assignments" USING btree ("judge_round_id","judge_id");--> statement-breakpoint
CREATE INDEX "judge_round_team_idx" ON "judge_round_assignments" USING btree ("judge_round_id","team_id");--> statement-breakpoint
CREATE INDEX "judge_score_assignment_idx" ON "judge_scores" USING btree ("round_assignment_id");--> statement-breakpoint
CREATE INDEX "judge_score_criteria_idx" ON "judge_scores" USING btree ("criteria_id");--> statement-breakpoint
CREATE INDEX "judge_dashboard_user_idx" ON "judges" USING btree ("dashboard_user_id");