import { Router } from "express";
import { db } from "@workspace/db";
import { booksTable, ordersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin, type AdminRequest } from "../middleware/adminAuth";

const router = Router();

// GET /stats/store — admin only
router.get("/stats/store", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const [
      totalBooksResult,
      totalOrdersResult,
      newOrdersResult,
      totalRevenueResult,
      categoryResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(booksTable),
      db.select({ count: sql<number>`count(*)` }).from(ordersTable),
      db
        .select({ count: sql<number>`count(*)` })
        .from(ordersTable)
        .where(eq(ordersTable.status, "new")),
      db
        .select({ total: sql<number>`coalesce(sum(total_price::numeric), 0)` })
        .from(ordersTable),
      db
        .select({
          category: booksTable.category,
          count: sql<number>`count(*)`,
        })
        .from(booksTable)
        .groupBy(booksTable.category),
    ]);

    res.json({
      totalBooks: Number(totalBooksResult[0].count),
      totalOrders: Number(totalOrdersResult[0].count),
      newOrders: Number(newOrdersResult[0].count),
      totalRevenue: Number(totalRevenueResult[0].total),
      categoryBreakdown: categoryResult.map((r) => ({
        category: r.category,
        count: Number(r.count),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get store stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
