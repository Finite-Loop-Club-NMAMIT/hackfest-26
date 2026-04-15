CREATE TABLE "dormitory" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"gender" "gender" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dormitory_teams" (
	"dormitory_id" text NOT NULL,
	"team_id" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dormitory_teams_dormitory_id_team_id_pk" PRIMARY KEY("dormitory_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "lab" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"capacity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_teams" (
	"lab_id" text NOT NULL,
	"team_id" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lab_teams_lab_id_team_id_pk" PRIMARY KEY("lab_id","team_id")
);
--> statement-breakpoint
ALTER TABLE "participant" ADD COLUMN "dormitory_id" text;--> statement-breakpoint
ALTER TABLE "participant" ADD COLUMN "attended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "lab_id" text;--> statement-breakpoint
ALTER TABLE "dormitory_teams" ADD CONSTRAINT "dormitory_teams_dormitory_id_dormitory_id_fk" FOREIGN KEY ("dormitory_id") REFERENCES "public"."dormitory"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dormitory_teams" ADD CONSTRAINT "dormitory_teams_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_teams" ADD CONSTRAINT "lab_teams_lab_id_lab_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."lab"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_teams" ADD CONSTRAINT "lab_teams_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participant" ADD CONSTRAINT "participant_dormitory_id_dormitory_id_fk" FOREIGN KEY ("dormitory_id") REFERENCES "public"."dormitory"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_lab_id_lab_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."lab"("id") ON DELETE set null ON UPDATE no action;