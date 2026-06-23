import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, booksTable, activityLogsTable, siteSettingsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAdmin, logActivity, type AdminRequest } from "../middleware/adminAuth";
import { UpdateSiteSettingsBody, UpdateStockBody } from "@workspace/api-zod";
import { getClientIp } from "../lib/helpers";

const router = Router();

// ── Settings helpers ─────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  whatsappNumber: "+201029757694",
  whatsappEnabled: "true",
  ownerMessageTemplate:
    "🕯️ طلب جديد من مكتبة ALESLAM\n\nرقم الطلب: {orderId}\nالعميل: {customerName}\nالهاتف: {phone}\nواتساب: {whatsapp}\nالعنوان: {address}\n\nالكتب:\n{items}\n\nالإجمالي: {total} ج.م\nالتاريخ: {date}\nملاحظات: {notes}",
  customerMessageTemplate:
    "🕯️ شكراً لطلبك من مكتبة ALESLAM!\n\nرقم طلبك: {orderId}\nالإجمالي: {total} ج.م\n\nسيتم التواصل معك قريباً لتأكيد الطلب.\n📚 نتمنى لك قراءة ممتعة!",
  heroTitle: "مكتبة ALESLAM للروايات الفاخرة",
  heroSubtitle: "وجهتك الأولى لأفضل الروايات المترجمة والعربية",
  lowStockThreshold: "5",
} as const;

type SettingsKey = keyof typeof DEFAULT_SETTINGS;

interface SiteSettingsResponse {
  whatsappNumber: string;
  whatsappEnabled: boolean;
  ownerMessageTemplate: string;
  customerMessageTemplate: string;
  heroTitle: string;
  heroSubtitle: string;
  lowStockThreshold: number;
}

async function loadSettingsMap(): Promise<Map<string, string>> {
  const rows = await db.select().from(siteSettingsTable);
  return new Map(rows.map((r) => [r.key, r.value]));
}

function serializeSettings(map: Map<string, string>): SiteSettingsResponse {
  const get = (key: SettingsKey) => map.get(key) ?? DEFAULT_SETTINGS[key];
  return {
    whatsappNumber: get("whatsappNumber"),
    whatsappEnabled: get("whatsappEnabled") === "true",
    ownerMessageTemplate: get("ownerMessageTemplate"),
    customerMessageTemplate: get("customerMessageTemplate"),
    heroTitle: get("heroTitle"),
    heroSubtitle: get("heroSubtitle"),
    lowStockThreshold: Number(get("lowStockThreshold")),
  };
}

async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(siteSettingsTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value, updatedAt: new Date() } });
}

async function getLowStockThreshold(): Promise<number> {
  const map = await loadSettingsMap();
  return Number(map.get("lowStockThreshold") ?? DEFAULT_SETTINGS.lowStockThreshold);
}

function bookStockStatus(stock: number, threshold: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (stock === 0) return "out_of_stock";
  if (stock <= threshold) return "low_stock";
  return "in_stock";
}

// ── GET /admin/customers ─────────────────────────────────────────────────────
router.get("/admin/customers", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const { search } = req.query as { search?: string };

    const customers = await db
      .select({
        phone: ordersTable.phone,
        customerName: ordersTable.customerName,
        whatsapp: ordersTable.whatsapp,
        governorate: ordersTable.governorate,
        orderCount: sql<number>`count(*)`,
        totalSpending: sql<number>`sum(${ordersTable.totalPrice}::numeric)`,
        lastOrderDate: sql<Date>`max(${ordersTable.createdAt})`,
      })
      .from(ordersTable)
      .groupBy(
        ordersTable.phone,
        ordersTable.customerName,
        ordersTable.whatsapp,
        ordersTable.governorate,
      )
      .orderBy(desc(sql`max(${ordersTable.createdAt})`));

    let result = customers.map((c) => ({
      phone: c.phone,
      customerName: c.customerName,
      whatsapp: c.whatsapp ?? null,
      governorate: c.governorate ?? null,
      orderCount: Number(c.orderCount),
      totalSpending: Number(c.totalSpending),
      lastOrderDate: new Date(c.lastOrderDate).toISOString(),
    }));

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) || c.phone.includes(q),
      );
    }

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list customers");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /admin/analytics ─────────────────────────────────────────────────────
router.get("/admin/analytics", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const period = (req.query.period as string) || "30d";
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalRevenueResult, totalOrdersResult, dailySales, topBooks, categoryRevenue] =
      await Promise.all([
        db
          .select({ total: sql<number>`coalesce(sum(total_price::numeric), 0)` })
          .from(ordersTable),
        db.select({ count: sql<number>`count(*)` }).from(ordersTable),
        db
          .select({
            date: sql<string>`date(${ordersTable.createdAt})`,
            revenue: sql<number>`sum(${ordersTable.totalPrice}::numeric)`,
            orders: sql<number>`count(*)`,
          })
          .from(ordersTable)
          .where(sql`${ordersTable.createdAt} >= ${since}`)
          .groupBy(sql`date(${ordersTable.createdAt})`)
          .orderBy(sql`date(${ordersTable.createdAt})`),
        db
          .select({
            bookId: orderItemsTable.bookId,
            titleAr: orderItemsTable.bookTitleAr,
            coverImage: orderItemsTable.bookCover,
            soldCount: sql<number>`sum(${orderItemsTable.quantity})`,
            revenue: sql<number>`sum(${orderItemsTable.quantity} * ${orderItemsTable.price}::numeric)`,
          })
          .from(orderItemsTable)
          .groupBy(
            orderItemsTable.bookId,
            orderItemsTable.bookTitleAr,
            orderItemsTable.bookCover,
          )
          .orderBy(desc(sql`sum(${orderItemsTable.quantity})`))
          .limit(10),
        db
          .select({
            category: booksTable.category,
            revenue: sql<number>`sum(${orderItemsTable.quantity} * ${orderItemsTable.price}::numeric)`,
            orders: sql<number>`count(distinct ${orderItemsTable.orderId})`,
          })
          .from(orderItemsTable)
          .leftJoin(booksTable, eq(orderItemsTable.bookId, booksTable.id))
          .groupBy(booksTable.category),
      ]);

    res.json({
      totalRevenue: Number(totalRevenueResult[0].total),
      totalOrders: Number(totalOrdersResult[0].count),
      dailySales: dailySales.map((d) => ({
        date: d.date,
        revenue: Number(d.revenue),
        orders: Number(d.orders),
      })),
      topBooks: topBooks.map((b) => ({
        bookId: b.bookId,
        titleAr: b.titleAr,
        coverImage: b.coverImage ?? null,
        soldCount: Number(b.soldCount),
        revenue: Number(b.revenue),
      })),
      categoryRevenue: categoryRevenue
        .filter((c) => c.category)
        .map((c) => ({
          category: c.category!,
          revenue: Number(c.revenue),
          orders: Number(c.orders),
        })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get analytics");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /admin/settings ──────────────────────────────────────────────────────
router.get("/admin/settings", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const map = await loadSettingsMap();
    res.json(serializeSettings(map));
  } catch (err) {
    req.log.error({ err }, "Failed to get settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PATCH /admin/settings ────────────────────────────────────────────────────
router.patch("/admin/settings", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const body = UpdateSiteSettingsBody.parse(req.body);

    const updates: [string, string][] = [];
    if (body.whatsappNumber !== undefined) updates.push(["whatsappNumber", body.whatsappNumber]);
    if (body.whatsappEnabled !== undefined) updates.push(["whatsappEnabled", String(body.whatsappEnabled)]);
    if (body.ownerMessageTemplate !== undefined) updates.push(["ownerMessageTemplate", body.ownerMessageTemplate]);
    if (body.customerMessageTemplate !== undefined) updates.push(["customerMessageTemplate", body.customerMessageTemplate]);
    if (body.heroTitle !== undefined) updates.push(["heroTitle", body.heroTitle]);
    if (body.heroSubtitle !== undefined) updates.push(["heroSubtitle", body.heroSubtitle]);
    if (body.lowStockThreshold !== undefined) updates.push(["lowStockThreshold", String(body.lowStockThreshold)]);

    // Write all settings in parallel
    await Promise.all(updates.map(([key, value]) => setSetting(key, value)));

    await logActivity(
      req.admin!.id,
      req.admin!.name,
      "UPDATE_SETTINGS",
      `تحديث الإعدادات: ${updates.map(([k]) => k).join(", ")}`,
      getClientIp(req),
    );

    const map = await loadSettingsMap();
    res.json(serializeSettings(map));
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    res.status(400).json({ error: "Bad request" });
  }
});

// ── GET /admin/logs ──────────────────────────────────────────────────────────
router.get("/admin/logs", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 100), 500);
    const offset = Math.max(Number(req.query.offset ?? 0), 0);

    const logs = await db
      .select()
      .from(activityLogsTable)
      .orderBy(desc(activityLogsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(
      logs.map((l) => ({
        id: l.id,
        adminName: l.adminName,
        action: l.action,
        details: l.details,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get activity logs");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /admin/inventory ─────────────────────────────────────────────────────
router.get("/admin/inventory", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const [threshold, books] = await Promise.all([
      getLowStockThreshold(),
      db.select().from(booksTable).orderBy(booksTable.stock),
    ]);

    res.json(
      books.map((b) => ({
        id: b.id,
        titleAr: b.titleAr,
        coverImage: b.coverImage ?? null,
        category: b.category,
        stock: b.stock,
        soldCount: b.soldCount,
        price: Number(b.price),
        status: bookStockStatus(b.stock, threshold),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get inventory");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PATCH /admin/inventory ───────────────────────────────────────────────────
router.patch("/admin/inventory", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const body = UpdateStockBody.parse(req.body);

    const [[book], threshold] = await Promise.all([
      db
        .update(booksTable)
        .set({ stock: body.stock })
        .where(eq(booksTable.id, body.bookId))
        .returning(),
      getLowStockThreshold(),
    ]);

    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }

    await logActivity(
      req.admin!.id,
      req.admin!.name,
      "UPDATE_STOCK",
      `تحديث مخزون "${book.titleAr}" إلى ${body.stock}`,
      getClientIp(req),
    );

    res.json({
      id: book.id,
      titleAr: book.titleAr,
      coverImage: book.coverImage ?? null,
      category: book.category,
      stock: book.stock,
      soldCount: book.soldCount,
      price: Number(book.price),
      status: bookStockStatus(book.stock, threshold),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update stock");
    res.status(400).json({ error: "Bad request" });
  }
});

export default router;
