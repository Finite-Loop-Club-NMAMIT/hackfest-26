CREATE TABLE "invoice" (
	"id" uuid PRIMARY KEY NOT NULL,
	"teamId" text,
	"invoiceNo" text NOT NULL,
	"transactionId" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_teamId_team_id_fk" FOREIGN KEY ("teamId") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;