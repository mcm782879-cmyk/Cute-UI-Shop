import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, ordersTable, packagesTable, usersTable, servicesTable } from "@workspace/db";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

async function notifyDiscord(order: { id: number; discordUsername: string | null; totalPrice: string | number; note: string | null; packageName: string; serviceName: string; username: string }) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "📦 ออเดอร์ใหม่! - รินจัดให้",
          color: 0xb39ddb,
          fields: [
            { name: "ออเดอร์ #", value: String(order.id), inline: true },
            { name: "ผู้สั่ง", value: order.username, inline: true },
            { name: "Discord", value: order.discordUsername || "-", inline: true },
            { name: "บริการ", value: order.serviceName, inline: true },
            { name: "แพ็กเกจ", value: order.packageName, inline: true },
            { name: "ราคา", value: `${Number(order.totalPrice).toLocaleString()} บาท`, inline: true },
            { name: "หมายเหตุ", value: order.note || "-", inline: false },
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "รินจัดให้ | ระบบออเดอร์" },
        }],
      }),
    });
  } catch (err) {
    logger.warn({ err }, "Failed to send Discord notification");
  }
}

function formatOrder(o: any, user?: any, pkg?: any) {
  return {
    ...o,
    totalPrice: Number(o.totalPrice),
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
    user: user ? { id: user.id, username: user.username, email: user.email, role: user.role, createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt } : undefined,
    package: pkg ? { ...pkg, price: Number(pkg.price), createdAt: pkg.createdAt instanceof Date ? pkg.createdAt.toISOString() : pkg.createdAt } : undefined,
  };
}

// GET /orders (admin)
router.get("/orders", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const orders = await db.select({
    order: ordersTable,
    user: usersTable,
    package: packagesTable,
  }).from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .leftJoin(packagesTable, eq(ordersTable.packageId, packagesTable.id))
    .orderBy(desc(ordersTable.createdAt));
  res.json(orders.map(r => formatOrder(r.order, r.user, r.package)));
});

// POST /orders
router.post("/orders", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { packageId, note, discordUsername } = req.body;
  if (!packageId) { res.status(400).json({ error: "กรุณาเลือกแพ็กเกจ" }); return; }

  const pkgs = await db.select().from(packagesTable)
    .leftJoin(servicesTable, eq(packagesTable.serviceId, servicesTable.id))
    .where(eq(packagesTable.id, packageId)).limit(1);
  if (!pkgs.length) { res.status(400).json({ error: "ไม่พบแพ็กเกจ" }); return; }

  const pkg = pkgs[0].packages;
  const svc = pkgs[0].services;

  const [order] = await db.insert(ordersTable).values({
    userId: req.userId!,
    packageId,
    note: note ?? null,
    discordUsername: discordUsername ?? null,
    totalPrice: pkg.price,
    status: "pending",
  }).returning();

  const user = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);

  await notifyDiscord({
    id: order.id,
    discordUsername: order.discordUsername,
    totalPrice: order.totalPrice,
    note: order.note,
    packageName: pkg.name,
    serviceName: svc?.name ?? "ไม่ระบุ",
    username: user[0]?.username ?? "ไม่ระบุ",
  });

  res.status(201).json(formatOrder(order, user[0], { ...pkg, price: Number(pkg.price) }));
});

// GET /orders/my
router.get("/orders/my", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const orders = await db.select({
    order: ordersTable,
    user: usersTable,
    package: packagesTable,
  }).from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .leftJoin(packagesTable, eq(ordersTable.packageId, packagesTable.id))
    .where(eq(ordersTable.userId, req.userId!))
    .orderBy(desc(ordersTable.createdAt));
  res.json(orders.map(r => formatOrder(r.order, r.user, r.package)));
});

// GET /orders/:id
router.get("/orders/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const rows = await db.select({
    order: ordersTable,
    user: usersTable,
    package: packagesTable,
  }).from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .leftJoin(packagesTable, eq(ordersTable.packageId, packagesTable.id))
    .where(eq(ordersTable.id, id)).limit(1);

  if (!rows.length) { res.status(404).json({ error: "ไม่พบออเดอร์" }); return; }
  const r = rows[0];
  if (req.userRole !== "admin" && r.order.userId !== req.userId) {
    res.status(403).json({ error: "ไม่มีสิทธิ์เข้าถึง" }); return;
  }
  res.json(formatOrder(r.order, r.user, r.package));
});

// PUT /orders/:id/status (admin)
router.put("/orders/:id/status", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { status, adminNote } = req.body;
  const [updated] = await db.update(ordersTable)
    .set({ status, adminNote: adminNote ?? null })
    .where(eq(ordersTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "ไม่พบออเดอร์" }); return; }
  res.json(formatOrder(updated));
});

export default router;
