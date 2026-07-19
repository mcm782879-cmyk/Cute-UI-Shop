import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const galleryTable = pgTable("gallery", {
  id: serial("id").primaryKey(),
  imageBase64: text("image_base64").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type GalleryImage = typeof galleryTable.$inferSelect;
