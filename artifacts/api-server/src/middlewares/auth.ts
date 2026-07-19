import type { Request, Response, NextFunction } from "express";
import { eq, gt } from "drizzle-orm";
import { db, sessionsTable, usersTable } from "@workspace/db";

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
  username?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const session = await db
    .select({ userId: sessionsTable.userId, expiresAt: sessionsTable.expiresAt })
    .from(sessionsTable)
    .where(eq(sessionsTable.token, token))
    .limit(1);

  if (!session.length || session[0].expiresAt < new Date()) {
    res.status(401).json({ error: "Session expired or invalid" });
    return;
  }

  const user = await db
    .select({ id: usersTable.id, role: usersTable.role, username: usersTable.username })
    .from(usersTable)
    .where(eq(usersTable.id, session[0].userId))
    .limit(1);

  if (!user.length) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  req.userId = user[0].id;
  req.userRole = user[0].role;
  req.username = user[0].username;
  next();
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, async () => {
    if (req.userRole !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  });
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }
  const token = authHeader.slice(7);
  try {
    const session = await db
      .select({ userId: sessionsTable.userId })
      .from(sessionsTable)
      .where(eq(sessionsTable.token, token))
      .limit(1);
    if (session.length) {
      const user = await db
        .select({ id: usersTable.id, role: usersTable.role, username: usersTable.username })
        .from(usersTable)
        .where(eq(usersTable.id, session[0].userId))
        .limit(1);
      if (user.length) {
        req.userId = user[0].id;
        req.userRole = user[0].role;
        req.username = user[0].username;
      }
    }
  } catch {
    // ignore
  }
  next();
}
