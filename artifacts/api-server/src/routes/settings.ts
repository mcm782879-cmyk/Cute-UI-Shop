import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, siteSettingsTable, defaultSiteSettings, type SiteSettingsData } from "@workspace/db";
import { requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();

async function getOrCreateSettings(): Promise<SiteSettingsData> {
  const rows = await db.select().from(siteSettingsTable).limit(1);
  if (rows.length > 0) return rows[0].data;
  const [created] = await db.insert(siteSettingsTable).values({ data: defaultSiteSettings }).returning();
  return created.data;
}

// GET /settings (public)
router.get("/settings", async (req, res): Promise<void> => {
  const data = await getOrCreateSettings();
  res.json(data);
});

// PUT /admin/settings (admin)
router.put("/admin/settings", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const body = req.body as Partial<SiteSettingsData>;
  const current = await getOrCreateSettings();
  const merged: SiteSettingsData = { ...current, ...body };
  const rows = await db.select().from(siteSettingsTable).limit(1);
  if (rows.length > 0) {
    await db.update(siteSettingsTable)
      .set({ data: merged, updatedAt: new Date() })
      .where(eq(siteSettingsTable.id, rows[0].id));
  } else {
    await db.insert(siteSettingsTable).values({ data: merged });
  }
  res.json(merged);
});

export default router;
