import { pgTable, serial, integer, text, numeric, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { servicesTable } from "./services";

export const packagesTable = pgTable("packages", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => servicesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  durationDays: integer("duration_days").notNull(),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  isPopular: boolean("is_popular").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Package = typeof packagesTable.$inferSelect;
