import { index, pgTable, text, unique } from "drizzle-orm/pg-core";
import { roundStatus } from "../enum";
import { dashboardUsers } from "./rbac";
import { teams } from "./team";

export const mentors = pgTable(
  "mentors",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    dashboardUserId: text("dashboard_user_id")
      .notNull()
      .references(() => dashboardUsers.id, { onDelete: "cascade" }),
  },
  (table) => [index("mentor_dashboard_user_idx").on(table.dashboardUserId)],
);

export const mentorRounds = pgTable("mentor_rounds", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  name: text("name").notNull(),

  status: roundStatus("status").default("Draft").notNull(),
});

export const mentorRoundAssignments = pgTable(
  "mentor_round_assignments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    mentorId: text("mentor_id")
      .notNull()
      .references(() => mentors.id, { onDelete: "cascade" }),

    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),

    mentorRoundId: text("mentor_round_id")
      .notNull()
      .references(() => mentorRounds.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("mentor_round_team_assignment_unique").on(
      table.mentorId,
      table.teamId,
      table.mentorRoundId,
    ),
    index("mentor_assignment_round_idx").on(table.mentorRoundId),
    index("mentor_assignments_idx").on(table.mentorId),
    index("mentor_assignment_team_idx").on(table.teamId),
    index("mentor_round_mentor_idx").on(table.mentorRoundId, table.mentorId),
    index("mentor_round_team_idx").on(table.mentorRoundId, table.teamId),
  ],
);

export const mentorFeedback = pgTable(
  "mentor_feedback",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    roundAssignmentId: text("round_assignment_id")
      .notNull()
      .references(() => mentorRoundAssignments.id, { onDelete: "cascade" }),

    feedback: text("feedback").notNull(),
  },
  (table) => [
    index("mentor_feedback_assignment_idx").on(table.roundAssignmentId),
  ],
);
