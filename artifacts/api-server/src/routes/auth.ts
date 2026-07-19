import { Router } from "express";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { db, usersTable, sessionsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

function hashPassword(password: string): string {
  const salt = "rin_salt_2025";
  return crypto.createHmac("sha256", salt).update(password).digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// POST /auth/register
router.post("/auth/register", async (req: AuthRequest, res): Promise<void> => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" });
    return;
  }

  const existing = await db.select().from(usersTable)
    .where(eq(usersTable.username, username)).limit(1);
  if (existing.length) {
    res.status(400).json({ error: "ชื่อผู้ใช้นี้มีอยู่แล้ว" });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    username,
    email,
    passwordHash: hashPassword(password),
    role: "user",
  }).returning();

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await db.insert(sessionsTable).values({ userId: user.id, token, expiresAt });

  res.status(201).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    token,
  });
});

// POST /auth/login
router.post("/auth/login", async (req: AuthRequest, res): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
    return;
  }

  // Check admin env credentials
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD_HASH ?? "RinMC123";

  if (username === adminUsername && password === adminPassword) {
    // Find or create admin user
    let adminUser = await db.select().from(usersTable)
      .where(eq(usersTable.username, adminUsername)).limit(1);
    if (!adminUser.length) {
      const [created] = await db.insert(usersTable).values({
        username: adminUsername,
        email: "admin@rinjadhai.com",
        passwordHash: hashPassword(adminPassword),
        role: "admin",
      }).returning();
      adminUser = [created];
    }
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(sessionsTable).values({ userId: adminUser[0].id, token, expiresAt });
    res.json({
      user: {
        id: adminUser[0].id,
        username: adminUser[0].username,
        email: adminUser[0].email,
        role: adminUser[0].role,
        createdAt: adminUser[0].createdAt,
      },
      token,
    });
    return;
  }

  const users = await db.select().from(usersTable)
    .where(eq(usersTable.username, username)).limit(1);
  if (!users.length || users[0].passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    return;
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: users[0].id, token, expiresAt });

  res.json({
    user: {
      id: users[0].id,
      username: users[0].username,
      email: users[0].email,
      role: users[0].role,
      createdAt: users[0].createdAt,
    },
    token,
  });
});

// POST /auth/logout
router.post("/auth/logout", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const token = req.headers.authorization?.slice(7);
  if (token) {
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  }
  res.json({ success: true });
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const user = await db.select().from(usersTable)
    .where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user.length) {
    res.status(401).json({ error: "ไม่พบผู้ใช้" });
    return;
  }
  res.json({
    id: user[0].id,
    username: user[0].username,
    email: user[0].email,
    role: user[0].role,
    createdAt: user[0].createdAt,
  });
});

export default router;
