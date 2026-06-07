import { Router, type IRouter } from "express";
import { db, cartItemsTable, ordersTable, productsTable, addressesTable, siteSettingsTable, couponsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { optionalUser, addNotification } from "./auth";
import { isWhatsAppConnected, sendWhatsAppMessage } from "../whatsapp-service";
import { getConfiguredDeliveryTime, getStoreName } from "../lib/delivery-config";

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

const router: IRouter = Router();

router.post("/orders", optionalUser, async (req, res): Promise<void> => {
  const b = req.body ?? {};
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 200) : "";
  const phone = typeof b.phone === "string" ? b.phone.trim().slice(0, 20) : "";
  const address = typeof b.address === "string" ? b.address.trim().slice(0, 500) : "";
  const city = typeof b.city === "string" ? b.city.trim().slice(0, 100) : "";
  const landmark = typeof b.landmark === "string" ? b.landmark.trim().slice(0, 200) : "";
  const pincode = typeof b.pincode === "string" ? b.pincode.trim().slice(0, 10) : "";
  const paymentMethod = typeof b.paymentMethod === "string" ? b.paymentMethod.trim() : "";
  const deliveryInstructions = typeof b.deliveryInstructions === "string" ? b.deliveryInstructions.trim().slice(0, 500) : "";
  const deliverySlot = typeof b.deliverySlot === "string" ? b.deliverySlot.trim().slice(0, 200) : null;

  if (!name || !phone || !address || !paymentMethod) {
    res.status(400).json({ error: "Bad Request", message: "Name, phone, address, and payment method are required" });
    return;
  }

  const validPaymentMethods = ["cod", "cash", "upi", "card"];
  if (!validPaymentMethods.includes(paymentMethod)) {
    res.status(400).json({ error: "Bad Request", message: "Invalid payment method" });
    return;
  }

  try {
    const [rangeSetting] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "delivery_range"));
    const rangeVal = typeof rangeSetting?.value === "string" ? rangeSetting.value.replace(/^"|"$/g, "").trim() : "";
    const deliveryRange = rangeVal === "all_india" ? "all_india" : "city_only";

    if (deliveryRange === "city_only") {
      const [citySetting] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "store_city"));
      let storeCity = "Nagpur";
      if (citySetting?.value) {
        const v = citySetting.value;
        storeCity = (typeof v === "string" ? v : String(v)).replace(/^"|"$/g, "");
      }
      const orderCity = (city || "").trim().toLowerCase();
      if (!orderCity || orderCity !== storeCity.trim().toLowerCase()) {
        res.status(400).json({ error: "Bad Request", message: `Sorry, we currently don't deliver outside ${storeCity}. We'll be expanding soon!` });
        return;
      }
    }
  } catch (err) {
    console.error("Delivery range check failed:", err);
    res.status(503).json({ error: "Service Unavailable", message: "Unable to verify delivery availability. Please try again." });
    return;
  }

  const cartItems = await db.select().from(cartItemsTable);

  if (cartItems.length === 0) {
    res.status(400).json({ error: "Bad Request", message: "Cart is empty" });
    return;
  }

  let total = 0;
  const enrichedItems = [];

  for (const item of cartItems) {
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, Number(item.productId)));

    if (!product) continue;

    const basePrice = Number(product.price);
    let itemPrice = basePrice;
    const variantLabel = (item as any).variantLabel || null;
    if (variantLabel) {
      const vp = (product.variantPrices as Record<string, number>) || {};
      if (vp[variantLabel] !== undefined && Number(vp[variantLabel]) > 0) {
        itemPrice = Number(vp[variantLabel]);
      } else if (product.quantity) {
        const baseGrams = parseWeightToGrams(product.quantity);
        const variantGrams = parseWeightToGrams(variantLabel);
        if (baseGrams && variantGrams && baseGrams > 0) {
          itemPrice = Math.round((basePrice * variantGrams) / baseGrams);
        }
      }
    }

    total += itemPrice * item.quantity;

    enrichedItems.push({
      productId: item.productId,
      variantLabel,
      variantPrice: itemPrice,
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

  const incomingCoupon = typeof b.couponCode === "string" ? b.couponCode.trim().toUpperCase().slice(0, 50) : "";
  let couponDiscount = 0;
  let appliedCouponCode: string | null = null;

  const orderId = randomUUID();
  const deliveryFee = total >= 299 ? 0 : 25;

  const now = new Date();
  const deliveryTimeStr = await getConfiguredDeliveryTime();
  let deliveryMs = 24 * 60 * 60 * 1000;
  const match = deliveryTimeStr.match(/(\d+)\s*(min|hour|hr|day)/i);
  if (match) {
    const val = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    if (unit.startsWith("min")) deliveryMs = val * 60 * 1000;
    else if (unit.startsWith("hour") || unit.startsWith("hr")) deliveryMs = val * 60 * 60 * 1000;
    else if (unit.startsWith("day")) deliveryMs = val * 24 * 60 * 60 * 1000;
  }
  const estimatedDelivery = new Date(now.getTime() + deliveryMs).toISOString();

  const user = (req as any).user;

  let finalTotal = 0;
  let couponFailed = false;

  await db.transaction(async (tx) => {
    if (incomingCoupon) {
      const result = await tx.execute(sql`
        UPDATE coupons
        SET used_count = used_count + 1
        WHERE code = ${incomingCoupon}
          AND active = true
          AND (expires_at IS NULL OR expires_at >= NOW())
          AND (max_uses = 0 OR used_count < max_uses)
          AND ${total} >= COALESCE(min_order, 0)
        RETURNING id, code, type, value
      `);
      const coupon = result.rows?.[0];
      if (coupon) {
        if (coupon.type === "percentage") {
          couponDiscount = Math.round((total * Number(coupon.value)) / 100);
        } else {
          couponDiscount = Math.min(Number(coupon.value), total);
        }
        appliedCouponCode = String(coupon.code);
      } else {
        couponFailed = true;
        tx.rollback();
        return;
      }
    }

    finalTotal = Math.round((total + deliveryFee - couponDiscount) * 100) / 100;

    await tx.insert(ordersTable).values({
      id: orderId,
      userId: user?.userId || null,
      items: enrichedItems,
      total: String(finalTotal),
      status: "placed",
      name,
      phone,
      address,
      paymentMethod,
      estimatedDelivery,
      deliveryInstructions: deliveryInstructions || "",
      couponCode: appliedCouponCode,
      couponDiscount: couponDiscount > 0 ? String(couponDiscount) : null,
      deliverySlot,
    });

    await tx.delete(cartItemsTable);
  }).catch((err) => {
    if (couponFailed) return;
    throw err;
  });

  if (couponFailed) {
    res.status(400).json({ error: "Bad Request", message: "Coupon is invalid, expired, or does not meet requirements" });
    return;
  }

  if (user?.userId && address) {
    try {
      const existingAddresses = await db
        .select()
        .from(addressesTable)
        .where(eq(addressesTable.userId, user.userId));

      const alreadySaved = existingAddresses.some(
        (a) => a.fullAddress.trim().toLowerCase() === address.trim().toLowerCase()
      );

      if (!alreadySaved) {
        const isFirst = existingAddresses.length === 0;
        await db.insert(addressesTable).values({
          userId: user.userId,
          label: isFirst ? "Home" : "Recent",
          fullAddress: address,
          landmark: landmark || "",
          city: city || "",
          pincode: pincode || "",
          isDefault: isFirst,
        });
      }
    } catch (_err) {
    }
  }

  const orderCode = orderId.slice(0, 8).toUpperCase();
  const itemNames = enrichedItems.map((i: any) => i.product?.name || "Item").slice(0, 3).join(", ");
  const itemsSuffix = enrichedItems.length > 3 ? ` +${enrichedItems.length - 3} more` : "";

  const waConnected = isWhatsAppConnected();
  let orderUpdatesEnabled = false;
  try {
    const [setting] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "whatsapp_order_updates"));
    orderUpdatesEnabled = setting?.value === true || setting?.value === "true";
  } catch {}

  if (waConnected && orderUpdatesEnabled && phone) {
    const storeName = await getStoreName();
    const trackUrl = `https://${process.env.REPLIT_DEV_DOMAIN || "store.app"}/order/${orderId}`;
    const shopUrl = `https://${process.env.REPLIT_DEV_DOMAIN || "store.app"}/`;
    const waMsg = `🛒 *Order Placed!*\n\nHi ${name || ""},\nYour order *#${orderCode}* has been placed successfully!\n\n*Items:* ${itemNames}${itemsSuffix}\n*Total:* ₹${finalTotal}\n*Delivery:* ${estimatedDelivery || "Soon"}\n*Payment:* ${paymentMethod === "card" ? "Card" : paymentMethod === "upi" ? "UPI" : "Cash on Delivery"}\n\nWe'll notify you when your order is confirmed. 🎉\n\n━━━━━━━━━━━━━━━\n📦 *Track Order* 👇\n${trackUrl}\n\n🛒 *Continue Shopping* 👇\n${shopUrl}`;
    sendWhatsAppMessage(phone, waMsg).catch(() => {});
    addNotification({
      type: "whatsapp",
      phone,
      message: `[WhatsApp] Order #${orderCode} placed - ₹${finalTotal} - ${itemNames}${itemsSuffix}`,
      timestamp: new Date().toISOString(),
    });
  } else {
    const storeName = await getStoreName();
    addNotification({
      type: "sms",
      phone,
      message: `Your ${storeName} order #${orderCode} has been placed! Total: ₹${finalTotal}. Track: /order/${orderId}`,
      timestamp: new Date().toISOString(),
    });
  }

  res.status(201).json({
    id: orderId,
    items: enrichedItems,
    total: finalTotal,
    status: "placed",
    estimatedDelivery,
    deliverySlot,
    createdAt: now.toISOString(),
  });
});

export default router;
