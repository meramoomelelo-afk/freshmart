import { Router, type IRouter } from "express";
import { db, cartItemsTable, productsTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

function parseWeightToGrams(str: string): number | null {
  const s = (str || "").toLowerCase().replace(/\s/g, "");
  const kg = s.match(/^([\d.]+)kg$/);
  if (kg) return parseFloat(kg[1]) * 1000;
  const g = s.match(/^([\d.]+)g$/);
  if (g) return parseFloat(g[1]);
  const l = s.match(/^([\d.]+)l(itre|iter)?$/);
  if (l) return parseFloat(l[1]) * 1000;
  const ml = s.match(/^([\d.]+)ml$/);
  if (ml) return parseFloat(ml[1]);
  return null;
}

async function buildCartResponse(items: { id: string; productId: string; quantity: number; variantLabel?: string | null; addedAt: Date }[]) {
  const DELIVERY_FEE = 25;
  const FREE_DELIVERY_THRESHOLD = 299;

  let subtotal = 0;
  let savings = 0;
  const enrichedItems = [];

  for (const item of items) {
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, Number(item.productId)));

    if (!product) continue;

    const basePrice = Number(product.price);
    const baseOriginalPrice = Number(product.originalPrice);

    let price = basePrice;
    let originalPrice = baseOriginalPrice;

    if (item.variantLabel) {
      const vp = (product.variantPrices as Record<string, number>) || {};
      if (vp[item.variantLabel] !== undefined && Number(vp[item.variantLabel]) > 0) {
        price = Number(vp[item.variantLabel]);
        originalPrice = price;
      } else if (product.quantity) {
        const baseGrams = parseWeightToGrams(product.quantity);
        const variantGrams = parseWeightToGrams(item.variantLabel);
        if (baseGrams && variantGrams && baseGrams > 0) {
          price = Math.round((basePrice * variantGrams) / baseGrams);
          originalPrice = Math.round((baseOriginalPrice * variantGrams) / baseGrams);
        }
      }
    }

    subtotal += price * item.quantity;
    savings += Math.max(0, (originalPrice - price) * item.quantity);

    enrichedItems.push({
      id: item.id,
      productId: item.productId,
      variantLabel: item.variantLabel || null,
      variantPrice: price,
      variantOriginalPrice: originalPrice,
      product: {
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
        updatedAt: product.updatedAt.toISOString(),
      },
      quantity: item.quantity,
    });
  }

  const itemCount = enrichedItems.reduce((sum, i) => sum + i.quantity, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = itemCount > 0 ? subtotal + deliveryFee : 0;

  return {
    items: enrichedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee: itemCount > 0 ? deliveryFee : 0,
    total: Math.round(total * 100) / 100,
    itemCount,
    savings: Math.round(savings * 100) / 100,
  };
}

router.get("/cart", async (_req, res): Promise<void> => {
  const items = await db.select().from(cartItemsTable).orderBy(cartItemsTable.addedAt);

  const orphanedIds: string[] = [];
  for (const item of items) {
    const [product] = await db
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.id, Number(item.productId)));
    if (!product) orphanedIds.push(item.id);
  }
  if (orphanedIds.length > 0) {
    for (const oid of orphanedIds) {
      await db.delete(cartItemsTable).where(eq(cartItemsTable.id, oid));
    }
    const cleanItems = await db.select().from(cartItemsTable).orderBy(cartItemsTable.addedAt);
    const cart = await buildCartResponse(cleanItems);
    res.json(cart);
    return;
  }

  const cart = await buildCartResponse(items);
  res.json(cart);
});

router.post("/cart", async (req, res): Promise<void> => {
  const productId = String(req.body?.productId ?? "").trim();
  const quantity = Number(req.body?.quantity);
  const variantLabel = typeof req.body?.variantLabel === "string" && req.body.variantLabel.trim()
    ? req.body.variantLabel.trim().slice(0, 100)
    : null;

  if (!productId || !Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
    res.status(400).json({ error: "Bad Request", message: "productId and quantity (1-99) are required" });
    return;
  }

  // Look up by (productId + variantLabel) composite key so each variant is a separate row
  const whereClause = variantLabel
    ? and(eq(cartItemsTable.productId, productId), eq(cartItemsTable.variantLabel, variantLabel))
    : and(eq(cartItemsTable.productId, productId), isNull(cartItemsTable.variantLabel));

  const [existing] = await db.select().from(cartItemsTable).where(whereClause);

  if (existing) {
    await db
      .update(cartItemsTable)
      .set({ quantity: existing.quantity + quantity })
      .where(eq(cartItemsTable.id, existing.id));
  } else {
    await db.insert(cartItemsTable).values({
      id: randomUUID(),
      productId,
      quantity,
      variantLabel,
    });
  }

  const items = await db.select().from(cartItemsTable).orderBy(cartItemsTable.addedAt);
  const cart = await buildCartResponse(items);
  res.json(cart);
});

// Update quantity by cart item UUID
router.put("/cart/item/:itemId", async (req, res): Promise<void> => {
  const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const quantity = Number(req.body?.quantity);

  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
    res.status(400).json({ error: "Bad Request", message: "quantity must be between 1 and 99" });
    return;
  }

  await db.update(cartItemsTable).set({ quantity }).where(eq(cartItemsTable.id, itemId));

  const items = await db.select().from(cartItemsTable).orderBy(cartItemsTable.addedAt);
  const cart = await buildCartResponse(items);
  res.json(cart);
});

// Delete by cart item UUID
router.delete("/cart/item/:itemId", async (req, res): Promise<void> => {
  const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;

  await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));

  const items = await db.select().from(cartItemsTable).orderBy(cartItemsTable.addedAt);
  const cart = await buildCartResponse(items);
  res.json(cart);
});

// Legacy: update by productId (no-variant products)
router.put("/cart/:productId", async (req, res): Promise<void> => {
  const rawProductId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const quantity = Number(req.body?.quantity);

  if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
    res.status(400).json({ error: "Bad Request", message: "quantity must be between 1 and 99" });
    return;
  }

  await db.update(cartItemsTable).set({ quantity }).where(eq(cartItemsTable.productId, rawProductId));

  const items = await db.select().from(cartItemsTable).orderBy(cartItemsTable.addedAt);
  const cart = await buildCartResponse(items);
  res.json(cart);
});

// Legacy: delete by productId (no-variant products)
router.delete("/cart/:productId", async (req, res): Promise<void> => {
  const rawProductId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;

  await db.delete(cartItemsTable).where(eq(cartItemsTable.productId, rawProductId));

  const items = await db.select().from(cartItemsTable).orderBy(cartItemsTable.addedAt);
  const cart = await buildCartResponse(items);
  res.json(cart);
});

router.delete("/cart", async (_req, res): Promise<void> => {
  await db.delete(cartItemsTable);
  res.json({
    items: [],
    subtotal: 0,
    deliveryFee: 0,
    total: 0,
    itemCount: 0,
    savings: 0,
  });
});

export default router;
