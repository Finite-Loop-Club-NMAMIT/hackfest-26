ALTER TABLE "event_user" ADD COLUMN "state" "state";--> statement-breakpoint
ALTER TABLE "event_user" ADD COLUMN "gender" "gender";--> statement-breakpoint
ALTER TABLE "site-settings" ADD COLUMN "event_registrations_open" boolean DEFAULT false;