import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type FacultySocialLinks = {
  linkedin?: string;
  github?: string;
  twitter?: string;
  instagram?: string;
  email?: string;
};

export const facultyMembers = pgTable(
  "faculty_member",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    designation: text("designation").notNull(),
    department: text("department").notNull(),
    photo: text("photo"),
    cloudinaryId: text("cloudinary_id"),
    socialLinks: jsonb("social_links")
      .$type<FacultySocialLinks>()
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
    index("faculty_member_is_active_idx").on(table.isActive),
    index("faculty_member_order_idx").on(table.order),
  ],
);
