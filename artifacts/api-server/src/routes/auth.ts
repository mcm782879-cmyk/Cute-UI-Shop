import { Router } from "express";
import { eq, or } from "drizzle-orm";
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

function userResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    discordId: user.discordId,
    discordAvatar: user.discordAvatar,
    createdAt: user.createdAt,
  };
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
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: user.id, token, expiresAt });

  res.status(201).json({ user: userResponse(user), token });
});

// POST /auth/login
router.post("/auth/login", async (req: AuthRequest, res): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
    return;
  }

  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD_HASH ?? "RinMC123";

  if (username === adminUsername && password === adminPassword) {
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
    res.json({ user: userResponse(adminUser[0]), token });
    return;
  }

  const users = await db.select().from(usersTable)
    .where(eq(usersTable.username, username)).limit(1);
  if (!users.length) {
    res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    return;
  }
  // Discord-only accounts have no password
  if (!users[0].passwordHash) {
    res.status(401).json({ error: "บัญชีนี้ใช้การเข้าสู่ระบบผ่าน Discord กรุณาใช้ปุ่ม 'เข้าสู่ระบบด้วย Discord'" });
    return;
  }
  if (users[0].passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    return;
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: users[0].id, token, expiresAt });
  res.json({ user: userResponse(users[0]), token });
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
  res.json(userResponse(user[0]));
});

// ─── Discord OAuth2 ───────────────────────────────────────────────────────────

function getBaseUrl(): string {
  const domain = process.env.REPLIT_DEV_DOMAIN;
  if (domain) return `https://${domain}`;
  return "http://localhost:3000";
}

// GET /auth/discord  →  redirect to Discord OAuth consent screen
router.get("/auth/discord", (_req, res): void => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    res.status(500).send("Discord OAuth ยังไม่ได้ตั้งค่า (DISCORD_CLIENT_ID)");
    return;
  }

  const redirectUri = encodeURIComponent(`${getBaseUrl()}/api/auth/discord/callback`);
  const scope = encodeURIComponent("identify email");
  const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  res.redirect(url);
});

// GET /auth/discord/callback  →  exchange code, find-or-create user, redirect with token
router.get("/auth/discord/callback", async (req, res): Promise<void> => {
  const { code, error } = req.query as Record<string, string>;

  if (error || !code) {
    res.redirect(`${getBaseUrl()}/login?error=discord_denied`);
    return;
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.status(500).send("Discord OAuth ยังไม่ได้ตั้งค่า");
    return;
  }

  try {
    // 1. Exchange code for access token
    const redirectUri = `${getBaseUrl()}/api/auth/discord/callback`;
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      console.error("Discord token exchange failed:", await tokenRes.text());
      res.redirect(`${getBaseUrl()}/login?error=discord_token`);
      return;
    }

    const tokenData = await tokenRes.json() as { access_token: string };

    // 2. Fetch Discord user info
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      res.redirect(`${getBaseUrl()}/login?error=discord_user`);
      return;
    }

    const discordUser = await userRes.json() as {
      id: string;
      username: string;
      global_name?: string;
      email?: string;
      avatar?: string;
    };

    const discordId = discordUser.id;
    const discordAvatar = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordId}/${discordUser.avatar}.png`
      : null;
    const discordEmail = discordUser.email ?? null;
    const discordUsername = discordUser.global_name ?? discordUser.username;

    // 3. Find existing user — by discordId first, then by email (account linking)
    let user: typeof usersTable.$inferSelect | undefined;

    const byDiscordId = await db.select().from(usersTable)
      .where(eq(usersTable.discordId, discordId)).limit(1);

    if (byDiscordId.length) {
      // Update avatar in case it changed
      const [updated] = await db.update(usersTable)
        .set({ discordAvatar })
        .where(eq(usersTable.id, byDiscordId[0].id))
        .returning();
      user = updated;
    } else if (discordEmail) {
      // Try to link with existing account by email
      const byEmail = await db.select().from(usersTable)
        .where(eq(usersTable.email, discordEmail)).limit(1);

      if (byEmail.length) {
        const [updated] = await db.update(usersTable)
          .set({ discordId, discordAvatar })
          .where(eq(usersTable.id, byEmail[0].id))
          .returning();
        user = updated;
      }
    }

    // 4. Create new user if none found
    if (!user) {
      // Generate unique username if discord username already taken
      let username = discordUsername.replace(/[^a-zA-Z0-9_ก-ฮ]/g, "_").slice(0, 30);
      const existingUsername = await db.select().from(usersTable)
        .where(eq(usersTable.username, username)).limit(1);
      if (existingUsername.length) {
        username = `${username}_${discordId.slice(-4)}`;
      }

      const email = discordEmail ?? `discord_${discordId}@discord.local`;

      const [created] = await db.insert(usersTable).values({
        username,
        email,
        passwordHash: null, // Discord-only — no password
        role: "user",
        discordId,
        discordAvatar,
      }).returning();
      user = created;
    }

    // 5. Create session & redirect to frontend with token in URL param
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(sessionsTable).values({ userId: user.id, token, expiresAt });

    res.redirect(`${getBaseUrl()}/?discord_token=${token}`);
  } catch (err) {
    console.error("Discord OAuth error:", err);
    res.redirect(`${getBaseUrl()}/login?error=discord_error`);
  }
});

export default router;
