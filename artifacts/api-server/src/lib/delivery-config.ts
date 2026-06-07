import { db, siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

interface StoreConfig {
  storeName?: string;
  deliveryTime?: string;
  [key: string]: unknown;
}

async function getStoreConfig(): Promise<StoreConfig> {
  try {
    const [setting] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, "store_config"));
    if (setting?.value && typeof setting.value === "object") {
      return setting.value as StoreConfig;
    }
  } catch (err) {
    console.error("Failed to read store config from settings:", err);
  }
  return {};
}

export async function getStoreName(): Promise<string> {
  const config = await getStoreConfig();
  return config.storeName || "Store";
}

export async function getConfiguredDeliveryTime(): Promise<string> {
  const config = await getStoreConfig();
  if (config.deliveryTime && typeof config.deliveryTime === "string") {
    return config.deliveryTime;
  }
  return "1 Day";
}
