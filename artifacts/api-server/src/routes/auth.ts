import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { db, usersTable, addressesTable, ordersTable, siteSettingsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { isWhatsAppConnected, sendWhatsAppMessage, getWhatsAppState } from "../whatsapp-service";
import { getStoreName } from "../lib/delivery-config";

function getFast2SMSKey(): Promise<string> {
  return (async () => {
    let apiKey = process.env.FAST2SMS_API_KEY || "";
    if (!apiKey) {
      try {
        const [setting] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "fast2sms_api_key"));
        if (setting?.value && typeof setting.value === "string") apiKey = setting.value;
      } catch {}
    }
    return apiKey;
  })();
}

async function sendSmsFast2SMS(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = await getFast2SMSKey();
    if (!apiKey) return { success: false, error: "No Fast2SMS API key configured" };

    const digits = phone.replace(/\D/g, "").slice(-10);

    const otpRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: { "authorization": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ route: "otp", variables_values: otp, numbers: digits, flash: "0" }),
    });
    const otpData = await otpRes.json();
    if (otpData.return === true || otpData.status_code === 200) {
      console.log(`[SMS] OTP sent successfully to ${digits.slice(-4)} via Fast2SMS OTP route`);
      return { success: true };
    }
    console.warn(`[SMS] Fast2SMS OTP route failed: status=${otpRes.status}, message=${otpData.message || "unknown"}`);

    console.log(`[SMS] Trying Fast2SMS quick-transactional route...`);
    const storeName = await getStoreName();
    const qRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: { "authorization": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "q",
        message: `Your ${storeName} verification code is ${otp}. Valid for 5 minutes. Do not share this code.`,
        language: "english",
        numbers: digits,
        flash: "0",
      }),
    });
    const qData = await qRes.json();
    if (qData.return === true || qData.status_code === 200) {
      console.log(`[SMS] OTP sent successfully to ${digits.slice(-4)} via Fast2SMS quick-transactional route`);
      return { success: true };
    }
    console.warn(`[SMS] Fast2SMS quick-transactional route also failed: status=${qRes.status}, message=${qData.message || "unknown"}`);
    return { success: false, error: qData.message || otpData.message || "SMS send failed" };
  } catch (err: any) {
    console.error(`[SMS] Fast2SMS request error: ${err.message}`);
    return { success: false, error: err.message || "SMS request failed" };
  }
}

export async function getSmsStatus(): Promise<{ configured: boolean; provider: string }> {
  let apiKey = process.env.FAST2SMS_API_KEY || "";
  if (!apiKey) {
    try {
      const [setting] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "fast2sms_api_key"));
      if (setting?.value && typeof setting.value === "string") apiKey = setting.value;
    } catch {}
  }
  return { configured: !!apiKey, provider: "Fast2SMS" };
}

const router: IRouter = Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too Many Requests", message: "Too many OTP requests. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  keyGenerator: (req: Request) => {
    const phone = req.body?.phone;
    if (typeof phone === "string") return phone.replace(/\D/g, "").slice(-10);
    return req.ip || "unknown";
  },
});

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too Many Requests", message: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const userSessions = new Map<string, { userId: number; phone: string; name: string; expiresAt: number }>();
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

interface Notification {
  type: string;
  phone: string;
  message: string;
  timestamp: string;
}

const notifications: Notification[] = [];

export function addNotification(notif: Notification) {
  notifications.push(notif);
}

export function getNotifications() {
  return notifications;
}

export function requireUser(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.user_token;
  if (!token || !userSessions.has(token)) {
    res.status(401).json({ error: "Unauthorized", message: "Login required" });
    return;
  }
  const session = userSessions.get(token)!;
  if (Date.now() > session.expiresAt) {
    userSessions.delete(token);
    res.status(401).json({ error: "Unauthorized", message: "Session expired" });
    return;
  }
  (req as any).user = session;
  next();
}

export function optionalUser(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.user_token;
  if (token && userSessions.has(token)) {
    const session = userSessions.get(token)!;
    if (Date.now() <= session.expiresAt) {
      (req as any).user = session;
    }
  }
  next();
}

router.post("/auth/send-otp", authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
  if (!phone || phone.replace(/\D/g, "").length < 10) {
    res.status(400).json({ error: "Bad Request", message: "Valid phone number required" });
    return;
  }

  const otp = String(Math.floor(1000 + Math.random() * 9000));
  otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

  const waConnected = isWhatsAppConnected();
  const waState = getWhatsAppState();
  const waNumber = waState.phoneNumber || "";

  const storeName = await getStoreName();

  if (waConnected) {
    const waMessage = `🔐 *${storeName} Verification*\n\nYour OTP code is:\n\n*${otp}*\n\nValid for 5 minutes. Do not share this code with anyone.\n\n━━━━━━━━━━━━━━━\n📋 Copy OTP: ${otp}`;
    const sendResult = await sendWhatsAppMessage(phone, waMessage);

    addNotification({
      type: "whatsapp",
      phone,
      message: `[WhatsApp via ${waNumber}] ${waMessage}`,
      timestamp: new Date().toISOString(),
    });

    if (sendResult.success) {
      res.json({ success: true, message: "OTP sent via WhatsApp", channel: "whatsapp", smsSent: true });
    } else {
      const smsResult = await sendSmsFast2SMS(phone, otp);
      addNotification({
        type: "sms",
        phone,
        message: `[Fallback SMS${smsResult.success ? "" : " - FAILED"}] Your ${storeName} OTP is ${otp}. Valid for 5 minutes.${smsResult.error ? ` Error: ${smsResult.error}` : ""}`,
        timestamp: new Date().toISOString(),
      });
      res.json({ success: true, message: smsResult.success ? "OTP sent via SMS" : "OTP generated", channel: "sms", smsSent: smsResult.success, smsError: smsResult.error || null });
    }
  } else {
    const smsResult = await sendSmsFast2SMS(phone, otp);
    addNotification({
      type: "sms",
      phone,
      message: `[SMS${smsResult.success ? "" : " - NOT SENT"}] Your ${storeName} OTP is ${otp}. Valid for 5 minutes.${smsResult.error ? ` (${smsResult.error})` : ""}`,
      timestamp: new Date().toISOString(),
    });
    res.json({ success: true, message: smsResult.success ? "OTP sent via SMS" : "OTP generated", channel: "sms", smsSent: smsResult.success, smsError: smsResult.error || null });
  }
});

router.post("/auth/verify-otp", loginRateLimiter, async (req: Request, res: Response): Promise<void> => {
  const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
  const otp = typeof req.body?.otp === "string" ? req.body.otp.trim() : String(req.body?.otp ?? "").trim();
  if (!phone || !otp) {
    res.status(400).json({ error: "Bad Request", message: "Phone and OTP are required" });
    return;
  }

  const stored = otpStore.get(phone);
  if (!stored || Date.now() > stored.expiresAt) {
    res.status(400).json({ error: "Bad Request", message: "OTP expired. Please request a new one." });
    return;
  }
  if (stored.otp !== otp) {
    res.status(400).json({ error: "Bad Request", message: "Invalid OTP" });
    return;
  }

  otpStore.delete(phone);

  let [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  let isNewUser = false;
  if (!user) {
    [user] = await db.insert(usersTable).values({ phone, name: "" }).returning();
    isNewUser = true;
  }

  const token = randomUUID();
  userSessions.set(token, {
    userId: user.id,
    phone: user.phone,
    name: user.name,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });

  res.cookie("user_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  res.json({ success: true, isNewUser, user: { id: user.id, phone: user.phone, name: user.name } });
});

router.post("/auth/update-profile", requireUser, async (req: Request, res: Response): Promise<void> => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 100) : "";
  if (!name) {
    res.status(400).json({ error: "Bad Request", message: "Name is required" });
    return;
  }
  const userId = (req as any).user.userId;

  await db.update(usersTable).set({ name }).where(eq(usersTable.id, userId));

  const session = [...userSessions.entries()].find(([_, v]) => v.userId === userId);
  if (session) {
    session[1].name = name;
  }

  res.json({ success: true });
});

router.get("/auth/me", (req: Request, res: Response): void => {
  const token = req.cookies?.user_token;
  if (!token || !userSessions.has(token)) {
    res.json({ user: null });
    return;
  }
  const session = userSessions.get(token)!;
  if (Date.now() > session.expiresAt) {
    userSessions.delete(token);
    res.json({ user: null });
    return;
  }
  res.json({ user: { id: session.userId, phone: session.phone, name: session.name } });
});

router.post("/auth/logout", (req: Request, res: Response): void => {
  const token = req.cookies?.user_token;
  if (token) userSessions.delete(token);
  res.clearCookie("user_token", { path: "/" });
  res.json({ success: true });
});

router.get("/auth/addresses", requireUser, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.userId;
  const addresses = await db.select().from(addressesTable).where(eq(addressesTable.userId, userId)).orderBy(desc(addressesTable.createdAt));
  res.json(addresses);
});

router.post("/auth/addresses", requireUser, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.userId;
  const b = req.body ?? {};
  const label = typeof b.label === "string" ? b.label.trim().slice(0, 50) : "Home";
  const fullAddress = typeof b.fullAddress === "string" ? b.fullAddress.trim().slice(0, 500) : "";
  const landmark = typeof b.landmark === "string" ? b.landmark.trim().slice(0, 200) : "";
  const city = typeof b.city === "string" ? b.city.trim().slice(0, 100) : "";
  const pincode = typeof b.pincode === "string" ? b.pincode.trim().slice(0, 10) : "";
  const isDefault = b.isDefault === true;

  if (!fullAddress) {
    res.status(400).json({ error: "Bad Request", message: "Address is required" });
    return;
  }

  if (isDefault) {
    await db.update(addressesTable).set({ isDefault: false }).where(eq(addressesTable.userId, userId));
  }

  const [address] = await db.insert(addressesTable).values({
    userId, label, fullAddress, landmark, city, pincode, isDefault,
  }).returning();

  res.json(address);
});

router.put("/auth/addresses/:id", requireUser, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const userId = (req as any).user.userId;
  const b = req.body ?? {};

  const isDefault = b.isDefault === true;
  if (isDefault) {
    await db.update(addressesTable).set({ isDefault: false }).where(eq(addressesTable.userId, userId));
  }

  const updateData: any = {};
  if (typeof b.label === "string") updateData.label = b.label.trim().slice(0, 50);
  if (typeof b.fullAddress === "string") updateData.fullAddress = b.fullAddress.trim().slice(0, 500);
  if (typeof b.landmark === "string") updateData.landmark = b.landmark.trim().slice(0, 200);
  if (typeof b.city === "string") updateData.city = b.city.trim().slice(0, 100);
  if (typeof b.pincode === "string") updateData.pincode = b.pincode.trim().slice(0, 10);
  if (b.isDefault !== undefined) updateData.isDefault = isDefault;

  const [existing] = await db.select().from(addressesTable).where(eq(addressesTable.id, id));
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "Not Found", message: "Address not found" });
    return;
  }

  await db.update(addressesTable).set(updateData).where(eq(addressesTable.id, id));
  const [updated] = await db.select().from(addressesTable).where(eq(addressesTable.id, id));
  res.json(updated);
});

router.delete("/auth/addresses/:id", requireUser, async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  const userId = (req as any).user.userId;
  const [existing] = await db.select().from(addressesTable).where(eq(addressesTable.id, id));
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "Not Found", message: "Address not found" });
    return;
  }
  await db.delete(addressesTable).where(eq(addressesTable.id, id));
  res.json({ success: true });
});

router.get("/auth/orders", requireUser, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.userId;
  const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, userId)).orderBy(desc(ordersTable.createdAt));
  res.json(orders.map(o => ({
    id: o.id,
    items: o.items,
    total: Number(o.total),
    status: o.status,
    name: o.name,
    phone: o.phone,
    address: o.address,
    paymentMethod: o.paymentMethod,
    estimatedDelivery: o.estimatedDelivery,
    deliveryInstructions: o.deliveryInstructions,
    deliverySlot: o.deliverySlot || null,
    createdAt: o.createdAt.toISOString(),
  })));
});

export default router;
