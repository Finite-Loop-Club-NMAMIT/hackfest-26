CREATE TABLE "college" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"state" "state",
	CONSTRAINT "college_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"team_number" integer,
	"team_status" "team_status",
	"payment_status" "payment_status",
	"attended" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_name_unique" UNIQUE("name"),
	CONSTRAINT "team_team_number_unique" UNIQUE("team_number")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "state" "state";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "course" "course";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "gender" "gender";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "isLeader" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "role" DEFAULT 'User';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "attended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "idProof" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "resume" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "github" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "college_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "team_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_college_id_college_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."college"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;