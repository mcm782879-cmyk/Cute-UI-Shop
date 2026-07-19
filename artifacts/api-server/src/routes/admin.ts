import { Router } from "express";
import { eq, count, sum, desc } from "drizzle-orm";
import { db, ordersTable, usersTable, packagesTable } from "@workspace/db";
import { requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();

// GET /admin/dashboard
router.get("/admin/dashboard", requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const [totalOrdersRow] = await db.select({ count: count() }).from(ordersTable);
  const [pendingOrdersRow] = await db.select({ count: count() }).from(ordersTable)
    .where(eq(ordersTable.status, "pending"));
  const [completedOrdersRow] = await db.select({ count: count() }).from(ordersTable)
    .where(eq(ordersTable.status, "completed"));
  const [revenueRow] = await db.select({ total: sum(ordersTable.totalPrice) }).from(ordersTable)
    .where(eq(ordersTable.status, "completed"));
  const [totalUsersRow] = await db.select({ count: count() }).from(usersTable)
    .where(eq(usersTable.role, "user"));

  const recentOrders = await db.select({
    order: ordersTable,
    user: usersTable,
    package: packagesTable,
  }).from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .leftJoin(packagesTable, eq(ordersTable.packageId, packagesTable.id))
    .orderBy(desc(ordersTable.createdAt))
    .limit(10);

  res.json({
    totalOrders: totalOrdersRow.count,
    pendingOrders: pendingOrdersRow.count,
    completedOrders: completedOrdersRow.count,
    totalRevenue: Number(revenueRow.total ?? 0),
    totalUsers: totalUsersRow.count,
    recentOrders: recentOrders.map(r => ({
      ...r.order,
      totalPrice: Number(r.order.totalPrice),
      createdAt: r.order.createdAt.toISOString(),
      user: r.user ? {
        id: r.user.id, username: r.user.username, email: r.user.email,
        role: r.user.role, createdAt: r.user.createdAt.toISOString(),
      } : undefined,
      package: r.package ? {
        ...r.package, price: Number(r.package.price),
        createdAt: r.package.createdAt.toISOString(),
      } : undefined,
    })),
  });
});

export default router;
