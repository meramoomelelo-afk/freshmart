import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const addressesTable = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  label: text("label").notNull().default("Home"),
  fullAddress: text("full_address").notNull(),
  landmark: text("landmark").notNull().default(""),
  city: text("city").notNull().default(""),
  pincode: text("pincode").notNull().default(""),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Address = typeof addressesTable.$inferSelect;
