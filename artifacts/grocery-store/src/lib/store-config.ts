import { useState, useEffect } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const CACHE_KEY = "store_config";

export interface StoreConfigData {
  storeName: string;
  footerText: string;
  deliveryTagline: string;
  storeState: string;
  loginBadges: { icon: string; label: string }[];
  quickLinks: { label: string; emoji: string; link: string; bg: string; border: string }[];
  topBrands: string[];
  showTopBrands?: boolean;
  topBrandsPosition?: string;
  topBrandsBg?: string;
  faqs: { q: string; a: string }[];
  supportEmail: string;
}

function readCache(): Partial<StoreConfigData> {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

let fetchPromise: Promise<StoreConfigData | null> | null = null;

function fetchConfig(): Promise<StoreConfigData | null> {
  if (!fetchPromise) {
    fetchPromise = fetch(`${BASE}/api/settings/public`)
      .then(r => r.json())
      .then(data => {
        const sc = data.store_config || {};
        const config: StoreConfigData = {
          storeName: sc.storeName || "",
          footerText: sc.footerText || "",
          deliveryTagline: sc.deliveryTagline || "",
          storeState: sc.storeState || "",
          loginBadges: Array.isArray(sc.loginBadges) ? sc.loginBadges : [],
          quickLinks: Array.isArray(sc.quickLinks) ? sc.quickLinks : [],
          topBrands: Array.isArray(sc.topBrands) ? sc.topBrands : [],
          showTopBrands: sc.showTopBrands !== false,
          topBrandsPosition: sc.topBrandsPosition || "middle",
          topBrandsBg: sc.topBrandsBg || "dark",
          faqs: Array.isArray(sc.faqs) ? sc.faqs : [],
          supportEmail: sc.supportEmail || "",
        };
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(config)); } catch {}
        return config;
      })
      .catch(() => null);
  }
  return fetchPromise;
}

export function useStoreConfig() {
  const cached = readCache();
  const [config, setConfig] = useState<Partial<StoreConfigData>>(cached);
  const [ready, setReady] = useState(!!cached.storeName);

  useEffect(() => {
    fetchConfig().then(fresh => {
      if (fresh) setConfig(fresh);
      setReady(true);
    });
  }, []);

  return { config, ready };
}

export function preloadStoreConfig() {
  fetchConfig();
}
