// Write relations here
// Why relations? Gives type safety eg .with joins

import { relations } from "drizzle-orm";
import { colleges, teams, participants } from "./schema";

export const userRelations = relations(participants, ({ one }) => ({
  college: one(colleges, {
    fields: [participants.collegeId],
    references: [colleges.id],
  }),
  team: one(teams, {
    fields: [participants.teamId],
    references: [teams.id],
  }),
}));

export const collegeRelations = relations(colleges, ({ many }) => ({
  users: many(participants),
}));

export const teamRelations = relations(teams, ({ many }) => ({
  users: many(participants),
}));
