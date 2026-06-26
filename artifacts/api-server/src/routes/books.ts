import { Router } from "express";
import { db } from "@workspace/db";
import { booksTable } from "@workspace/db";
import { eq, ilike, and, gte, lte, or, desc, sql } from "drizzle-orm";
import {
  ListBooksQueryParams,
  CreateBookBody,
  UpdateBookParams,
  UpdateBookBody,
  DeleteBookParams,
  GetBookParams,
} from "@workspace/api-zod";
import { requireAdmin, type AdminRequest } from "../middleware/adminAuth";

const router = Router();

// GET /books — public
router.get("/books", async (req, res) => {
  try {
    const query = ListBooksQueryParams.parse(req.query);
    const conditions = [];

    if (query.category) conditions.push(eq(booksTable.category, query.category as any));
    if (query.search) {
      conditions.push(
        or(
          ilike(booksTable.title, `%${query.search}%`),
          ilike(booksTable.titleAr, `%${query.search}%`),
          ilike(booksTable.author, `%${query.search}%`),
          ilike(booksTable.authorAr, `%${query.search}%`)
        )!
      );
    }
    if (query.featured === true || query.featured === "true" as any) conditions.push(eq(booksTable.isFeatured, true));
    if (query.bestSeller === true || query.bestSeller === "true" as any) conditions.push(eq(booksTable.isBestSeller, true));
    if (query.newArrival === true || query.newArrival === "true" as any) conditions.push(eq(booksTable.isNewArrival, true));
    if (query.onSale === true || query.onSale === "true" as any) conditions.push(eq(booksTable.isOnSale, true));
    if (query.minPrice !== undefined) conditions.push(gte(sql`${booksTable.price}::numeric`, query.minPrice));
    if (query.maxPrice !== undefined) conditions.push(lte(sql`${booksTable.price}::numeric`, query.maxPrice));
    if (query.inStock === true || query.inStock === "true" as any) conditions.push(gte(booksTable.stock, 1));

    const limit = Number(query.limit ?? 50);
    const offset = Number(query.offset ?? 0);

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [books, countResult] = await Promise.all([
      db
        .select()
        .from(booksTable)
        .where(where)
        .orderBy(desc(booksTable.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(booksTable)
        .where(where),
    ]);

    const mappedBooks = books.map(mapBook);
    res.json({ books: mappedBooks, total: Number(countResult[0].count) });
  } catch (err) {
    req.log.error({ err }, "Failed to list books");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /books/featured — public
router.get("/books/featured", async (req, res) => {
  try {
    const books = await db
      .select()
      .from(booksTable)
      .where(eq(booksTable.isFeatured, true))
      .orderBy(desc(booksTable.createdAt))
      .limit(12);
    res.json(books.map(mapBook));
  } catch (err) {
    req.log.error({ err }, "Failed to get featured books");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /books/best-sellers — public
router.get("/books/best-sellers", async (req, res) => {
  try {
    const books = await db
      .select()
      .from(booksTable)
      .where(eq(booksTable.isBestSeller, true))
      .orderBy(desc(booksTable.soldCount))
      .limit(12);
    res.json(books.map(mapBook));
  } catch (err) {
    req.log.error({ err }, "Failed to get best sellers");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /books/new-arrivals — public
router.get("/books/new-arrivals", async (req, res) => {
  try {
    const books = await db
      .select()
      .from(booksTable)
      .where(eq(booksTable.isNewArrival, true))
      .orderBy(desc(booksTable.createdAt))
      .limit(12);
    res.json(books.map(mapBook));
  } catch (err) {
    req.log.error({ err }, "Failed to get new arrivals");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /books/on-sale — public
router.get("/books/on-sale", async (req, res) => {
  try {
    const books = await db
      .select()
      .from(booksTable)
      .where(eq(booksTable.isOnSale, true))
      .orderBy(desc(booksTable.createdAt))
      .limit(12);
    res.json(books.map(mapBook));
  } catch (err) {
    req.log.error({ err }, "Failed to get books on sale");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /books/:id — public
router.get("/books/:id", async (req, res) => {
  try {
    const { id } = GetBookParams.parse({ id: Number(req.params.id) });
    const [book] = await db.select().from(booksTable).where(eq(booksTable.id, id));
    if (!book) { res.status(404).json({ error: "Not found" }); return; }
    res.json(mapBook(book));
  } catch (err) {
    req.log.error({ err }, "Failed to get book");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /books — admin only
router.post("/books", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const body = CreateBookBody.parse(req.body);
    const [book] = await db
      .insert(booksTable)
      .values({
        ...body,
        price: String(body.price),
        originalPrice: body.originalPrice != null ? String(body.originalPrice) : null,
        rating: null,
        reviewCount: 0,
        soldCount: 0,
      })
      .returning();
    res.status(201).json(mapBook(book));
  } catch (err) {
    req.log.error({ err }, "Failed to create book");
    res.status(400).json({ error: "Bad request" });
  }
});

// PATCH /books/:id — admin only
router.patch("/books/:id", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const { id } = UpdateBookParams.parse({ id: Number(req.params.id) });
    const body = UpdateBookBody.parse(req.body);

    const updateData: Record<string, any> = { ...body };
    if (body.price !== undefined) updateData.price = String(body.price);
    if (body.originalPrice !== undefined) updateData.originalPrice = body.originalPrice != null ? String(body.originalPrice) : null;

    const [book] = await db
      .update(booksTable)
      .set(updateData)
      .where(eq(booksTable.id, id))
      .returning();

    if (!book) { res.status(404).json({ error: "Not found" }); return; }
    res.json(mapBook(book));
  } catch (err) {
    req.log.error({ err }, "Failed to update book");
    res.status(400).json({ error: "Bad request" });
  }
});

// DELETE /books/:id — admin only
router.delete("/books/:id", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const { id } = DeleteBookParams.parse({ id: Number(req.params.id) });
    const [deleted] = await db.delete(booksTable).where(eq(booksTable.id, id)).returning();
    if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete book");
    res.status(500).json({ error: "Internal server error" });
  }
});

function mapBook(book: typeof booksTable.$inferSelect) {
  return {
    id: book.id,
    title: book.title,
    titleAr: book.titleAr,
    author: book.author,
    authorAr: book.authorAr,
    description: book.description ?? null,
    descriptionAr: book.descriptionAr ?? null,
    coverImage: book.coverImage ?? null,
    price: Number(book.price),
    originalPrice: book.originalPrice != null ? Number(book.originalPrice) : null,
    category: book.category,
    stock: book.stock,
    isFeatured: book.isFeatured,
    isBestSeller: book.isBestSeller,
    isNewArrival: book.isNewArrival,
    isOnSale: book.isOnSale,
    rating: book.rating != null ? Number(book.rating) : null,
    reviewCount: book.reviewCount,
    soldCount: book.soldCount,
    createdAt: book.createdAt.toISOString(),
  };
}

export default router;
