import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, booksTable } from "@workspace/db";
import { eq, desc, inArray } from "drizzle-orm";
import {
  CreateOrderBody,
  ListOrdersQueryParams,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  TrackOrderQueryParams,
} from "@workspace/api-zod";
import { sql } from "drizzle-orm";

const router = Router();

function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ALS-${timestamp}-${random}`;
}

function mapOrder(
  order: typeof ordersTable.$inferSelect,
  items: Array<typeof orderItemsTable.$inferSelect>,
) {
  return {
    id: order.id,
    orderId: order.orderId,
    customerName: order.customerName,
    phone: order.phone,
    whatsapp: order.whatsapp ?? null,
    governorate: order.governorate,
    city: order.city,
    address: order.address,
    landmark: order.landmark ?? null,
    notes: order.notes ?? null,
    items: items.map((item) => ({
      id: item.id,
      bookId: item.bookId,
      bookTitle: item.bookTitle,
      bookTitleAr: item.bookTitleAr,
      bookCover: item.bookCover ?? null,
      quantity: item.quantity,
      price: Number(item.price),
    })),
    totalPrice: Number(order.totalPrice),
    status: order.status,
    whatsappSent: order.whatsappSent,
    createdAt: order.createdAt.toISOString(),
  };
}

// GET /orders/track
router.get("/orders/track", async (req, res) => {
  try {
    const params = TrackOrderQueryParams.parse(req.query);
    if (!params.orderId && !params.phone) {
      res.status(400).json({ error: "orderId or phone required" });
      return;
    }

    const [order] = params.orderId
      ? await db.select().from(ordersTable).where(eq(ordersTable.orderId, params.orderId))
      : await db.select().from(ordersTable).where(eq(ordersTable.phone, params.phone!));

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.orderId));

    res.json(mapOrder(order, items));
  } catch (err) {
    req.log.error({ err }, "Failed to track order");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /orders
router.get("/orders", async (req, res) => {
  try {
    const query = ListOrdersQueryParams.parse(req.query);
    const where = query.status ? eq(ordersTable.status, query.status as any) : undefined;

    const orders = await db
      .select()
      .from(ordersTable)
      .where(where)
      .orderBy(desc(ordersTable.createdAt));

    // Fetch items for exactly these orders — avoids loading the entire table
    const orderIds = orders.map((o) => o.orderId);
    const allItems =
      orderIds.length > 0
        ? await db
            .select()
            .from(orderItemsTable)
            .where(inArray(orderItemsTable.orderId, orderIds))
        : [];

    const itemsByOrderId = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const bucket = itemsByOrderId.get(item.orderId) ?? [];
      bucket.push(item);
      itemsByOrderId.set(item.orderId, bucket);
    }

    res.json(orders.map((o) => mapOrder(o, itemsByOrderId.get(o.orderId) ?? [])));
  } catch (err) {
    req.log.error({ err }, "Failed to list orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /orders
router.post("/orders", async (req, res) => {
  try {
    const body = CreateOrderBody.parse(req.body);

    // ── Batch-fetch all required books in ONE query ──────────────────────────
    const bookIds = [...new Set(body.items.map((i) => i.bookId))];
    const books = await db
      .select()
      .from(booksTable)
      .where(inArray(booksTable.id, bookIds));
    const bookMap = new Map(books.map((b) => [b.id, b]));

    // ── Validate availability & build resolved line items ────────────────────
    let totalPrice = 0;
    const resolvedItems: Array<{
      bookId: number;
      bookTitle: string;
      bookTitleAr: string;
      bookCover: string | null;
      quantity: number;
      price: number;
    }> = [];

    for (const item of body.items) {
      const book = bookMap.get(item.bookId);
      if (!book) {
        res.status(400).json({ error: `Book ${item.bookId} not found` });
        return;
      }
      if (book.stock < item.quantity) {
        res.status(400).json({ error: `Insufficient stock for book: ${book.titleAr}` });
        return;
      }
      const price = Number(book.price);
      totalPrice += price * item.quantity;
      resolvedItems.push({
        bookId: book.id,
        bookTitle: book.title,
        bookTitleAr: book.titleAr,
        bookCover: book.coverImage,
        quantity: item.quantity,
        price,
      });
    }

    const orderId = generateOrderId();

    // ── Persist order + items ────────────────────────────────────────────────
    const [order] = await db
      .insert(ordersTable)
      .values({
        orderId,
        customerName: body.customerName,
        phone: body.phone,
        whatsapp: body.whatsapp ?? null,
        governorate: body.governorate,
        city: body.city,
        address: body.address,
        landmark: body.landmark ?? null,
        notes: body.notes ?? null,
        totalPrice: String(totalPrice),
        status: "new",
        whatsappSent: false,
      })
      .returning();

    await db.insert(orderItemsTable).values(
      resolvedItems.map((item) => ({
        orderId,
        bookId: item.bookId,
        bookTitle: item.bookTitle,
        bookTitleAr: item.bookTitleAr,
        bookCover: item.bookCover,
        quantity: item.quantity,
        price: String(item.price),
      })),
    );

    // ── Decrement stock in parallel ──────────────────────────────────────────
    await Promise.all(
      resolvedItems.map((item) =>
        db
          .update(booksTable)
          .set({
            stock: sql`${booksTable.stock} - ${item.quantity}`,
            soldCount: sql`${booksTable.soldCount} + ${item.quantity}`,
          })
          .where(eq(booksTable.id, item.bookId)),
      ),
    );

    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, orderId));

    res.status(201).json(mapOrder(order, items));
  } catch (err) {
    req.log.error({ err }, "Failed to create order");
    res.status(400).json({ error: "Bad request" });
  }
});

// GET /orders/:id
router.get("/orders/:id", async (req, res) => {
  try {
    const { id } = GetOrderParams.parse({ id: Number(req.params.id) });
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!order) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.orderId));

    res.json(mapOrder(order, items));
  } catch (err) {
    req.log.error({ err }, "Failed to get order");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /orders/:id
router.patch("/orders/:id", async (req, res) => {
  try {
    const { id } = UpdateOrderStatusParams.parse({ id: Number(req.params.id) });
    const body = UpdateOrderStatusBody.parse(req.body);

    const [order] = await db
      .update(ordersTable)
      .set({ status: body.status as any })
      .where(eq(ordersTable.id, id))
      .returning();

    if (!order) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.orderId));

    res.json(mapOrder(order, items));
  } catch (err) {
    req.log.error({ err }, "Failed to update order status");
    res.status(400).json({ error: "Bad request" });
  }
});

export default router;
