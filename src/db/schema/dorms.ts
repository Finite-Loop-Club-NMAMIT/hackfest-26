import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { genderEnum } from "../enum";
import { teams } from "./team";

export const dormitory = pgTable("dormitory", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  gender: genderEnum("gender").notNull(),
});

export const dormitoryTeams = pgTable(
  "dormitory_teams",
  {
    dormId: integer("dormitory_id")
      .notNull()
      .references(() => dormitory.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.dormId, t.teamId] })],
);
