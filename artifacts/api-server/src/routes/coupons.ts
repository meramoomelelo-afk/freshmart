import { Router, type IRouter, type Request, type Response } from "express";
import { db, couponsTable, type InsertCoupon } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "./admin";

const router: IRouter = Router();

router.post("/coupons/validate", async (req: Request, res: Response): Promise<void> => {
  const b = req.body ?? {};
  const code = typeof b.code === "string" ? b.code.trim().toUpperCase().slice(0, 50) : "";
  const orderTotal = Number(b.orderTotal) || 0;

  if (!code) {
    res.status(400).json({ error: "Bad Request", message: "Coupon code is required" });
    return;
  }

  const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, code));

  if (!coupon) {
    res.status(404).json({ error: "Not Found", message: "Invalid coupon code" });
    return;
  }

  if (!coupon.active) {
    res.status(400).json({ error: "Bad Request", message: "This coupon is no longer active" });
    return;
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    res.status(400).json({ error: "Bad Request", message: "This coupon has expired" });
    return;
  }

  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    res.status(400).json({ error: "Bad Request", message: "This coupon has reached its usage limit" });
    return;
  }

  const minOrder = Number(coupon.minOrder) || 0;
  if (orderTotal < minOrder) {
    res.status(400).json({ error: "Bad Request", message: `Minimum order of ₹${minOrder} required for this coupon` });
    return;
  }

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = Math.round((orderTotal * Number(coupon.value)) / 100);
  } else {
    discount = Math.min(Number(coupon.value), orderTotal);
  }

  res.json({
    valid: true,
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    discount,
    message: coupon.type === "percentage"
      ? `${Number(coupon.value)}% off applied! You save ₹${discount}`
      : `₹${discount} off applied!`,
  });
});

router.get("/admin/coupons", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const coupons = await db.select().from(couponsTable).orderBy(desc(couponsTable.createdAt));
  res.json(coupons.map(c => ({
    ...c,
    value: Number(c.value),
    minOrder: Number(c.minOrder),
    expiresAt: c.expiresAt?.toISOString() || null,
    createdAt: c.createdAt.toISOString(),
  })));
});

router.post("/admin/coupons", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const b = req.body ?? {};
  const code = typeof b.code === "string" ? b.code.trim().toUpperCase().slice(0, 50) : "";
  const type = b.type === "flat" ? "flat" : "percentage";
  const value = Math.max(0, Number(b.value) || 0);
  const minOrder = Math.max(0, Number(b.minOrder) || 0);
  const maxUses = Math.max(0, Math.floor(Number(b.maxUses) || 0));
  const active = b.active !== false;
  let expiresAt: Date | null = null;
  if (typeof b.expiresAt === "string" && b.expiresAt) {
    const parsed = new Date(b.expiresAt);
    if (isNaN(parsed.getTime())) {
      res.status(400).json({ error: "Bad Request", message: "Invalid expiry date format" });
      return;
    }
    expiresAt = parsed;
  }

  if (!code) {
    res.status(400).json({ error: "Bad Request", message: "Coupon code is required" });
    return;
  }

  if (value <= 0) {
    res.status(400).json({ error: "Bad Request", message: "Discount value must be greater than 0" });
    return;
  }

  if (type === "percentage" && value > 100) {
    res.status(400).json({ error: "Bad Request", message: "Percentage discount cannot exceed 100%" });
    return;
  }

  const [existing] = await db.select().from(couponsTable).where(eq(couponsTable.code, code));
  if (existing) {
    res.status(409).json({ error: "Conflict", message: "A coupon with this code already exists" });
    return;
  }

  const [coupon] = await db.insert(couponsTable).values({
    code,
    type,
    value: String(value),
    minOrder: String(minOrder),
    maxUses,
    active,
    expiresAt,
  }).returning();

  res.status(201).json({
    ...coupon,
    value: Number(coupon.value),
    minOrder: Number(coupon.minOrder),
    expiresAt: coupon.expiresAt?.toISOString() || null,
    createdAt: coupon.createdAt.toISOString(),
  });
});

router.put("/admin/coupons/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const b = req.body ?? {};

  const [existing] = await db.select().from(couponsTable).where(eq(couponsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Not Found", message: "Coupon not found" });
    return;
  }

  const updateData: Partial<InsertCoupon> = {};
  if (typeof b.code === "string" && b.code.trim()) {
    const newCode = b.code.trim().toUpperCase().slice(0, 50);
    if (newCode !== existing.code) {
      const [dup] = await db.select().from(couponsTable).where(eq(couponsTable.code, newCode));
      if (dup) { res.status(409).json({ error: "Conflict", message: "A coupon with this code already exists" }); return; }
      updateData.code = newCode;
    }
  }
  if (b.type === "flat" || b.type === "percentage") updateData.type = b.type;
  if (b.value !== undefined) {
    const val = Math.max(0, Number(b.value) || 0);
    if (val <= 0) { res.status(400).json({ error: "Bad Request", message: "Value must be > 0" }); return; }
    const effectiveType = updateData.type || existing.type;
    if (effectiveType === "percentage" && val > 100) { res.status(400).json({ error: "Bad Request", message: "Percentage discount cannot exceed 100%" }); return; }
    updateData.value = String(val);
  } else if (updateData.type === "percentage" && Number(existing.value) > 100) {
    res.status(400).json({ error: "Bad Request", message: "Current value exceeds 100% for percentage type" }); return;
  }
  if (b.minOrder !== undefined) updateData.minOrder = String(Math.max(0, Number(b.minOrder) || 0));
  if (b.maxUses !== undefined) updateData.maxUses = Math.max(0, Math.floor(Number(b.maxUses) || 0));
  if (typeof b.active === "boolean") updateData.active = b.active;
  if (b.expiresAt !== undefined) {
    if (b.expiresAt) {
      const parsed = new Date(b.expiresAt);
      if (isNaN(parsed.getTime())) { res.status(400).json({ error: "Bad Request", message: "Invalid expiry date format" }); return; }
      updateData.expiresAt = parsed;
    } else {
      updateData.expiresAt = null;
    }
  }

  await db.update(couponsTable).set(updateData).where(eq(couponsTable.id, id));
  const [updated] = await db.select().from(couponsTable).where(eq(couponsTable.id, id));

  res.json({
    ...updated,
    value: Number(updated.value),
    minOrder: Number(updated.minOrder),
    expiresAt: updated.expiresAt?.toISOString() || null,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/admin/coupons/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(couponsTable).where(eq(couponsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Not Found", message: "Coupon not found" });
    return;
  }
  await db.delete(couponsTable).where(eq(couponsTable.id, id));
  res.json({ success: true });
});

export default router;
