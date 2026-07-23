import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, botConfigTable, defaultBotConfig, type BotConfigData } from "@workspace/db";
import { requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();

async function getOrCreateBotConfig(): Promise<BotConfigData> {
  const rows = await db.select().from(botConfigTable).limit(1);
  if (rows.length > 0) return rows[0].data;
  const [created] = await db.insert(botConfigTable).values({ data: defaultBotConfig }).returning();
  return created.data;
}

// GET /bot-config (public - Discord bot can access)
router.get("/bot-config", async (req, res): Promise<void> => {
  try {
    const data = await getOrCreateBotConfig();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bot config" });
  }
});

// PUT /admin/bot-config (admin only - Dashboard updates)
router.put("/admin/bot-config", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  try {
    const body = req.body as Partial<BotConfigData>;
    const current = await getOrCreateBotConfig();
    const merged: BotConfigData = { ...current, ...body };
    
    const rows = await db.select().from(botConfigTable).limit(1);
    if (rows.length > 0) {
      await db.update(botConfigTable)
        .set({ data: merged, updatedAt: new Date() })
        .where(eq(botConfigTable.id, rows[0].id));
    } else {
      await db.insert(botConfigTable).values({ data: merged });
    }
    
    res.json(merged);
  } catch (error) {
    res.status(500).json({ error: "Failed to update bot config" });
  }
});

// GET /admin/bot-config (admin only - check current settings)
router.get("/admin/bot-config", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  try {
    const data = await getOrCreateBotConfig();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bot config" });
  }
});

export default router;
