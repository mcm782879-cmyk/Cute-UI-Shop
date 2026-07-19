import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, servicesTable, packagesTable } from "@workspace/db";
import { requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();

// GET /services
router.get("/services", async (req, res): Promise<void> => {
  const services = await db.select().from(servicesTable)
    .where(eq(servicesTable.isActive, true))
    .orderBy(servicesTable.createdAt);
  res.json(services.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  })));
});

// POST /services
router.post("/services", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const { name, description, icon, category, imageUrl, isActive } = req.body;
  const [service] = await db.insert(servicesTable).values({
    name, description, icon: icon || "🛠️", category,
    imageUrl: imageUrl ?? null,
    isActive: isActive !== false,
  }).returning();
  res.status(201).json({ ...service, createdAt: service.createdAt.toISOString() });
});

// GET /services/:id
router.get("/services/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const services = await db.select().from(servicesTable)
    .where(eq(servicesTable.id, id)).limit(1);
  if (!services.length) {
    res.status(404).json({ error: "ไม่พบบริการ" });
    return;
  }
  const packages = await db.select().from(packagesTable)
    .where(eq(packagesTable.serviceId, id))
    .orderBy(packagesTable.price);
  res.json({
    ...services[0],
    createdAt: services[0].createdAt.toISOString(),
    packages: packages.map(p => ({
      ...p,
      price: Number(p.price),
      createdAt: p.createdAt.toISOString(),
    })),
  });
});

// PUT /services/:id
router.put("/services/:id", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, description, icon, category, imageUrl, isActive } = req.body;
  const [updated] = await db.update(servicesTable)
    .set({ name, description, icon, category, imageUrl: imageUrl ?? null, isActive })
    .where(eq(servicesTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "ไม่พบบริการ" });
    return;
  }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

// DELETE /services/:id
router.delete("/services/:id", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(servicesTable).where(eq(servicesTable.id, id));
  res.json({ success: true });
});

export default router;
