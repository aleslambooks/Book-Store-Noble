import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, booksTable } from "@workspace/db";
import { eq, desc, sql, and, or } from "drizzle-orm";
import {
  CreateOrderBody,
  ListOrdersQueryParams,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  TrackOrderQueryParams,
} from "@workspace/api-zod";

const router = Router();

function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ALS-${timestamp}-${random}`;
}

// GET /orders/track
router.get("/orders/track", async (req, res) => {
  try {
    const params = TrackOrderQueryParams.parse(req.query);
    if (!params.orderId && !params.phone) {
      res.status(400).json({ error: "orderId or phone required" }); return;
    }

    let order;
    if (params.orderId) {
      [order] = await db.select().from(ordersTable).where(eq(ordersTable.orderId, params.orderId));
    } else if (params.phone) {
      [order] = await db.select().from(ordersTable).where(eq(ordersTable.phone, params.phone!));
    }

    if (!order) { res.status(404).json({ error: "Order not found" }); return; }

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

    const allItems = await db.select().from(orderItemsTable);
    const itemsByOrderId = new Map<string, typeof allItems>();
    for (const item of allItems) {
      if (!itemsByOrderId.has(item.orderId)) itemsByOrderId.set(item.orderId, []);
      itemsByOrderId.get(item.orderId)!.push(item);
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

    // Validate items + calculate total
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
      const [book] = await db.select().from(booksTable).where(eq(booksTable.id, item.bookId));
      if (!book) { res.status(400).json({ error: `Book ${item.bookId} not found` }); return; }
      if (book.stock < item.quantity) {
        res.status(400).json({ error: `Insufficient stock for book: ${book.titleAr}` }); return;
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

    // Insert order items
    await db.insert(orderItemsTable).values(
      resolvedItems.map((item) => ({
        orderId,
        bookId: item.bookId,
        bookTitle: item.bookTitle,
        bookTitleAr: item.bookTitleAr,
        bookCover: item.bookCover,
        quantity: item.quantity,
        price: String(item.price),
      }))
    );

    // Decrement stock
    for (const item of resolvedItems) {
      await db
        .update(booksTable)
        .set({
          stock: sql`${booksTable.stock} - ${item.quantity}`,
          soldCount: sql`${booksTable.soldCount} + ${item.quantity}`,
        })
        .where(eq(booksTable.id, item.bookId));
    }

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
    if (!order) { res.status(404).json({ error: "Not found" }); return; }

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

    if (!order) { res.status(404).json({ error: "Not found" }); return; }

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

function mapOrder(
  order: typeof ordersTable.$inferSelect,
  items: Array<typeof orderItemsTable.$inferSelect>
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

export default router;
