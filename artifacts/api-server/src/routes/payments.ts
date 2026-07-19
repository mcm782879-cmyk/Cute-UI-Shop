import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, paymentsTable, ordersTable, usersTable } from "@workspace/db";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();

// GET /payments (admin) — includes username from joined order→user
router.get("/payments", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const rows = await db
    .select({
      payment: paymentsTable,
      username: usersTable.username,
    })
    .from(paymentsTable)
    .leftJoin(ordersTable, eq(paymentsTable.orderId, ordersTable.id))
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .orderBy(desc(paymentsTable.createdAt));

  res.json(rows.map(r => ({
    ...r.payment,
    amount: r.payment.amount != null ? Number(r.payment.amount) : null,
    createdAt: r.payment.createdAt.toISOString(),
    verifiedAt: r.payment.verifiedAt?.toISOString() ?? null,
    username: r.username ?? null,
  })));
});

// POST /payments/slip
router.post("/payments/slip", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { orderId, slipImageBase64, amount } = req.body;
  if (!orderId || !slipImageBase64) {
    res.status(400).json({ error: "กรุณาอัปโหลดสลิปและระบุออเดอร์" });
    return;
  }
  const [payment] = await db.insert(paymentsTable).values({
    orderId,
    slipImageBase64,
    amount: amount != null ? String(amount) : null,
    status: "pending",
  }).returning();

  await db.update(ordersTable)
    .set({ status: "paid" })
    .where(eq(ordersTable.id, orderId));

  res.status(201).json({
    ...payment,
    amount: payment.amount != null ? Number(payment.amount) : null,
    createdAt: payment.createdAt.toISOString(),
    verifiedAt: payment.verifiedAt?.toISOString() ?? null,
    username: null,
  });
});

// PUT /payments/:id/verify (admin)
router.put("/payments/:id/verify", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { status, note } = req.body;

  const [updated] = await db.update(paymentsTable)
    .set({
      status,
      note: note ?? null,
      verifiedAt: status === "verified" ? new Date() : null,
    })
    .where(eq(paymentsTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "ไม่พบการชำระเงิน" }); return; }

  if (status === "verified") {
    await db.update(ordersTable)
      .set({ status: "processing" })
      .where(eq(ordersTable.id, updated.orderId));
  }

  res.json({
    ...updated,
    amount: updated.amount != null ? Number(updated.amount) : null,
    createdAt: updated.createdAt.toISOString(),
    verifiedAt: updated.verifiedAt?.toISOString() ?? null,
    username: null,
  });
});

export default router;
