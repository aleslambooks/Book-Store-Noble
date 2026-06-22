import { Router } from "express";
import { db } from "@workspace/db";
import { booksTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";

const router = Router();

const CATEGORIES = [
  { id: "horror", name: "Horror", nameAr: "رعب" },
  { id: "romance", name: "Romance", nameAr: "رومانسية" },
  { id: "fantasy", name: "Fantasy", nameAr: "فانتازيا" },
  { id: "mystery", name: "Mystery", nameAr: "غموض" },
  { id: "thriller", name: "Thriller", nameAr: "إثارة" },
  { id: "sci-fi", name: "Science Fiction", nameAr: "خيال علمي" },
];

// GET /categories
router.get("/categories", async (req, res) => {
  try {
    const counts = await db
      .select({
        category: booksTable.category,
        count: sql<number>`count(*)`,
      })
      .from(booksTable)
      .groupBy(booksTable.category);

    const countMap = new Map(counts.map((c) => [c.category, Number(c.count)]));

    const categories = CATEGORIES.map((cat) => ({
      id: cat.id,
      name: cat.name,
      nameAr: cat.nameAr,
      bookCount: countMap.get(cat.id as any) ?? 0,
      coverImage: null,
    }));

    res.json(categories);
  } catch (err) {
    req.log.error({ err }, "Failed to list categories");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
