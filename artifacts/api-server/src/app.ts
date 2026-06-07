import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, sql, ilike } from "drizzle-orm";
import { getAllBBProducts } from "./bigbasket-data";
import { getConfiguredDeliveryTime } from "./lib/delivery-config";
import { csrfTokenEndpoint, csrfProtection } from "./lib/csrf";
import { autoReconnectIfCredentialsExist } from "./whatsapp-service";

async function autoSeedIfNeeded() {
  try {
    const [row] = await db.select({ cnt: sql<number>`count(*)::int` }).from(productsTable).where(sql`${productsTable.imageUrl} LIKE '%unsplash.com%'`);
    const unsplashCount = row?.cnt ?? 0;
    if (unsplashCount > 0) {
      logger.info({ unsplashCount }, "Detected old Unsplash images, re-seeding with BigBasket data...");
      await db.delete(productsTable);
      await db.delete(categoriesTable);

      const deliveryTime = await getConfiguredDeliveryTime();
      const allData = getAllBBProducts();
      let totalAdded = 0;
      for (const entry of allData) {
        const [existingCat] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, entry.category.slug));
        let catId: number;
        if (existingCat) {
          catId = existingCat.id;
        } else {
          const [newCat] = await db.insert(categoriesTable).values({
            name: entry.category.name,
            slug: entry.category.slug,
            icon: entry.category.emoji,
            color: entry.category.color,
            productCount: 0,
          }).returning();
          catId = newCat.id;
        }

        for (const prod of entry.products) {
          await db.insert(productsTable).values({
            name: prod.name,
            description: prod.description,
            price: String(Math.ceil(prod.price)),
            originalPrice: String(Math.ceil(prod.originalPrice)),
            discount: prod.discount,
            unit: prod.unit,
            quantity: prod.quantity,
            categoryId: catId,
            categoryName: entry.category.name,
            imageUrl: prod.imageUrl,
            inStock: prod.inStock,
            rating: String(prod.rating),
            reviewCount: prod.reviewCount,
            isFeatured: prod.isFeatured,
            isOrganic: prod.isOrganic,
            tags: prod.tags,
            deliveryTime,
          });
          totalAdded++;
        }

        await db.update(categoriesTable).set({ productCount: entry.products.length }).where(eq(categoriesTable.id, catId));
      }
      logger.info({ totalAdded }, "Auto-seed complete");
    }
  } catch (err) {
    logger.error({ err }, "Auto-seed check failed");
  }
}

async function ensureCartVariantColumn() {
  try {
    await db.execute(sql`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_label text`);
  } catch (err) {
    logger.warn({ err }, "ensureCartVariantColumn warning (non-fatal)");
  }
}

async function seedVariantsIfNeeded() {
  try {
    const variantMap: Array<{ pattern: string; variants: string[] }> = [
      { pattern: "tomato", variants: ["250 g", "500 g", "1 kg", "2 kg"] },
      { pattern: "onion", variants: ["500 g", "1 kg", "2 kg", "5 kg"] },
      { pattern: "potato", variants: ["500 g", "1 kg", "2 kg", "5 kg"] },
      { pattern: "garlic", variants: ["50 g", "100 g", "250 g"] },
      { pattern: "ginger", variants: ["50 g", "100 g", "250 g"] },
      { pattern: "carrot", variants: ["250 g", "500 g", "1 kg"] },
      { pattern: "beetroot", variants: ["250 g", "500 g", "1 kg"] },
      { pattern: "capsicum", variants: ["2 pcs", "4 pcs"] },
      { pattern: "lady finger", variants: ["250 g", "500 g", "1 kg"] },
      { pattern: "bhindi", variants: ["250 g", "500 g", "1 kg"] },
      { pattern: "french beans", variants: ["200 g", "500 g"] },
      { pattern: "cluster beans", variants: ["200 g", "500 g"] },
      { pattern: "peas", variants: ["200 g", "500 g", "1 kg"] },
      { pattern: "mushroom", variants: ["200 g", "500 g"] },
      { pattern: "sweet corn", variants: ["2 pcs", "4 pcs"] },
      { pattern: "palak", variants: ["200 g", "500 g"] },
      { pattern: "spinach", variants: ["200 g", "500 g"] },
      { pattern: "broccoli", variants: ["250 g", "500 g"] },
      { pattern: "apple", variants: ["4 pcs", "6 pcs", "1 kg", "2 kg"] },
      { pattern: "banana", variants: ["6 pcs", "1 dozen", "2 dozen"] },
      { pattern: "alphonso", variants: ["6 pcs", "1 dozen", "2 dozen"] },
      { pattern: "mango", variants: ["2 pcs", "4 pcs", "6 pcs", "1 dozen"] },
      { pattern: "lemon", variants: ["4 pcs", "6 pcs", "12 pcs"] },
      { pattern: "orange", variants: ["4 pcs", "6 pcs", "12 pcs"] },
      { pattern: "mosambi", variants: ["4 pcs", "6 pcs", "12 pcs"] },
      { pattern: "sweet lime", variants: ["4 pcs", "6 pcs", "12 pcs"] },
      { pattern: "pomegranate", variants: ["2 pcs", "4 pcs", "1 kg"] },
      { pattern: "grapes", variants: ["250 g", "500 g", "1 kg"] },
      { pattern: "strawberr", variants: ["200 g", "500 g"] },
      { pattern: "kiwi", variants: ["3 pcs", "6 pcs"] },
      { pattern: "papaya", variants: ["1 pc (~500 g)", "1 pc (~1 kg)"] },
      { pattern: "pineapple", variants: ["1 pc (small)", "1 pc (large)"] },
      { pattern: "coconut", variants: ["1 pc", "2 pcs", "4 pcs"] },
      { pattern: "guava", variants: ["4 pcs", "500 g", "1 kg"] },
      { pattern: "sapota", variants: ["4 pcs", "6 pcs"] },
      { pattern: "chikoo", variants: ["4 pcs", "6 pcs"] },
      { pattern: "watermelon", variants: ["1 kg (cut)", "2 kg (whole)"] },
      { pattern: "muskmelon", variants: ["1 pc (small)", "1 pc (large)"] },
      { pattern: "litchi", variants: ["250 g", "500 g"] },
      { pattern: "dragon fruit", variants: ["1 pc", "2 pcs"] },
      { pattern: "avocado", variants: ["1 pc", "2 pcs"] },
      { pattern: "pear", variants: ["4 pcs", "500 g", "1 kg"] },
      { pattern: "plum", variants: ["250 g", "500 g"] },
      { pattern: "jamun", variants: ["250 g", "500 g"] },
      { pattern: "custard apple", variants: ["2 pcs", "4 pcs"] },
      { pattern: "sitaphal", variants: ["2 pcs", "4 pcs"] },
      { pattern: "amla", variants: ["100 g", "250 g", "500 g"] },
      { pattern: "jackfruit", variants: ["250 g", "500 g", "1 kg"] },
      { pattern: "passion fruit", variants: ["2 pcs", "4 pcs"] },
      { pattern: "fig", variants: ["4 pcs", "8 pcs"] },
      { pattern: "peach", variants: ["4 pcs", "500 g"] },
      { pattern: "milk", variants: ["500 ml", "1 litre", "2 litre"] },
      { pattern: "paneer", variants: ["100 g", "200 g", "500 g"] },
      { pattern: "egg", variants: ["6 pcs", "12 pcs", "30 pcs"] },
      { pattern: "butter", variants: ["100 g", "500 g"] },
      { pattern: "dahi", variants: ["200 g", "400 g", "1 kg"] },
      { pattern: "lassi", variants: ["200 ml", "500 ml", "1 litre"] },
      { pattern: "almonds", variants: ["100 g", "200 g", "500 g"] },
      { pattern: "cashew", variants: ["100 g", "200 g", "500 g"] },
      { pattern: "raisins", variants: ["100 g", "200 g", "500 g"] },
      { pattern: "walnut", variants: ["100 g", "200 g", "500 g"] },
    ];
    for (const { pattern, variants } of variantMap) {
      await db.update(productsTable)
        .set({ variants })
        .where(sql`lower(${productsTable.name}) like ${`%${pattern}%`} and coalesce(array_length(${productsTable.variants}, 1), 0) = 0`);
    }
    logger.info("Variant seeding complete");
  } catch (err) {
    logger.error({ err }, "seedVariantsIfNeeded failed");
  }
}

// autoSeedIfNeeded() — disabled to prevent overwriting manually added products
autoReconnectIfCredentialsExist();
ensureCartVariantColumn();
// seedVariantsIfNeeded() — disabled; variants are set manually per product

const app: Express = express();

const isProduction = process.env.NODE_ENV === "production";

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/api/csrf-token", csrfTokenEndpoint);
app.use("/api", csrfProtection, router);

if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.resolve(__dirname, "..", "public");
  app.use(express.static(clientDist));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

export default app;
