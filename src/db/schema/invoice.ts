import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { teams } from "./team";

export const invoice = pgTable("invoice", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text("teamId").references(() => teams.id),
  invoiceNo: text("invoiceNo").notNull(),
  transactionId: text("transactionId").notNull(),
});
