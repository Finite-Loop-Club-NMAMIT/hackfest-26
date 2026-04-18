ALTER TABLE "judge_round_assignments" ALTER COLUMN "raw_total_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "judge_round_assignments" ALTER COLUMN "raw_total_score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "judge_round_assignments" ALTER COLUMN "normalized_total_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "judge_round_assignments" ALTER COLUMN "normalized_total_score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "judge_scores" ALTER COLUMN "raw_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "judge_scores" ALTER COLUMN "raw_score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "team_round_scores" ALTER COLUMN "raw_total_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "team_round_scores" ALTER COLUMN "raw_total_score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "team_round_scores" ALTER COLUMN "normalized_total_score" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "team_round_scores" ALTER COLUMN "normalized_total_score" DROP NOT NULL;