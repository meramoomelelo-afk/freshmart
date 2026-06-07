import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, categoriesTable, siteSettingsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.id);

  let hiddenIds: number[] = [];
  try {
    const [setting] = await db.select().from(siteSettingsTable).where(
      eq(siteSettingsTable.key, "hidden_categories")
    );
    if (setting?.value && Array.isArray(setting.value)) {
      hiddenIds = setting.value as number[];
    }
  } catch {}

  const includeAll = (_req.query as any).includeAll === "true";

  res.json(categories
    .filter(c => includeAll || !hiddenIds.includes(c.id))
    .map((c) => ({
      id: String(c.id),
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      color: c.color,
      productCount: c.productCount,
      visible: !hiddenIds.includes(c.id),
    }))
  );
});

export default router;
