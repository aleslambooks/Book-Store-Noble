import { Router } from "express";
import { db } from "@workspace/db";
import { adminUsersTable, adminSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { AdminLoginBody } from "@workspace/api-zod";
import { requireAdmin, logActivity, type AdminRequest } from "../middleware/adminAuth";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /admin/login
router.post("/admin/login", loginLimiter, async (req, res) => {
  try {
    const body = AdminLoginBody.parse(req.body);
    const [admin] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.email, body.email));

    if (!admin || !admin.isActive) {
      res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
      return;
    }

    const valid = await bcrypt.compare(body.password, admin.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
      return;
    }

    const token = crypto.randomBytes(64).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";

    await db.insert(adminSessionsTable).values({
      adminId: admin.id,
      token,
      ipAddress: ip,
      expiresAt,
    });

    await logActivity(admin.id, admin.name, "LOGIN", `تسجيل دخول من ${ip}`, ip);

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        createdAt: admin.createdAt.toISOString(),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Admin login failed");
    res.status(400).json({ error: "Bad request" });
  }
});

// POST /admin/logout
router.post("/admin/logout", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const token = req.headers["authorization"]?.slice(7) ?? "";
    await db.delete(adminSessionsTable).where(eq(adminSessionsTable.token, token));
    await logActivity(req.admin!.id, req.admin!.name, "LOGOUT", "تسجيل خروج", "");
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Admin logout failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/me
router.get("/admin/me", requireAdmin, async (req: AdminRequest, res) => {
  res.json({
    id: req.admin!.id,
    email: req.admin!.email,
    name: req.admin!.name,
    role: req.admin!.role,
    createdAt: new Date().toISOString(),
  });
});

export default router;
