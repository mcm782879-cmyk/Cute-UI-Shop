import { pgTable, serial, integer, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { packagesTable } from "./packages";

export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "processing", "completed", "cancelled"]);

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  packageId: integer("package_id").notNull().references(() => packagesTable.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  note: text("note"),
  adminNote: text("admin_note"),
  discordUsername: text("discord_username"),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Order = typeof ordersTable.$inferSelect;
