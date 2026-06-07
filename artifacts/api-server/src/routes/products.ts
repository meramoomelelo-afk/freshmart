import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable, siteSettingsTable } from "@workspace/db";
import { eq, ilike, and, count, avg, sql, inArray, notInArray } from "drizzle-orm";

async function getHiddenCategoryIds(): Promise<number[]> {
  try {
    const [s] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "hidden_categories"));
    if (s?.value && Array.isArray(s.value)) return s.value as number[];
  } catch {}
  return [];
}

const router: IRouter = Router();

router.get("/products/summary", async (_req, res): Promise<void> => {
  const [productStats] = await db
    .select({
      totalProducts: count(),
      inStockCount: sql<number>`sum(case when ${productsTable.inStock} = true then 1 else 0 end)::int`,
      avgDiscount: avg(productsTable.discount),
      featuredCount: sql<number>`sum(case when ${productsTable.isFeatured} = true then 1 else 0 end)::int`,
    })
    .from(productsTable);

  const [categoryCount] = await db
    .select({ total: sql<number>`count(distinct ${productsTable.categoryId})::int` })
    .from(productsTable);

  res.json({
    totalProducts: productStats?.totalProducts ?? 0,
    totalCategories: categoryCount?.total ?? 0,
    inStockCount: productStats?.inStockCount ?? 0,
    avgDiscount: Math.round(Number(productStats?.avgDiscount ?? 0)),
    featuredCount: productStats?.featuredCount ?? 0,
  });
});

router.get("/products", async (req, res): Promise<void> => {
  const { categoryId, categorySlug, search, featured, onSale, limit, ids } = req.query as {
    categoryId?: string;
    categorySlug?: string;
    search?: string;
    featured?: string;
    onSale?: string;
    limit?: string;
    ids?: string;
  };

  const hiddenIds = await getHiddenCategoryIds();
  const conditions = [];
  if (hiddenIds.length > 0) {
    conditions.push(notInArray(productsTable.categoryId, hiddenIds));
  }

  if (ids) {
    const idList = ids.split(",").map(Number).filter(n => !isNaN(n) && n > 0);
    if (idList.length > 0) {
      conditions.push(inArray(productsTable.id, idList));
    }
  } else if (categorySlug) {
    const cat = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, categorySlug)).limit(1);
    if (cat.length > 0) {
      conditions.push(eq(productsTable.categoryId, cat[0].id));
    } else {
      conditions.push(eq(productsTable.categoryId, -1));
    }
  } else if (categoryId) {
    conditions.push(eq(productsTable.categoryId, Number(categoryId)));
  }

  if (search) {
    conditions.push(ilike(productsTable.name, `%${search}%`));
  }

  if (featured === "true") {
    conditions.push(eq(productsTable.isFeatured, true));
  }

  if (onSale === "true") {
    conditions.push(sql`${productsTable.discount} > 0`);
  }

  const query = db
    .select()
    .from(productsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(productsTable.id);

  const products = limit ? await query.limit(Number(limit)) : await query;

  res.json(
    products.map((p) => ({
      id: String(p.id),
      name: p.name,
      description: p.description,
      price: Number(p.price),
      originalPrice: Number(p.originalPrice),
      discount: p.discount,
      unit: p.unit,
      quantity: p.quantity,
      categoryId: String(p.categoryId),
      categoryName: p.categoryName,
      imageUrl: p.imageUrl,
      inStock: p.inStock,
      rating: Number(p.rating),
      reviewCount: p.reviewCount,
      isFeatured: p.isFeatured,
      isOrganic: p.isOrganic,
      tags: p.tags,
      deliveryTime: p.deliveryTime,
      variants: p.variants,
      variantPrices: (p.variantPrices as Record<string, number>) || {},
      updatedAt: p.updatedAt.toISOString(),
    }))
  );
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Bad Request", message: "Invalid product id" });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id));

  if (!product) {
    res.status(404).json({ error: "Not Found", message: "Product not found" });
    return;
  }

  res.json({
    id: String(product.id),
    name: product.name,
    description: product.description,
    price: Number(product.price),
    originalPrice: Number(product.originalPrice),
    discount: product.discount,
    unit: product.unit,
    quantity: product.quantity,
    categoryId: String(product.categoryId),
    categoryName: product.categoryName,
    imageUrl: product.imageUrl,
    inStock: product.inStock,
    rating: Number(product.rating),
    reviewCount: product.reviewCount,
    isFeatured: product.isFeatured,
    isOrganic: product.isOrganic,
    tags: product.tags,
    deliveryTime: product.deliveryTime,
    variants: product.variants,
    variantPrices: (product.variantPrices as Record<string, number>) || {},
    updatedAt: product.updatedAt.toISOString(),
  });
});

router.get("/deals", async (_req, res): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .where(sql`${productsTable.discount} > 0`)
    .orderBy(sql`${productsTable.discount} desc`)
    .limit(20);

  res.json(
    products.map((p) => ({
      id: String(p.id),
      name: p.name,
      description: p.description,
      price: Number(p.price),
      originalPrice: Number(p.originalPrice),
      discount: p.discount,
      unit: p.unit,
      quantity: p.quantity,
      categoryId: String(p.categoryId),
      categoryName: p.categoryName,
      imageUrl: p.imageUrl,
      inStock: p.inStock,
      rating: Number(p.rating),
      reviewCount: p.reviewCount,
      isFeatured: p.isFeatured,
      isOrganic: p.isOrganic,
      tags: p.tags,
      deliveryTime: p.deliveryTime,
      variants: p.variants,
      updatedAt: p.updatedAt.toISOString(),
    }))
  );
});

export default router;
