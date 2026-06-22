import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { adminSessionsTable, adminUsersTable, activityLogsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

export interface AdminRequest extends Request {
  admin?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export async function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [session] = await db
      .select()
      .from(adminSessionsTable)
      .where(
        and(
          eq(adminSessionsTable.token, token),
          gt(adminSessionsTable.expiresAt, new Date())
        )
      );

    if (!session) {
      res.status(401).json({ error: "Session expired or invalid" });
      return;
    }

    const [admin] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.id, session.adminId));

    if (!admin || !admin.isActive) {
      res.status(401).json({ error: "Admin account not found or inactive" });
      return;
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };

    next();
  } catch (err) {
    req.log.error({ err }, "Admin auth middleware error");
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function logActivity(
  adminId: number,
  adminName: string,
  action: string,
  details: string,
  ipAddress: string
) {
  await db.insert(activityLogsTable).values({
    adminId,
    adminName,
    action,
    details,
    ipAddress,
  });
}
