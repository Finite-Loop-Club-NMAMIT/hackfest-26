import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { teamCommitteeEnum } from "../enum";

export type TeamMemberSocialLinks = {
  linkedin?: string;
  github?: string;
  twitter?: string;
  instagram?: string;
  email?: string;
};

export const teamMembers = pgTable(
  "team_member",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    role: text("role").notNull(),
    committee: teamCommitteeEnum("committee").notNull(),
    photo: text("photo"),
    cloudinaryId: text("cloudinary_id"),
    socialLinks: jsonb("social_links")
      .$type<TeamMemberSocialLinks>()
      .notNull()
      .default({}),
    order: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("team_member_committee_idx").on(table.committee),
    index("team_member_is_active_idx").on(table.isActive),
    index("team_member_order_idx").on(table.order),
  ],
);
