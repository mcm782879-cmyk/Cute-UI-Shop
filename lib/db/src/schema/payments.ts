import { pgTable, serial, integer, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";

export const paymentStatusEnum = pgEnum("payment_status", ["pending", "verified", "rejected"]);

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  slipImageBase64: text("slip_image_base64").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  status: paymentStatusEnum("status").notNull().default("pending"),
  note: text("note"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Payment = typeof paymentsTable.$inferSelect;
