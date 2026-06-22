import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, booksTable, activityLogsTable, siteSettingsTable } from "@workspace/db";
import { eq, desc, sql, ilike, or } from "drizzle-orm";
import { requireAdmin, logActivity, type AdminRequest } from "../middleware/adminAuth";
import { UpdateSiteSettingsBody, UpdateStockBody } from "@workspace/api-zod";

const router = Router();

const DEFAULT_SETTINGS = {
  whatsappNumber: "+201029757694",
  whatsappEnabled: "true",
  ownerMessageTemplate: "🕯️ طلب جديد من مكتبة ALESLAM\n\nرقم الطلب: {orderId}\nالعميل: {customerName}\nالهاتف: {phone}\nواتساب: {whatsapp}\nالعنوان: {address}\n\nالكتب:\n{items}\n\nالإجمالي: {total} ج.م\nالتاريخ: {date}\nملاحظات: {notes}",
  customerMessageTemplate: "🕯️ شكراً لطلبك من مكتبة ALESLAM!\n\nرقم طلبك: {orderId}\nالإجمالي: {total} ج.م\n\nسيتم التواصل معك قريباً لتأكيد الطلب.\n📚 نتمنى لك قراءة ممتعة!",
  heroTitle: "مكتبة ALESLAM للروايات الفاخرة",
  heroSubtitle: "وجهتك الأولى لأفضل الروايات المترجمة والعربية",
  lowStockThreshold: "5",
};

async function getSetting(key: string): Promise<string> {
  const [row] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key));
  return row?.value ?? DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS] ?? "";
}

async function setSetting(key: string, value: string) {
  await db
    .insert(siteSettingsTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value, updatedAt: new Date() } });
}

// GET /admin/customers
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
      .groupBy(ordersTable.phone, ordersTable.customerName, ordersTable.whatsapp, ordersTable.governorate)
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
          c.customerName.toLowerCase().includes(q) ||
          c.phone.includes(q)
      );
    }

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list customers");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/analytics
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
          .groupBy(orderItemsTable.bookId, orderItemsTable.bookTitleAr, orderItemsTable.bookCover)
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

// GET /admin/settings
router.get("/admin/settings", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const keys = Object.keys(DEFAULT_SETTINGS);
    const rows = await db.select().from(siteSettingsTable);
    const map = new Map(rows.map((r) => [r.key, r.value]));

    const settings: Record<string, any> = {};
    for (const key of keys) {
      settings[key] = map.get(key) ?? DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS];
    }

    res.json({
      whatsappNumber: settings.whatsappNumber,
      whatsappEnabled: settings.whatsappEnabled === "true",
      ownerMessageTemplate: settings.ownerMessageTemplate,
      customerMessageTemplate: settings.customerMessageTemplate,
      heroTitle: settings.heroTitle,
      heroSubtitle: settings.heroSubtitle,
      lowStockThreshold: Number(settings.lowStockThreshold),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /admin/settings
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

    for (const [key, value] of updates) {
      await setSetting(key, value);
    }

    await logActivity(
      req.admin!.id,
      req.admin!.name,
      "UPDATE_SETTINGS",
      `تحديث الإعدادات: ${updates.map(([k]) => k).join(", ")}`,
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || ""
    );

    // Return updated settings
    const rows = await db.select().from(siteSettingsTable);
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const keys = Object.keys(DEFAULT_SETTINGS);
    const settings: Record<string, any> = {};
    for (const key of keys) {
      settings[key] = map.get(key) ?? DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS];
    }

    res.json({
      whatsappNumber: settings.whatsappNumber,
      whatsappEnabled: settings.whatsappEnabled === "true",
      ownerMessageTemplate: settings.ownerMessageTemplate,
      customerMessageTemplate: settings.customerMessageTemplate,
      heroTitle: settings.heroTitle,
      heroSubtitle: settings.heroSubtitle,
      lowStockThreshold: Number(settings.lowStockThreshold),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    res.status(400).json({ error: "Bad request" });
  }
});

// GET /admin/logs
router.get("/admin/logs", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const limit = Number(req.query.limit ?? 100);
    const offset = Number(req.query.offset ?? 0);

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
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get activity logs");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/inventory
router.get("/admin/inventory", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const threshold = 5;
    const rows = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "lowStockThreshold"));
    const thresholdValue = rows[0] ? Number(rows[0].value) : threshold;

    const books = await db
      .select()
      .from(booksTable)
      .orderBy(booksTable.stock);

    res.json(
      books.map((b) => ({
        id: b.id,
        titleAr: b.titleAr,
        coverImage: b.coverImage ?? null,
        category: b.category,
        stock: b.stock,
        soldCount: b.soldCount,
        price: Number(b.price),
        status:
          b.stock === 0
            ? "out_of_stock"
            : b.stock <= thresholdValue
            ? "low_stock"
            : "in_stock",
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get inventory");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /admin/inventory
router.patch("/admin/inventory", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const body = UpdateStockBody.parse(req.body);
    const [book] = await db
      .update(booksTable)
      .set({ stock: body.stock })
      .where(eq(booksTable.id, body.bookId))
      .returning();

    if (!book) { res.status(404).json({ error: "Book not found" }); return; }

    const threshold = 5;
    await logActivity(
      req.admin!.id,
      req.admin!.name,
      "UPDATE_STOCK",
      `تحديث مخزون "${book.titleAr}" إلى ${body.stock}`,
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || ""
    );

    res.json({
      id: book.id,
      titleAr: book.titleAr,
      coverImage: book.coverImage ?? null,
      category: book.category,
      stock: book.stock,
      soldCount: book.soldCount,
      price: Number(book.price),
      status: book.stock === 0 ? "out_of_stock" : book.stock <= threshold ? "low_stock" : "in_stock",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update stock");
    res.status(400).json({ error: "Bad request" });
  }
});

export default router;
