ALTER TABLE "event" RENAME COLUMN "date" TO "from";--> statement-breakpoint
DROP INDEX "event_date_idx";--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "to" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "event_from_idx" ON "event" USING btree ("from");--> statement-breakpoint
CREATE INDEX "event_to_idx" ON "event" USING btree ("to");