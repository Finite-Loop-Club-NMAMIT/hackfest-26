import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { participants } from "./participant";
import { teams } from "./team";

export const support = pgTable("support", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  description: text("description").notNull(),
  teamId: text("team_id").references(() => teams.id, {
    onDelete: "cascade",
  }),
  submittedBy: text("submitted_by").references(() => participants.id, {
    onDelete: "cascade",
  }),
  isResolved: boolean("is_resolved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
