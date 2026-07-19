import { pgTable, serial, jsonb, timestamp } from "drizzle-orm/pg-core";

export interface SiteSettingsData {
  heroTitle: string;
  heroSubtitle: string;
  announcement: string | null;
  trustItem1Title: string;
  trustItem1Desc: string;
  trustItem2Title: string;
  trustItem2Desc: string;
  trustItem3Title: string;
  trustItem3Desc: string;
  footerDescription: string;
  contactLine: string | null;
  contactDiscord: string | null;
  contactFacebook: string | null;
}

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  data: jsonb("data").$type<SiteSettingsData>().notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const defaultSiteSettings: SiteSettingsData = {
  heroTitle: "อยากได้เซิร์ฟเวอร์แบบไหน รินจัดให้! ได้หมดเลย",
  heroSubtitle: "บริการรับเปิดเซิร์ฟเวอร์เกม ตั้งค่า Discord หรือติดตั้งบอทต่างๆ ดูแลดุจญาติมิตร ราคาน่ารัก เป็นกันเองสุดๆ ✨",
  announcement: null,
  trustItem1Title: "เชื่อถือได้ 100%",
  trustItem1Desc: "ดูแลระบบด้วยความปลอดภัยสูงสุด ไม่ทิ้งงานแน่นอน",
  trustItem2Title: "ส่งงานไว",
  trustItem2Desc: "ทำมอบหมายรวดเร็ว ตรงต่อเวลา ตามที่ตกลงกันไว้",
  trustItem3Title: "บริการดุจเพื่อนสนิท",
  trustItem3Desc: "สอบถามได้ตลอด ยินดีให้คำปรึกษาด้วยความเต็มใจ",
  footerDescription: "บริการรับเปิดเซิฟเวอร์, ตั้งค่า Discord, และบอทต่างๆ ด้วยความใส่ใจและเป็นกันเอง เหมือนมีเพื่อนช่วยดูแล",
  contactLine: null,
  contactDiscord: null,
  contactFacebook: null,
};
