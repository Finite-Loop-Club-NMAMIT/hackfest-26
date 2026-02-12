ALTER TABLE "event_participant" DROP CONSTRAINT "event_participant_participant_id_participant_id_fk";
--> statement-breakpoint
ALTER TABLE "event_teams" DROP CONSTRAINT "event_teams_leader_id_participant_id_fk";
--> statement-breakpoint
ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_participant_id_event_user_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."event_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_teams" ADD CONSTRAINT "event_teams_leader_id_event_user_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."event_user"("id") ON DELETE no action ON UPDATE no action;