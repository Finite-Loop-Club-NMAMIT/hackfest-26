CREATE TYPE "public"."timer_status" AS ENUM('IDLE', 'RUNNING', 'PAUSED', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "announcement" (
	"id" text PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timer" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"duration_seconds" integer NOT NULL,
	"elapsed_seconds" integer DEFAULT 0 NOT NULL,
	"status" timer_status DEFAULT 'IDLE' NOT NULL,
	"started_at" bigint,
	"start_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
