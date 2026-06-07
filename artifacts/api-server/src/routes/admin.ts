import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, adminUsersTable, productsTable, categoriesTable, ordersTable, siteSettingsTable, usersTable } from "@workspace/db";
import { eq, desc, ilike, count, sql, inArray, notInArray } from "drizzle-orm";
import { PRODUCE_DATA } from "../produce-data";
import bcrypt from "bcryptjs";
import { randomUUID, createHash, randomBytes, timingSafeEqual } from "crypto";
import { getAllBBProducts, getBBProductsForCategory, BB_CATEGORIES, type BBCategory, type BBProduct } from "../bigbasket-data";
import { getNotifications, addNotification, getSmsStatus } from "./auth";
import { getWhatsAppState, startWhatsAppSession, disconnectWhatsApp, sendWhatsAppMessage, sendWhatsAppDocument, isWhatsAppConnected } from "../whatsapp-service";
import { getConfiguredDeliveryTime, getStoreName } from "../lib/delivery-config";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { imageStorage } from "../lib/objectStorage";


const router: IRouter = Router();

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too Many Requests", message: "Too many login attempts. Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const adminStrictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { error: "Too Many Requests", message: "Too many failed attempts. Please wait 5 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const DUMMY_HASH = "$2b$12$invalidhashfortimingprotectionXXXXXXXXXXXXXXXXXXXXXX";

const PASSWORD_MIN_LENGTH = 8;

function validatePasswordStrength(pw: string): string | null {
  if (pw.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (!/[0-9]/.test(pw) && !/[^a-zA-Z0-9]/.test(pw)) return "Password must contain at least one number or special character.";
  return null;
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [key, val] of sessions) {
    if (now > val.expiresAt) sessions.delete(key);
  }
}

async function sendProductAlert(type: "new" | "price_drop" | "back_in_stock" | "discount", productName: string, price: number, originalPrice?: number, discount?: number) {
  if (!isWhatsAppConnected()) return;
  try {
    const [setting] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "whatsapp_product_alerts"));
    if (!setting || (setting.value !== true && setting.value !== "true")) return;

    const storeName = await getStoreName();
    const shopUrl = `https://${process.env.REPLIT_DEV_DOMAIN || "store.app"}/`;
    let message = "";
    if (type === "new") {
      message = `🛒 *New on ${storeName}!*\n\n*${productName}*\nPrice: ₹${price}\n\nOrder now on ${storeName} for fast delivery!\n\n━━━━━━━━━━━━━━━\n🛒 *Order Now* 👇\n${shopUrl}`;
    } else if (type === "price_drop") {
      message = `🔥 *Price Drop Alert!*\n\n*${productName}*\n~~₹${originalPrice}~~ → *₹${price}*\nYou save ₹${(originalPrice || price) - price}!\n\nGrab it before the price goes back up!\n\n━━━━━━━━━━━━━━━\n🛒 *Shop Now* 👇\n${shopUrl}`;
    } else if (type === "back_in_stock") {
      message = `✅ *Back in Stock!*\n\n*${productName}*\nPrice: ₹${price}\n\nHurry, limited stock available!\n\n━━━━━━━━━━━━━━━\n🛒 *Order Now* 👇\n${shopUrl}`;
    } else if (type === "discount") {
      message = `🏷️ *${discount}% OFF!*\n\n*${productName}*\n~~₹${originalPrice}~~ → *₹${price}*\nSave ₹${(originalPrice || price) - price}!\n\n━━━━━━━━━━━━━━━\n🛒 *Shop Now* 👇\n${shopUrl}`;
    }

    if (!message) return;

    const users = await db.select({ phone: usersTable.phone }).from(usersTable);
    for (const user of users) {
      if (user.phone) {
        sendWhatsAppMessage(user.phone, message).catch(() => {});
      }
    }

    addNotification({
      type: "whatsapp",
      phone: "all_users",
      message: `[Product Alert → ${users.length} users] ${message.substring(0, 100)}...`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[ProductAlert] Error:", err);
  }
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000;
const BCRYPT_ROUNDS = 12;

const sessions = new Map<string, { userId: number; username: string; displayName: string; email: string | null; expiresAt: number }>();

function setAdminCookie(res: Response, token: string) {
  res.cookie("admin_token", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.admin_token;
  if (!token || typeof token !== "string" || !sessions.has(token)) {
    res.status(401).json({ error: "Unauthorized", message: "Admin login required" });
    return;
  }
  const session = sessions.get(token)!;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    res.status(401).json({ error: "Unauthorized", message: "Session expired. Please log in again." });
    return;
  }
  (req as any).admin = session;
  next();
}

router.post("/admin/login", adminLoginLimiter, adminStrictLimiter, async (req: Request, res: Response): Promise<void> => {
  const username = typeof req.body?.username === "string" ? req.body.username.trim().slice(0, 100) : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!username || !password) {
    res.status(400).json({ error: "Bad Request", message: "Username and password are required" });
    return;
  }

  cleanExpiredSessions();

  const [user] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.username, username));

  if (!user) {
    await bcrypt.compare("dummy_timing_protection", DUMMY_HASH).catch(() => {});
    res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    return;
  }

  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const minutesLeft = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
    res.status(403).json({ error: "Forbidden", message: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).` });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    const newAttempts = (user.failedLoginAttempts ?? 0) + 1;
    const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;
    await db.update(adminUsersTable).set({
      failedLoginAttempts: newAttempts,
      lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
      updatedAt: new Date(),
    }).where(eq(adminUsersTable.id, user.id));

    const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
    const msg = shouldLock
      ? `Account locked for 30 minutes due to too many failed attempts.`
      : `Invalid credentials. ${remaining > 0 ? `${remaining} attempt(s) remaining before lockout.` : ""}`;
    res.status(401).json({ error: "Unauthorized", message: msg });
    return;
  }

  await db.update(adminUsersTable).set({
    failedLoginAttempts: 0,
    lockedUntil: null,
    updatedAt: new Date(),
  }).where(eq(adminUsersTable.id, user.id));

  const token = randomUUID();
  sessions.set(token, {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email ?? null,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  setAdminCookie(res, token);
  res.json({ success: true, user: { id: user.id, username: user.username, displayName: user.displayName } });
});

router.post("/admin/logout", (req: Request, res: Response): void => {
  const token = req.cookies?.admin_token;
  if (token && typeof token === "string") sessions.delete(token);
  res.clearCookie("admin_token", { path: "/" });
  res.json({ success: true });
});

router.get("/admin/me", requireAdmin, (req: Request, res: Response): void => {
  const admin = (req as any).admin;
  res.json({ user: { id: admin.userId, username: admin.username, displayName: admin.displayName, email: admin.email } });
});

const adminSetupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Too Many Requests", message: "Too many setup attempts. Try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

router.post("/admin/setup", adminSetupLimiter, async (req: Request, res: Response): Promise<void> => {
  const b = req.body ?? {};
  const username = typeof b.username === "string" ? b.username.trim().slice(0, 50) : "";
  const password = typeof b.password === "string" ? b.password : "";
  const displayName = typeof b.displayName === "string" ? b.displayName.trim().slice(0, 100) : "";
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase().slice(0, 200) : "";

  if (!username || !password || !displayName || !email) {
    res.status(400).json({ error: "Bad Request", message: "All fields required (username, email, password, displayName)" });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Bad Request", message: "Invalid email address" });
    return;
  }

  const pwError = validatePasswordStrength(password);
  if (pwError) {
    res.status(400).json({ error: "Bad Request", message: pwError });
    return;
  }

  if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(username)) {
    res.status(400).json({ error: "Bad Request", message: "Username must be 3–50 characters (letters, numbers, _ . - only)" });
    return;
  }

  const existing = await db.select({ id: adminUsersTable.id }).from(adminUsersTable).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Bad Request", message: "Admin account already exists. Use login instead." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let user: { id: number; username: string; displayName: string; email: string | null };
  try {
    const [created] = await db.insert(adminUsersTable).values({ username, email, passwordHash, displayName }).returning();
    user = created;
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(400).json({ error: "Bad Request", message: "Username or email already taken." });
      return;
    }
    throw err;
  }

  const token = randomUUID();
  sessions.set(token, {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email ?? null,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  setAdminCookie(res, token);
  res.json({ success: true, user: { id: user.id, username: user.username, displayName: user.displayName } });
});

router.get("/admin/check-setup", async (_req: Request, res: Response): Promise<void> => {
  const existing = await db.select({ id: adminUsersTable.id }).from(adminUsersTable).limit(1);
  res.json({ needsSetup: existing.length === 0 });
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: "Too Many Requests", message: "Too many reset requests. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

router.post("/admin/forgot-password", forgotPasswordLimiter, async (req: Request, res: Response): Promise<void> => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase().slice(0, 200) : "";

  if (!email) {
    res.status(400).json({ error: "Bad Request", message: "Email is required" });
    return;
  }

  const [admin] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.email, email));

  const GENERIC_OK = { success: true, message: "If that email is registered, a reset token has been generated. Check your server logs." };

  if (!admin) {
    await new Promise(r => setTimeout(r, 200 + Math.random() * 200));
    res.json(GENERIC_OK);
    return;
  }

  const resetToken = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(resetToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db.update(adminUsersTable).set({
    passwordResetToken: tokenHash,
    passwordResetExpiresAt: expiresAt,
    updatedAt: new Date(),
  }).where(eq(adminUsersTable.id, admin.id));

  console.log(`\n[ADMIN SECURITY] Password reset requested for: ${admin.username}`);
  console.log(`[ADMIN SECURITY] Reset token (valid 1 hour): ${resetToken}`);
  console.log(`[ADMIN SECURITY] Use this token on the /admin/login reset page.\n`);

  res.json({ ...GENERIC_OK, devToken: process.env.NODE_ENV !== "production" ? resetToken : undefined });
});

router.post("/admin/reset-password", forgotPasswordLimiter, async (req: Request, res: Response): Promise<void> => {
  const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!token || !password) {
    res.status(400).json({ error: "Bad Request", message: "Token and new password are required" });
    return;
  }

  const pwError = validatePasswordStrength(password);
  if (pwError) {
    res.status(400).json({ error: "Bad Request", message: pwError });
    return;
  }

  const tokenHash = hashResetToken(token);

  const [admin] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.passwordResetToken, tokenHash));

  if (!admin || !admin.passwordResetExpiresAt || new Date(admin.passwordResetExpiresAt) < new Date()) {
    res.status(400).json({ error: "Bad Request", message: "Invalid or expired reset token." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await db.update(adminUsersTable).set({
    passwordHash,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    updatedAt: new Date(),
  }).where(eq(adminUsersTable.id, admin.id));

  for (const [key, val] of sessions) {
    if (val.userId === admin.id) sessions.delete(key);
  }

  console.log(`[ADMIN SECURITY] Password successfully reset for user: ${admin.username}`);

  res.json({ success: true, message: "Password has been reset. Please log in with your new password." });
});

router.post("/admin/change-password", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
  const adminSession = (req as any).admin;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Bad Request", message: "Current and new password are required" });
    return;
  }

  const pwError = validatePasswordStrength(newPassword);
  if (pwError) {
    res.status(400).json({ error: "Bad Request", message: pwError });
    return;
  }

  const [admin] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.id, adminSession.userId));
  if (!admin) {
    res.status(404).json({ error: "Not Found", message: "Admin not found" });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Unauthorized", message: "Current password is incorrect" });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await db.update(adminUsersTable).set({ passwordHash, updatedAt: new Date() }).where(eq(adminUsersTable.id, admin.id));

  const currentToken = req.cookies?.admin_token;
  for (const [key, val] of sessions) {
    if (val.userId === admin.id && key !== currentToken) sessions.delete(key);
  }

  res.json({ success: true, message: "Password changed successfully." });
});

router.get("/admin/dashboard", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const [productStats] = await db.select({ total: count() }).from(productsTable);
  const [categoryStats] = await db.select({ total: count() }).from(categoriesTable);
  const [orderStats] = await db.select({ total: count() }).from(ordersTable);
  const [revenueResult] = await db.select({
    totalRevenue: sql<string>`COALESCE(SUM(${ordersTable.total}::numeric), 0)`,
  }).from(ordersTable);

  const recentOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(5);

  res.json({
    products: productStats?.total ?? 0,
    categories: categoryStats?.total ?? 0,
    orders: orderStats?.total ?? 0,
    revenue: Number(revenueResult?.totalRevenue ?? 0),
    recentOrders: recentOrders.map(o => ({
      id: o.id,
      total: Number(o.total),
      status: o.status,
      name: o.name,
      createdAt: o.createdAt.toISOString(),
    })),
  });
});

router.get("/admin/products", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { search, categoryId, onSale, page = "1" } = req.query as { search?: string; categoryId?: string; onSale?: string; page?: string };
  const limit = 20;
  const offset = (Number(page) - 1) * limit;

  const conditions = [];
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
  if (categoryId) conditions.push(eq(productsTable.categoryId, Number(categoryId)));
  if (onSale === "true") conditions.push(sql`${productsTable.discount} > 0`);

  const where = conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined;

  const products = await db.select().from(productsTable)
    .where(conditions.length === 1 ? conditions[0] : conditions.length > 1 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined)
    .orderBy(desc(productsTable.id))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db.select({ total: count() }).from(productsTable)
    .where(conditions.length === 1 ? conditions[0] : conditions.length > 1 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined);

  res.json({
    products: products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      originalPrice: Number(p.originalPrice),
      discount: p.discount,
      unit: p.unit,
      quantity: p.quantity,
      categoryId: p.categoryId,
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
    })),
    total: totalResult?.total ?? 0,
    page: Number(page),
    totalPages: Math.ceil((totalResult?.total ?? 0) / limit),
  });
});

router.post("/admin/products", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const body = req.body;
  if (!body?.name || typeof body.name !== "string" || !body.name.trim()) {
    res.status(400).json({ error: "Bad Request", message: "Product name is required" });
    return;
  }
  if (!body.categoryId || isNaN(Number(body.categoryId))) {
    res.status(400).json({ error: "Bad Request", message: "Valid category ID is required" });
    return;
  }
  if (!body.price || isNaN(Number(body.price)) || Number(body.price) < 0) {
    res.status(400).json({ error: "Bad Request", message: "Valid price is required" });
    return;
  }
  const [product] = await db.insert(productsTable).values({
    name: String(body.name).trim().slice(0, 200),
    description: body.description || "",
    price: String(body.price),
    originalPrice: String(body.originalPrice || body.price),
    discount: body.discount || 0,
    unit: body.unit || "pc",
    quantity: body.quantity || "1 pc",
    categoryId: Number(body.categoryId),
    categoryName: body.categoryName || "",
    imageUrl: body.imageUrl || "",
    inStock: body.inStock !== false,
    rating: String(body.rating || "4.0"),
    reviewCount: body.reviewCount || 0,
    isFeatured: body.isFeatured || false,
    isOrganic: body.isOrganic || false,
    tags: body.tags || [],
    deliveryTime: body.deliveryTime || await getConfiguredDeliveryTime(),
    variants: body.variants || [],
    variantPrices: (body.variantPrices && typeof body.variantPrices === "object" && !Array.isArray(body.variantPrices)) ? body.variantPrices : {},
  }).returning();

  await updateCategoryProductCount(Number(body.categoryId));

  sendProductAlert("new", product.name, Number(product.price)).catch(() => {});

  res.json({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    imageUrl: product.imageUrl,
  });
});

router.put("/admin/products/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const b = req.body ?? {};

  const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Not Found", message: "Product not found" });
    return;
  }

  const updateData: any = {};
  if (typeof b.name === "string") updateData.name = b.name.trim().slice(0, 200);
  if (typeof b.description === "string") updateData.description = b.description.trim().slice(0, 2000);
  if (b.price !== undefined) updateData.price = String(Number(b.price) || 0);
  if (b.originalPrice !== undefined) updateData.originalPrice = String(Number(b.originalPrice) || 0);
  if (b.discount !== undefined) updateData.discount = Math.max(0, Math.min(100, Number(b.discount) || 0));
  if (typeof b.unit === "string") updateData.unit = b.unit.trim().slice(0, 50);
  if (typeof b.quantity === "string") updateData.quantity = b.quantity.trim().slice(0, 50);
  if (b.categoryId !== undefined) updateData.categoryId = Number(b.categoryId);
  if (typeof b.categoryName === "string") updateData.categoryName = b.categoryName.trim().slice(0, 100);
  if (typeof b.imageUrl === "string") updateData.imageUrl = b.imageUrl.trim().slice(0, 1000);
  if (typeof b.inStock === "boolean") updateData.inStock = b.inStock;
  if (b.rating !== undefined) updateData.rating = String(Math.max(0, Math.min(5, Number(b.rating) || 0)));
  if (b.reviewCount !== undefined) updateData.reviewCount = Math.max(0, Number(b.reviewCount) || 0);
  if (typeof b.isFeatured === "boolean") updateData.isFeatured = b.isFeatured;
  if (typeof b.isOrganic === "boolean") updateData.isOrganic = b.isOrganic;
  if (b.tags !== undefined) {
    if (Array.isArray(b.tags)) updateData.tags = b.tags.slice(0, 50).map((t: any) => String(t).trim().slice(0, 100));
    else if (typeof b.tags === "string") updateData.tags = [b.tags.trim().slice(0, 100)];
  }
  if (typeof b.deliveryTime === "string") updateData.deliveryTime = b.deliveryTime.trim().slice(0, 50);
  if (b.variants !== undefined) {
    if (Array.isArray(b.variants)) updateData.variants = b.variants.slice(0, 50).map((v: any) => String(v).trim().slice(0, 200));
    else if (typeof b.variants === "string") updateData.variants = [b.variants.trim().slice(0, 200)];
  }
  if (b.variantPrices !== undefined && typeof b.variantPrices === "object" && !Array.isArray(b.variantPrices)) {
    updateData.variantPrices = b.variantPrices;
  }

  await db.update(productsTable).set(updateData).where(eq(productsTable.id, id));

  if (b.categoryId !== undefined) {
    await updateCategoryProductCount(Number(b.categoryId));
  }

  const [updated] = await db.select().from(productsTable).where(eq(productsTable.id, id));

  if (existing) {
    const oldPrice = Number(existing.price);
    const newPrice = Number(updated.price);
    const productName = updated.name;
    if (b.price !== undefined && newPrice < oldPrice) {
      sendProductAlert("price_drop", productName, newPrice, oldPrice).catch(() => {});
    }
    if (b.discount !== undefined && Number(b.discount) > 0 && (!existing.discount || Number(b.discount) > existing.discount)) {
      sendProductAlert("discount", productName, newPrice, Number(updated.originalPrice), Number(b.discount)).catch(() => {});
    }
    if (b.inStock === true && !existing.inStock) {
      sendProductAlert("back_in_stock", productName, newPrice).catch(() => {});
    }
  }

  res.json({
    id: updated.id,
    name: updated.name,
    price: Number(updated.price),
    imageUrl: updated.imageUrl,
  });
});

router.delete("/admin/products/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) {
    res.status(404).json({ error: "Not Found", message: "Product not found" });
    return;
  }

  await db.delete(productsTable).where(eq(productsTable.id, id));
  await updateCategoryProductCount(product.categoryId);
  res.json({ success: true });
});

router.get("/admin/categories", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.id);
  let hiddenIds: number[] = [];
  try {
    const [setting] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "hidden_categories"));
    if (setting?.value && Array.isArray(setting.value)) hiddenIds = setting.value as number[];
  } catch {}
  res.json(categories.map(c => ({ ...c, visible: !hiddenIds.includes(c.id) })));
});

router.put("/admin/categories/:id/visibility", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const { visible } = req.body as { visible: boolean };
  let hiddenIds: number[] = [];
  try {
    const [setting] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "hidden_categories"));
    if (setting?.value && Array.isArray(setting.value)) hiddenIds = setting.value as number[];
  } catch {}

  if (visible) {
    hiddenIds = hiddenIds.filter(hid => hid !== id);
  } else {
    if (!hiddenIds.includes(id)) hiddenIds.push(id);
  }

  const [existing] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "hidden_categories"));
  if (existing) {
    await db.update(siteSettingsTable).set({ value: hiddenIds }).where(eq(siteSettingsTable.key, "hidden_categories"));
  } else {
    await db.insert(siteSettingsTable).values({ key: "hidden_categories", value: hiddenIds });
  }
  res.json({ success: true, hiddenIds });
});

router.post("/admin/categories", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const b = req.body ?? {};
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 100) : "";
  const slug = typeof b.slug === "string" ? b.slug.trim().slice(0, 100) : "";
  const icon = typeof b.icon === "string" ? b.icon.slice(0, 10) : "";
  const color = typeof b.color === "string" ? b.color.slice(0, 20) : "";
  if (!name || !slug) {
    res.status(400).json({ error: "Bad Request", message: "Category name and slug are required" });
    return;
  }
  const [category] = await db.insert(categoriesTable).values({
    name, slug, icon, color, productCount: 0,
  }).returning();
  res.json(category);
});

router.put("/admin/categories/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const b = req.body ?? {};
  const updateData: any = {};
  if (typeof b.name === "string" && b.name.trim()) updateData.name = b.name.trim().slice(0, 100);
  if (typeof b.slug === "string" && b.slug.trim()) updateData.slug = b.slug.trim().slice(0, 100);
  if (typeof b.icon === "string") updateData.icon = b.icon.slice(0, 10);
  if (typeof b.color === "string") updateData.color = b.color.slice(0, 20);

  await db.update(categoriesTable).set(updateData).where(eq(categoriesTable.id, id));
  const [updated] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
  res.json(updated);
});

router.delete("/admin/categories/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.json({ success: true });
});

router.get("/admin/orders", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { status, page = "1" } = req.query as { status?: string; page?: string };
  const limit = 20;
  const offset = (Number(page) - 1) * limit;

  const conditions = [];
  if (status && status !== "all") conditions.push(eq(ordersTable.status, status));

  const orders = await db.select().from(ordersTable)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db.select({ total: count() }).from(ordersTable)
    .where(conditions.length > 0 ? conditions[0] : undefined);

  res.json({
    orders: orders.map(o => ({
      id: o.id,
      items: o.items,
      total: Number(o.total),
      status: o.status,
      name: o.name,
      phone: o.phone,
      address: o.address,
      paymentMethod: o.paymentMethod,
      estimatedDelivery: o.estimatedDelivery,
      couponCode: o.couponCode || null,
      couponDiscount: o.couponDiscount ? Number(o.couponDiscount) : null,
      deliverySlot: o.deliverySlot || null,
      createdAt: o.createdAt.toISOString(),
    })),
    total: totalResult?.total ?? 0,
    page: Number(page),
    totalPages: Math.ceil((totalResult?.total ?? 0) / limit),
  });
});

router.put("/admin/orders/:id/status", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const status = typeof req.body?.status === "string" ? req.body.status.trim() : "";
  const validStatuses = ["placed", "pending", "confirmed", "packed", "preparing", "out_for_delivery", "delivered", "cancelled"];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: "Bad Request", message: "Valid status is required" });
    return;
  }

  await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id as string));
  const [updated] = await db.select().from(ordersTable).where(eq(ordersTable.id, id as string));

  if (!updated) {
    res.status(404).json({ error: "Not Found", message: "Order not found" });
    return;
  }

  const orderId = String(id).slice(0, 8).toUpperCase();
  let statusMessage = "";
  let waMessage = "";

  const sName = await getStoreName();
  const baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN || "store.app"}`;
  const trackUrl = `${baseUrl}/order/${id}`;
  const shopUrl = `${baseUrl}/`;
  const btnFooter = `\n\n━━━━━━━━━━━━━━━\n📦 *Track Order* 👇\n${trackUrl}\n\n🛒 *Shop Again* 👇\n${shopUrl}`;

  switch (status) {
    case "confirmed":
      statusMessage = `${sName}: Your order #${orderId} has been confirmed! We're preparing your items.`;
      waMessage = `✅ *Order Confirmed!*\n\nHi ${updated.name || ""},\nYour order *#${orderId}* has been confirmed.\nWe're preparing your items now.\n\nTotal: ₹${Number(updated.total)}${btnFooter}`;
      break;
    case "packed":
      statusMessage = `${sName}: Your order #${orderId} is packed and ready for pickup by our delivery partner.`;
      waMessage = `📦 *Order Packed!*\n\nHi ${updated.name || ""},\nYour order *#${orderId}* is packed and ready.\nOur delivery partner will pick it up shortly.${btnFooter}`;
      break;
    case "out_for_delivery":
      statusMessage = `${sName}: Your order #${orderId} is out for delivery! Our rider is on the way.`;
      waMessage = `🚴 *Out for Delivery!*\n\nHi ${updated.name || ""},\nYour order *#${orderId}* is on its way!\nOur delivery partner is heading to your location.\n\nEstimated: ${updated.estimatedDelivery || "Soon"}${btnFooter}`;
      break;
    case "delivered":
      statusMessage = `${sName}: Your order #${orderId} has been delivered. Thank you for shopping with us!`;
      waMessage = `🎉 *Order Delivered!*\n\nHi ${updated.name || ""},\nYour order *#${orderId}* has been delivered successfully.\n\nTotal: ₹${Number(updated.total)}\n\nThank you for shopping with ${sName}! 🛒\n\n━━━━━━━━━━━━━━━\n⭐ *Rate Your Experience* 👇\n${trackUrl}\n\n🛒 *Order Again* 👇\n${shopUrl}`;
      break;
    case "cancelled":
      statusMessage = `${sName}: Your order #${orderId} has been cancelled. If you didn't request this, please contact support.`;
      waMessage = `❌ *Order Cancelled*\n\nHi ${updated.name || ""},\nYour order *#${orderId}* has been cancelled.\n\nIf you have questions, please contact our support team.\n\n━━━━━━━━━━━━━━━\n🛒 *Shop Again* 👇\n${shopUrl}`;
      break;
    default:
      statusMessage = `${sName}: Your order #${orderId} status updated to "${status}".`;
      waMessage = `📋 *Order Update*\n\nHi ${updated.name || ""},\nYour order *#${orderId}* status: *${status}*${btnFooter}`;
  }

  const waConnected = isWhatsAppConnected();
  let orderUpdatesEnabled = false;
  try {
    const [setting] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "whatsapp_order_updates"));
    orderUpdatesEnabled = setting?.value === true || setting?.value === "true";
  } catch {}

  if (waConnected && orderUpdatesEnabled && updated.phone) {
    sendWhatsAppMessage(updated.phone, waMessage).catch(() => {});
    addNotification({
      type: "whatsapp",
      phone: updated.phone,
      message: `[WhatsApp] ${statusMessage}`,
      timestamp: new Date().toISOString(),
    });
  } else {
    addNotification({
      type: "sms",
      phone: updated.phone,
      message: statusMessage,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    id: updated.id,
    status: updated.status,
    total: Number(updated.total),
    name: updated.name,
  });
});

async function generateInvoicePdf(order: any, storeName: string): Promise<Buffer> {
  const PDFDocument = (await import("pdfkit")).default;
  return new Promise((resolve, reject) => {
    const doc = new (PDFDocument as any)({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const orderId = String(order.id).slice(0, 8).toUpperCase();
    const items = (order.items || []) as any[];
    const total = Number(order.total);
    const couponDiscount = Number(order.couponDiscount || 0);
    const subtotal = items.reduce((s: number, item: any) => {
      const p = item.customPrice !== undefined ? Number(item.customPrice) : Number(item.product?.price || 0);
      return s + p * (item.quantity || 1);
    }, 0);
    const deliveryFee = Math.max(0, Math.round(total - subtotal + couponDiscount));
    const green = "#0c831f";
    const dark = "#111827";
    const gray = "#6b7280";
    const W = 515;

    // Green header
    doc.rect(0, 0, 595, 75).fill(green);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(22).text(storeName, 40, 18, { width: W });
    doc.font("Helvetica").fontSize(10).text("TAX INVOICE", 40, 44, { width: W });
    doc.fillColor(dark);

    // Order meta row
    let y = 88;
    const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    doc.font("Helvetica").fontSize(9).fillColor(gray).text(`Order #${orderId}  |  Date: ${dateStr}  |  Status: ${(order.status || "").replace(/_/g, " ")}`, 40, y, { width: W });

    y += 18;
    doc.rect(40, y, W, 1).fill("#e5e7eb"); y += 10;

    // Customer info row
    doc.font("Helvetica-Bold").fontSize(9).fillColor(gray).text("CUSTOMER", 40, y);
    doc.text("DELIVERY & PAYMENT", 310, y);
    y += 13;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(dark).text(order.name || "", 40, y);
    doc.font("Helvetica").fontSize(9).fillColor(gray).text(order.deliverySlot || "Standard Delivery", 310, y);
    y += 13;
    doc.font("Helvetica").fontSize(9).fillColor(gray).text(order.phone || "", 40, y);
    const pm = (order.paymentMethod || "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    doc.text(`Payment: ${pm}`, 310, y);
    y += 13;
    doc.text(order.address || "", 40, y, { width: 260 });
    y += 20;

    doc.rect(40, y, W, 1).fill("#e5e7eb"); y += 8;

    // Table header
    doc.rect(40, y, W, 22).fill("#f3f4f6");
    doc.font("Helvetica-Bold").fontSize(9).fillColor(dark);
    doc.text("#", 48, y + 7, { width: 20 });
    doc.text("Item", 72, y + 7, { width: 250 });
    doc.text("Qty", 328, y + 7, { width: 40, align: "center" });
    doc.text("Unit Price", 372, y + 7, { width: 80, align: "right" });
    doc.text("Amount", 455, y + 7, { width: 100, align: "right" });
    y += 24;

    // Items
    items.forEach((item: any, idx: number) => {
      const unitPrice = item.customPrice !== undefined ? Number(item.customPrice) : Number(item.product?.price || 0);
      const qty = item.quantity || 1;
      const amount = unitPrice * qty;
      if (idx % 2 === 1) doc.rect(40, y - 2, W, 18).fill("#fafafa");
      doc.font("Helvetica").fontSize(9).fillColor(dark);
      doc.text(`${idx + 1}`, 48, y, { width: 20 });
      const itemName = `${item.product?.name || "Item"}${item.product?.quantity ? ` (${item.product.quantity}${item.product?.unit || ""})` : ""}`;
      doc.text(itemName, 72, y, { width: 250 });
      doc.text(`${qty}`, 328, y, { width: 40, align: "center" });
      doc.text(`Rs.${unitPrice.toFixed(0)}`, 372, y, { width: 80, align: "right" });
      doc.font("Helvetica-Bold").text(`Rs.${amount.toFixed(0)}`, 455, y, { width: 100, align: "right" });
      y += 18;
    });

    y += 4;
    doc.rect(40, y, W, 1).fill("#e5e7eb"); y += 10;

    // Totals
    const sx = 370, vx = 455, vw = 100;
    doc.font("Helvetica").fontSize(9).fillColor(gray);
    doc.text("Subtotal:", sx, y); doc.fillColor(dark).text(`Rs.${subtotal.toFixed(0)}`, vx, y, { width: vw, align: "right" }); y += 15;
    if (deliveryFee > 0) {
      doc.fillColor(gray).text("Delivery Charge:", sx, y); doc.fillColor(dark).text(`Rs.${deliveryFee.toFixed(0)}`, vx, y, { width: vw, align: "right" }); y += 15;
    }
    if (couponDiscount > 0) {
      doc.fillColor(gray).text(`Coupon${order.couponCode ? ` (${order.couponCode})` : ""}:`, sx, y);
      doc.fillColor("#dc2626").text(`- Rs.${couponDiscount.toFixed(0)}`, vx, y, { width: vw, align: "right" }); y += 15;
    }
    doc.rect(sx, y, 555 - sx, 28).fill(green);
    doc.font("Helvetica-Bold").fontSize(12).fillColor("white");
    doc.text("GRAND TOTAL", sx + 8, y + 8);
    doc.text(`Rs.${total.toFixed(0)}`, vx, y + 8, { width: vw, align: "right" });
    y += 42;

    // Footer
    const fY = doc.page.height - 40;
    doc.rect(0, fY, 595, 40).fill("#f3f4f6");
    doc.font("Helvetica").fontSize(8).fillColor(gray).text(`Thank you for shopping with ${storeName}!  |  This is a computer generated invoice.`, 40, fY + 14, { width: W, align: "center" });

    doc.end();
  });
}

router.put("/admin/orders/:id/items", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { items, total } = req.body;
  if (!Array.isArray(items) || typeof total !== "number") {
    res.status(400).json({ error: "items array and total number required" });
    return;
  }
  await db.update(ordersTable).set({ items: items as any, total: total.toFixed(2) }).where(eq(ordersTable.id, id as string));
  res.json({ success: true });
});

router.post("/admin/orders/:id/send-bill", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id as string));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  const storeName = await getStoreName();
  const orderId = String(id).slice(0, 8).toUpperCase();

  try {
    const pdfBuffer = await generateInvoicePdf({ ...order, total: Number(order.total), couponDiscount: order.couponDiscount ? Number(order.couponDiscount) : 0 }, storeName);
    const waConnected = isWhatsAppConnected();
    if (waConnected && order.phone) {
      const caption = `*Invoice for Order #${orderId}*\n\nHi ${order.name || ""}, please find your invoice attached.\n\nThank you for shopping with ${storeName}!`;
      const result = await sendWhatsAppDocument(order.phone, pdfBuffer, `Invoice_${orderId}.pdf`, caption);
      if (result.success) {
        addNotification({ type: "whatsapp", phone: order.phone, message: `[WhatsApp] Invoice sent for order #${orderId}`, timestamp: new Date().toISOString() });
        res.json({ success: true, sent: "whatsapp" });
      } else {
        res.status(500).json({ error: "WhatsApp send failed", detail: result.error });
      }
    } else {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Invoice_${orderId}.pdf"`);
      res.send(pdfBuffer);
    }
  } catch (err: any) {
    console.error("[send-bill] PDF error:", err);
    res.status(500).json({ error: "Failed to generate PDF", detail: err.message });
  }
});

router.put("/admin/orders/:id/delivery-slot", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const deliverySlot = typeof req.body?.deliverySlot === "string" ? req.body.deliverySlot.trim() : "";

  if (!deliverySlot) {
    res.status(400).json({ error: "Bad Request", message: "deliverySlot is required" });
    return;
  }

  await db.update(ordersTable).set({ deliverySlot }).where(eq(ordersTable.id, id as string));
  const [updated] = await db.select().from(ordersTable).where(eq(ordersTable.id, id as string));

  if (!updated) {
    res.status(404).json({ error: "Not Found", message: "Order not found" });
    return;
  }

  const orderId = String(id).slice(0, 8).toUpperCase();
  const sName = await getStoreName();
  const baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN || "store.app"}`;
  const trackUrl = `${baseUrl}/order/${id}`;
  const shopUrl = `${baseUrl}/`;

  const waMessage = `🕐 *Delivery Schedule Updated*\n\nHi ${updated.name || ""},\nYour order *#${orderId}* delivery has been rescheduled.\n\n📅 New Delivery Slot: *${deliverySlot}*\n\nTotal: ₹${Number(updated.total)}\n\n━━━━━━━━━━━━━━━\n📦 *Track Order* 👇\n${trackUrl}\n\n🛒 *Shop Again* 👇\n${shopUrl}`;
  const smsMessage = `${sName}: Your order #${orderId} delivery slot updated to: ${deliverySlot}`;

  const waConnected = isWhatsAppConnected();
  let orderUpdatesEnabled = false;
  try {
    const [setting] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "whatsapp_order_updates"));
    orderUpdatesEnabled = setting?.value === true || setting?.value === "true";
  } catch {}

  if (waConnected && orderUpdatesEnabled && updated.phone) {
    sendWhatsAppMessage(updated.phone, waMessage).catch(() => {});
    addNotification({ type: "whatsapp", phone: updated.phone, message: `[WhatsApp] Delivery slot updated to: ${deliverySlot}`, timestamp: new Date().toISOString() });
  } else {
    addNotification({ type: "sms", phone: updated.phone, message: smsMessage, timestamp: new Date().toISOString() });
  }

  res.json({ id: updated.id, deliverySlot: updated.deliverySlot });
});

router.get("/admin/settings", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const settings = await db.select().from(siteSettingsTable);
  const result: Record<string, any> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }
  res.json(result);
});

const ALLOWED_SETTINGS_KEYS = new Set([
  "store_config", "store_city", "delivery_slots", "hidden_categories",
  "homepage_banners", "homepage_value_props", "homepage_sections",
  "auto_sections_enabled", "auto_round_prices",
  "whatsapp_number", "whatsapp_order_updates", "whatsapp_product_alerts",
  "bottom_nav", "delivery_range", "online_payments_enabled",
]);

router.put("/admin/settings", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({ error: "Bad Request", message: "Settings object is required" });
    return;
  }
  const entries = Object.entries(req.body).filter(([key]) => ALLOWED_SETTINGS_KEYS.has(key));
  for (const [key, value] of entries) {
    const [existing] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key));
    if (existing) {
      await db.update(siteSettingsTable).set({ value: value as any }).where(eq(siteSettingsTable.key, key));
    } else {
      await db.insert(siteSettingsTable).values({ key, value: value as any });
    }
  }
  res.json({ success: true });
});

async function updateCategoryProductCount(categoryId: number) {
  const [result] = await db.select({ total: count() }).from(productsTable).where(eq(productsTable.categoryId, categoryId));
  await db.update(categoriesTable).set({ productCount: result?.total ?? 0 }).where(eq(categoriesTable.id, categoryId));
}

router.get("/admin/notifications", requireAdmin, (_req: Request, res: Response): void => {
  const allNotifications = getNotifications();
  res.json(allNotifications.slice().reverse());
});

router.get("/admin/whatsapp/status", requireAdmin, (_req: Request, res: Response): void => {
  res.json(getWhatsAppState());
});

router.post("/admin/whatsapp/connect", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    startWhatsAppSession();
    res.json({ success: true, message: "WhatsApp session starting. Poll /admin/whatsapp/status for QR code." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/admin/whatsapp/disconnect", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    await disconnectWhatsApp();
    res.json({ success: true, message: "WhatsApp disconnected" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/admin/whatsapp/send", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const phone = typeof req.body?.phone === "string" ? req.body.phone.trim().slice(0, 20) : "";
  const message = typeof req.body?.message === "string" ? req.body.message.trim().slice(0, 2000) : "";
  if (!phone || !message) {
    res.status(400).json({ error: "Bad Request", message: "Phone and message are required" });
    return;
  }
  const result = await sendWhatsAppMessage(phone, message);
  res.json(result);
});

router.get("/admin/sms/status", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const status = await getSmsStatus();
  res.json(status);
});

router.post("/admin/sms/api-key", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const apiKey = typeof req.body?.apiKey === "string" ? req.body.apiKey.trim() : "";
  if (!apiKey) {
    res.status(400).json({ error: "Bad Request", message: "API key is required" });
    return;
  }
  const [existing] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "fast2sms_api_key"));
  if (existing) {
    await db.update(siteSettingsTable).set({ value: apiKey }).where(eq(siteSettingsTable.key, "fast2sms_api_key"));
  } else {
    await db.insert(siteSettingsTable).values({ key: "fast2sms_api_key", value: apiKey });
  }
  res.json({ success: true });
});

router.delete("/admin/sms/api-key", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  await db.delete(siteSettingsTable).where(eq(siteSettingsTable.key, "fast2sms_api_key"));
  res.json({ success: true });
});

router.get("/settings/public", async (_req: Request, res: Response): Promise<void> => {
  const settings = await db.select().from(siteSettingsTable);
  const result: Record<string, any> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }
  res.json(result);
});

router.get("/admin/fetcher/search-image", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const query = (req.query.q as string || "").trim();
  if (!query) { res.json({ imageUrl: "" }); return; }

  try {
    const searchUrl = `https://www.bigbasket.com/product/get-products/?slug=${encodeURIComponent(query.toLowerCase().replace(/\s+/g, "-"))}&type=product&page=1`;
    const resp = await fetch(`https://www.bigbasket.com/listing-svc/v2/products?type=pc&slug=${encodeURIComponent(query.toLowerCase().replace(/\s+/g, "-"))}&page=1&size=1`, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
    });

    if (resp.ok) {
      const data = await resp.json();
      const products = data?.tabs?.[0]?.product_info?.products || data?.products || [];
      if (products.length > 0) {
        const img = products[0]?.absolute_url
          ? `https://www.bbassets.com/media/uploads/p/l/${products[0].sku}_${products[0].product_slug || ""}.jpg`
          : "";
        if (img) { res.json({ imageUrl: img }); return; }
      }
    }
  } catch {}

  try {
    const allProducts = getAllBBProducts();
    const q = query.toLowerCase();
    for (const entry of allProducts) {
      for (const p of entry.products) {
        if (p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase().split(" ")[0])) {
          res.json({ imageUrl: p.imageUrl }); return;
        }
      }
    }
  } catch {}

  res.json({ imageUrl: "" });
});

router.get("/admin/fetcher/search-images", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const query = (req.query.q as string || "").trim();
  if (!query) { res.json({ images: [] }); return; }

  const images: { url: string; name: string }[] = [];

  try {
    const allProducts = getAllBBProducts();
    const q = query.toLowerCase();
    for (const entry of allProducts) {
      for (const p of entry.products) {
        if (p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase().split(" ")[0])) {
          images.push({ url: p.imageUrl, name: p.name });
          if (images.length >= 8) break;
        }
      }
      if (images.length >= 8) break;
    }
  } catch {}

  res.json({ images });
});

router.post("/admin/generate-description", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const b = req.body ?? {};
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 200) : "";
  const category = typeof b.category === "string" ? b.category.trim().slice(0, 100) : undefined;
  const unit = typeof b.unit === "string" ? b.unit.trim().slice(0, 50) : undefined;
  const quantity = typeof b.quantity === "string" ? b.quantity.trim().slice(0, 50) : undefined;
  if (!name) { res.status(400).json({ error: "Bad Request", message: "Product name required" }); return; }

  try {
    const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

    if (!baseUrl || !apiKey) {
      const desc = generateFallbackDescription(name, category, unit, quantity);
      res.json({ description: desc });
      return;
    }

    const prompt = `Write a short, appealing product description (2-3 sentences, max 150 chars) for an Indian grocery product: "${name}"${category ? ` in category "${category}"` : ""}${quantity ? `, size: ${quantity}` : ""}. Be concise, highlight freshness/quality. No quotes around the description.`;

    const aiResp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-5-nano",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (aiResp.ok) {
      const data = await aiResp.json();
      const desc = data.choices?.[0]?.message?.content?.trim() || generateFallbackDescription(name, category, unit, quantity);
      res.json({ description: desc });
    } else {
      res.json({ description: generateFallbackDescription(name, category, unit, quantity) });
    }
  } catch {
    res.json({ description: generateFallbackDescription(name, category, unit, quantity) });
  }
});

function generateFallbackDescription(name: string, category?: string, unit?: string, quantity?: string): string {
  const n = name.toLowerCase();
  const templates: Record<string, string[]> = {
    vegetables: [
      `Fresh ${name.toLowerCase()} — handpicked, farm-fresh quality. Perfect for everyday Indian cooking.`,
      `Premium quality ${name.toLowerCase()}. Sourced directly from local farms for maximum freshness.`,
    ],
    fruits: [
      `Juicy, naturally ripened ${name.toLowerCase()}. Rich in vitamins and perfect for healthy snacking.`,
      `Sweet and fresh ${name.toLowerCase()} — carefully selected for the best taste and quality.`,
    ],
    dairy: [
      `Fresh ${name.toLowerCase()} — pure, hygienic and delivered chilled to your doorstep.`,
    ],
    default: [
      `Premium quality ${name.toLowerCase()}${quantity ? ` (${quantity})` : ""}. Fresh and carefully packed for the best experience.`,
      `${name} — top quality, great value. Delivered fresh to your door in minutes.`,
    ],
  };
  const cat = (category || "default").toLowerCase();
  const pool = templates[cat] || templates.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

router.get("/admin/fetcher/categories", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  res.json(BB_CATEGORIES);
});

router.post("/admin/fetcher/fetch", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const b = req.body ?? {};
  const mode = b.mode === "category" ? "category" : "all";
  const categorySlug = typeof b.categorySlug === "string" ? b.categorySlug.trim().slice(0, 100) : undefined;
  const clearExisting = b.clearExisting === true;

  if (mode === "category" && !categorySlug) {
    res.status(400).json({ error: "Bad Request", message: "categorySlug required for category mode" });
    return;
  }

  const results: { category: string; added: number; error?: string }[] = [];
  const configuredDeliveryTime = await getConfiguredDeliveryTime();

  if (clearExisting) {
    await db.delete(productsTable);
    await db.delete(categoriesTable);
  }

  if (mode === "all") {
    const allData = getAllBBProducts();
    for (const entry of allData) {
      try {
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

        let added = 0;
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
            deliveryTime: configuredDeliveryTime,
          });
          added++;
        }
        await updateCategoryProductCount(catId);
        results.push({ category: entry.category.name, added });
      } catch (err: any) {
        results.push({ category: entry.category.name, added: 0, error: err.message });
      }
    }
  } else if (mode === "category" && categorySlug) {
    const bbCat = BB_CATEGORIES.find(c => c.slug === categorySlug);
    if (!bbCat) {
      res.status(400).json({ error: "Invalid category slug" });
      return;
    }

    const products = getBBProductsForCategory(categorySlug);
    const [existingCat] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, categorySlug));
    let catId: number;
    if (existingCat) {
      catId = existingCat.id;
    } else {
      const [newCat] = await db.insert(categoriesTable).values({
        name: bbCat.name,
        slug: bbCat.slug,
        icon: bbCat.emoji,
        color: bbCat.color,
        productCount: 0,
      }).returning();
      catId = newCat.id;
    }

    let added = 0;
    for (const prod of products) {
      await db.insert(productsTable).values({
        name: prod.name,
        description: prod.description,
        price: String(Math.ceil(prod.price)),
        originalPrice: String(Math.ceil(prod.originalPrice)),
        discount: prod.discount,
        unit: prod.unit,
        quantity: prod.quantity,
        categoryId: catId,
        categoryName: bbCat.name,
        imageUrl: prod.imageUrl,
        inStock: prod.inStock,
        rating: String(prod.rating),
        reviewCount: prod.reviewCount,
        isFeatured: prod.isFeatured,
        isOrganic: prod.isOrganic,
        tags: prod.tags,
        deliveryTime: configuredDeliveryTime,
      });
      added++;
    }
    await updateCategoryProductCount(catId);
    results.push({ category: bbCat.name, added });
  }

  const allCategories = await db.select().from(categoriesTable).orderBy(categoriesTable.id);
  const [existing] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "auto_sections_enabled"));
  const autoSectionsEnabled = existing?.value === true || existing?.value === "true";

  if (autoSectionsEnabled) {
    await autoAssignSections(allCategories);
  }

  const totalAdded = results.reduce((sum, r) => sum + r.added, 0);
  res.json({ success: true, totalAdded, results });
});

router.post("/admin/clear-products", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  await db.delete(productsTable);
  const cats = await db.select().from(categoriesTable);
  for (const cat of cats) {
    await db.update(categoriesTable).set({ productCount: 0 }).where(eq(categoriesTable.id, cat.id));
  }
  res.json({ success: true });
});

router.post("/admin/bulk-discount", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const b = req.body ?? {};
  const action = typeof b.action === "string" ? b.action.trim() : "";
  const applyTo = typeof b.applyTo === "string" ? b.applyTo.trim() : "";
  const categoryId = b.categoryId !== undefined ? Number(b.categoryId) : undefined;
  const productIds = Array.isArray(b.productIds) ? b.productIds.map((id: any) => Number(id)).filter((n: number) => !isNaN(n)).slice(0, 1000) : [];

  if (!["apply", "remove"].includes(action)) {
    res.status(400).json({ error: "Bad Request", message: "Valid action (apply/remove) is required" });
    return;
  }

  if (action === "apply") {
    const pct = Number(b.discountPercent);
    if (!pct || pct < 1 || pct > 90) {
      res.status(400).json({ message: "Discount must be between 1% and 90%" });
      return;
    }

    let products;
    if (applyTo === "products" && productIds && Array.isArray(productIds) && productIds.length > 0) {
      products = await db.select().from(productsTable).where(sql`${productsTable.id} IN (${sql.join(productIds.map((id: number) => sql`${id}`), sql`, `)})`);
    } else if (applyTo === "category" && categoryId) {
      products = await db.select().from(productsTable).where(eq(productsTable.categoryId, Number(categoryId)));
    } else {
      products = await db.select().from(productsTable);
    }

    let updated = 0;
    for (const prod of products) {
      const originalPrice = Number(prod.originalPrice) || Number(prod.price);
      const discountedPrice = Math.ceil(originalPrice * (1 - pct / 100));
      if (discountedPrice > 0 && discountedPrice < originalPrice) {
        await db.update(productsTable).set({
          price: String(discountedPrice),
          originalPrice: String(Math.ceil(originalPrice)),
          discount: pct,
        }).where(eq(productsTable.id, prod.id));
        updated++;
      }
    }

    res.json({ success: true, updated, action: "apply", discountPercent: pct });
  } else if (action === "remove") {
    let products;
    if (applyTo === "products" && productIds.length > 0) {
      products = await db.select().from(productsTable).where(sql`${productsTable.id} IN (${sql.join(productIds.map((id: number) => sql`${id}`), sql`, `)})`);
    } else if (applyTo === "category" && categoryId) {
      products = await db.select().from(productsTable).where(eq(productsTable.categoryId, categoryId));
    } else {
      products = await db.select().from(productsTable);
    }

    let updated = 0;
    for (const prod of products) {
      if (prod.discount && prod.discount > 0) {
        const originalPrice = Number(prod.originalPrice) || Number(prod.price);
        await db.update(productsTable).set({
          price: String(Math.ceil(originalPrice)),
          discount: 0,
        }).where(eq(productsTable.id, prod.id));
        updated++;
      }
    }

    res.json({ success: true, updated, action: "remove" });
  } else {
    res.status(400).json({ message: "Invalid action. Use 'apply' or 'remove'." });
  }
});

router.post("/admin/round-prices", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  const products = await db.select().from(productsTable);
  let updated = 0;
  for (const prod of products) {
    const roundedPrice = Math.ceil(Number(prod.price));
    const roundedOriginal = Math.ceil(Number(prod.originalPrice));
    if (roundedPrice !== Number(prod.price) || roundedOriginal !== Number(prod.originalPrice)) {
      const discount = roundedOriginal > roundedPrice ? Math.round(((roundedOriginal - roundedPrice) / roundedOriginal) * 100) : 0;
      await db.update(productsTable).set({
        price: String(roundedPrice),
        originalPrice: String(roundedOriginal),
        discount,
      }).where(eq(productsTable.id, prod.id));
      updated++;
    }
  }
  res.json({ success: true, updated });
});

async function autoAssignSections(categories: any[]) {
  const SECTION_MAP: Record<string, { title: string; subtitle: string; emoji: string; bgFrom: string; bgTo: string; accentColor: string; type: string }> = {
    vegetables: { title: "Fresh Vegetables", subtitle: "Farm-fresh daily picks", emoji: "🥦", bgFrom: "#ecfdf5", bgTo: "#d1fae5", accentColor: "#15803d", type: "category" },
    fruits: { title: "Fresh Fruits", subtitle: "Seasonal & exotic fruits", emoji: "🍎", bgFrom: "#fef2f2", bgTo: "#fecaca", accentColor: "#dc2626", type: "category" },
    "dairy-eggs": { title: "Dairy & Breakfast", subtitle: "Milk, curd, cheese, eggs & more", emoji: "🥛", bgFrom: "#eff6ff", bgTo: "#dbeafe", accentColor: "#2563eb", type: "category" },
    snacks: { title: "Munchies & Snacks", subtitle: "Crunchy, tasty & irresistible", emoji: "🍿", bgFrom: "#fff7ed", bgTo: "#ffedd5", accentColor: "#ea580c", type: "category" },
    beverages: { title: "Beverages", subtitle: "Juices, cold drinks & more", emoji: "🥤", bgFrom: "#ecfeff", bgTo: "#cffafe", accentColor: "#0891b2", type: "category" },
    bakery: { title: "Bakery & Bread", subtitle: "Freshly baked goodness", emoji: "🍞", bgFrom: "#fffbeb", bgTo: "#fef3c7", accentColor: "#b45309", type: "category" },
    "meat-fish": { title: "Meat & Fish", subtitle: "Fresh cuts, cleaned & ready to cook", emoji: "🍗", bgFrom: "#fff1f2", bgTo: "#ffe4e6", accentColor: "#be123c", type: "category" },
    "grains-pulses": { title: "Kitchen Staples", subtitle: "Atta, rice, dal & more at best prices", emoji: "🌾", bgFrom: "#fffbeb", bgTo: "#fef3c7", accentColor: "#a16207", type: "category" },
    "spices-masala": { title: "Spices & Masala", subtitle: "Aromatic flavors for your kitchen", emoji: "🌶️", bgFrom: "#fef2f2", bgTo: "#fecaca", accentColor: "#dc2626", type: "category" },
    "tea-coffee": { title: "Tea & Coffee", subtitle: "Start your morning right", emoji: "☕", bgFrom: "#fdf4ff", bgTo: "#fae8ff", accentColor: "#78350f", type: "category" },
    "dry-fruits": { title: "Dry Fruits & Nuts", subtitle: "Premium quality nuts & seeds", emoji: "🥜", bgFrom: "#fefce8", bgTo: "#fef9c3", accentColor: "#92400e", type: "category" },
    "oil-ghee": { title: "Oil & Ghee", subtitle: "Cooking oils & pure desi ghee", emoji: "🫒", bgFrom: "#f0fdf4", bgTo: "#dcfce7", accentColor: "#65a30d", type: "category" },
    cleaning: { title: "Cleaning & Household", subtitle: "Keep your home sparkling", emoji: "🧹", bgFrom: "#f5f3ff", bgTo: "#ede9fe", accentColor: "#7c3aed", type: "category" },
    "personal-care": { title: "Personal Care", subtitle: "Grooming & hygiene essentials", emoji: "🧴", bgFrom: "#fdf2f8", bgTo: "#fce7f3", accentColor: "#ec4899", type: "category" },
    "frozen-foods": { title: "Frozen Foods", subtitle: "Ready-to-cook convenience", emoji: "🧊", bgFrom: "#f0f9ff", bgTo: "#e0f2fe", accentColor: "#0284c7", type: "category" },
    "baby-care": { title: "Baby Care", subtitle: "Everything for your little one", emoji: "🍼", bgFrom: "#fdf2f8", bgTo: "#fce7f3", accentColor: "#ec4899", type: "category" },
  };

  const sections: any[] = [
    { id: "super_deals", title: "Super Deals — Up to 40% OFF", subtitle: "Grab before they're gone!", emoji: "🔥", bgFrom: "#fffbeb", bgTo: "#fef3c7", accentColor: "#b45309", type: "deals", visible: true },
  ];

  for (const cat of categories) {
    const mapping = SECTION_MAP[cat.slug];
    if (mapping) {
      sections.push({
        id: `section_${cat.slug}`,
        ...mapping,
        categorySlug: cat.slug,
        visible: true,
      });
    }
  }

  const [existing] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "homepage_sections"));
  if (existing) {
    await db.update(siteSettingsTable).set({ value: sections }).where(eq(siteSettingsTable.key, "homepage_sections"));
  } else {
    await db.insert(siteSettingsTable).values({ key: "homepage_sections", value: sections as any });
  }
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/admin/products/upload-image", requireAdmin, upload.single("image"), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Bad Request", message: "No image file provided" });
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      res.status(400).json({ error: "Bad Request", message: "Only JPEG, PNG, WebP and GIF images are allowed" });
      return;
    }

    const result = await imageStorage.upload(req.file.buffer, req.file.mimetype);
    res.json({ success: true, url: result.url });
  } catch (err: any) {
    console.error("[ImageUpload] Error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to upload image" });
  }
});

router.get("/uploads/product-images/:file", async (req: Request, res: Response): Promise<void> => {
  try {
    await imageStorage.serve(req.params.file, res);
  } catch (err: any) {
    console.error("[ImageServe] Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export { requireAdmin };
export default router;
