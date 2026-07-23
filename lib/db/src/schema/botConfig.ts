import { pgTable, serial, jsonb, timestamp } from "drizzle-orm/pg-core";

export interface BotConfigData {
  welcomeMessage: string;
  primaryColor: string;
  notificationChannel: string;
  autoRespond: boolean;
  respondDelay: number;
}

export const botConfigTable = pgTable("bot_config", {
  id: serial("id").primaryKey(),
  data: jsonb("data").$type<BotConfigData>().notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const defaultBotConfig: BotConfigData = {
  welcomeMessage: "สวัสดีครับ! ยินดีต้อนรับเข้าสู่เซิร์ฟเวอร์ของเรา 🎉",
  primaryColor: "#3B82F6",
  notificationChannel: "general",
  autoRespond: true,
  respondDelay: 1000,
};
