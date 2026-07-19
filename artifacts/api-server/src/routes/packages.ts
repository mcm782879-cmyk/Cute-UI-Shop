import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, packagesTable } from "@workspace/db";
import { requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();

// GET /services/:serviceId/packages
router.get("/services/:serviceId/packages", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.serviceId) ? req.params.serviceId[0] : req.params.serviceId;
  const serviceId = parseInt(raw, 10);
  const packages = await db.select().from(packagesTable)
    .where(eq(packagesTable.serviceId, serviceId))
    .orderBy(packagesTable.price);
  res.json(packages.map(p => ({ ...p, price: Number(p.price), createdAt: p.createdAt.toISOString() })));
});

// POST /services/:serviceId/packages
router.post("/services/:serviceId/packages", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.serviceId) ? req.params.serviceId[0] : req.params.serviceId;
  const serviceId = parseInt(raw, 10);
  const { name, description, price, durationDays, features, isPopular } = req.body;
  const [pkg] = await db.insert(packagesTable).values({
    serviceId, name, description: description ?? null,
    price: String(price), durationDays: durationDays ?? 30,
    features: features ?? [], isPopular: isPopular ?? false,
  }).returning();
  res.status(201).json({ ...pkg, price: Number(pkg.price), createdAt: pkg.createdAt.toISOString() });
});

// PUT /packages/:id
router.put("/packages/:id", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, description, price, durationDays, features, isPopular } = req.body;
  const [updated] = await db.update(packagesTable)
    .set({ name, description: description ?? null, price: String(price), durationDays, features, isPopular })
    .where(eq(packagesTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "ไม่พบแพ็กเกจ" }); return; }
  res.json({ ...updated, price: Number(updated.price), createdAt: updated.createdAt.toISOString() });
});

// DELETE /packages/:id
router.delete("/packages/:id", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(packagesTable).where(eq(packagesTable.id, id));
  res.json({ success: true });
});

export default router;
