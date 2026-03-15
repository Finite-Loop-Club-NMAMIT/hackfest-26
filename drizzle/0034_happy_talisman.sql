CREATE TABLE "team_round_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"round_id" text NOT NULL,
	"normalized_total_score" double precision DEFAULT 0 NOT NULL,
	"judge_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "team_round_scores_unique" UNIQUE("team_id","round_id")
);
--> statement-breakpoint
ALTER TABLE "judge_round_assignments" ALTER COLUMN "normalized_total_score" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "payment_transaction_id" text;