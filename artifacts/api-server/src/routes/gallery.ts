import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, galleryTable } from "@workspace/db";
import { requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();

// GET /gallery
router.get("/gallery", async (req, res): Promise<void> => {
  const images = await db.select().from(galleryTable)
    .orderBy(desc(galleryTable.createdAt));
  res.json(images.map(i => ({ ...i, createdAt: i.createdAt.toISOString() })));
});

// POST /gallery (admin)
router.post("/gallery", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const { imageBase64, title } = req.body;
  if (!imageBase64 || !title) {
    res.status(400).json({ error: "กรุณาระบุรูปภาพและชื่อ" });
    return;
  }
  const [image] = await db.insert(galleryTable).values({ imageBase64, title }).returning();
  res.status(201).json({ ...image, createdAt: image.createdAt.toISOString() });
});

// DELETE /gallery/:id (admin)
router.delete("/gallery/:id", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(galleryTable).where(eq(galleryTable.id, id));
  res.json({ success: true });
});

export default router;
