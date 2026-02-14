import {
  boolean,
  index,
  integer,
  type PgColumn,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { eventStatusEnum, eventTypeEnum, paymentStatusEnum } from "../enum";
import { eventUsers } from "./event-auth";

export const events = pgTable(
  "event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description").notNull(),
    date: timestamp("date").notNull().defaultNow(),
    venue: text("venue").notNull(),
    deadline: timestamp("deadline").notNull().defaultNow(),
    image: text("image").notNull(),
    type: eventTypeEnum("event_type").notNull().default("Solo"),
    status: eventStatusEnum("event_status").notNull().default("Draft"),
    maxTeams: integer("max_teams").notNull().default(0),
    minTeamSize: integer("min_team_size").notNull().default(1),
    maxTeamSize: integer("max_team_size").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("event_date_idx").on(table.date),
    index("event_deadline_idx").on(table.deadline),
  ],
);

export const eventParticipants = pgTable("event_participant", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  participantId: text("participant_id")
    .notNull()
    .references((): PgColumn => eventUsers.id),
  teamId: text("team_id")
    .notNull()
    .references(() => eventTeams.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Table for event teams
export const eventTeams = pgTable("event_teams", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("Pending"),
  leaderId: text("leader_id")
    .notNull()
    .references((): PgColumn => eventUsers.id),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id),
  attended: boolean("attended").notNull().default(false),
  isComplete: boolean("is_complete").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
