import { useState, useEffect } from "react";
import { Save, RotateCcw, Palette, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Zap, RefreshCw, Image, Sparkles, Search, X, MessageCircle, QrCode, Navigation, Phone } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { AdminLayout } from "./admin-layout";

const DEFAULT_BOTTOM_NAV = [
  { label: "Home", icon: "home", href: "/" },
  { label: "Categories", icon: "grid", href: "/categories" },
  { label: "Cart", icon: "cart", href: "/cart" },
  { label: "Account", icon: "user", href: "/account" },
];

const ICON_OPTIONS = [
  { value: "home", label: "Home" },
  { value: "grid", label: "Grid/Categories" },
  { value: "cart", label: "Cart" },
  { value: "user", label: "Account" },
  { value: "search", label: "Search" },
  { value: "heart", label: "Heart" },
  { value: "tag", label: "Tag/Offers" },
  { value: "package", label: "Package" },
  { value: "percent", label: "Percent" },
  { value: "star", label: "Star" },
];

const DEFAULT_SECTIONS = [
  { id: "trust_pills", title: "Trust Badges", subtitle: "Why shop with us", emoji: "✅", bgFrom: "#f0fdf4", bgTo: "#dcfce7", accentColor: "#16a34a", type: "trustpills", visible: true, buttons: [
    { emoji: "🚚", label: "Free Delivery", sublabel: "On orders ₹199+", bg: "#e8f5e9" },
    { emoji: "✅", label: "Good Quality", sublabel: "Always fresh", bg: "#eff6ff" },
    { emoji: "🔒", label: "100% Safe", sublabel: "Secure payment", bg: "#fef3c7" },
    { emoji: "↩️", label: "Easy Return", sublabel: "No questions asked", bg: "#fce7f3" },
  ]},
  { id: "super_deals", title: "Top Discounted Products", subtitle: "Best deals & offers just for you!", emoji: "🔥", bgFrom: "#fffbeb", bgTo: "#fef3c7", accentColor: "#b45309", type: "deals", visible: true },
  { id: "trending", title: "Trending Now", subtitle: "Most ordered this week", emoji: "🔥", bgFrom: "#fdf2f8", bgTo: "#fce7f3", accentColor: "#be123c", type: "category", categorySlug: "vegetables", visible: true },
  { id: "farm_fresh", title: "Farm Fresh Picks", subtitle: "Handpicked seasonal produce", emoji: "🌿", bgFrom: "#ecfdf5", bgTo: "#d1fae5", accentColor: "#15803d", type: "category", categorySlug: "fruits", visible: true, buttons: [
    { label: "Leafy Greens", bg: "#16a34a" },
    { label: "Root Veggies", bg: "#ca8a04" },
    { label: "Exotic Fruits", bg: "#dc2626" },
    { label: "Fresh Herbs", bg: "#059669" },
  ] },
  { id: "munchies", title: "Munchies & Snacks", subtitle: "Crunchy, tasty & irresistible", emoji: "🍿", bgFrom: "#fff7ed", bgTo: "#ffedd5", accentColor: "#ea580c", type: "category", categorySlug: "snacks", visible: true },
  { id: "dairy", title: "Dairy & Breakfast", subtitle: "Milk, eggs, paneer & more", emoji: "🥛", bgFrom: "#eff6ff", bgTo: "#dbeafe", accentColor: "#1d4ed8", type: "category", categorySlug: "dairy-eggs", visible: true },
  { id: "kitchen_staples", title: "Kitchen Staples", subtitle: "Atta, rice, dal & more at best prices", emoji: "🛒", bgFrom: "#fffbeb", bgTo: "#fef3c7", accentColor: "#b45309", type: "category", categorySlug: "grains-pulses", visible: true },
];

const DEFAULT_BANNERS = [
  { bgFrom: "#e8f5e9", bgTo: "#c8e6c9", tag: "FRESH DELIVERY", tagColor: "#0c831f", title: "Fresh Vegetables", sub: "Farm-fresh produce at your doorstep", img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80", cta: "Shop Now", ctaColor: "#0c831f", link: "/category/vegetables" },
  { bgFrom: "#fff8e1", bgTo: "#ffecb3", tag: "UP TO 40% OFF", tagColor: "#e65100", title: "Daily Essentials", sub: "Atta, dal, oil & more at best prices", img: "https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?w=400&q=80", cta: "Shop Deals", ctaColor: "#e65100", link: "/products" },
  { bgFrom: "#fce4ec", bgTo: "#f8bbd0", tag: "NEW ARRIVALS", tagColor: "#ad1457", title: "Premium Fruits", sub: "Mangoes, kiwis, berries & more", img: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80", cta: "Shop Fruits", ctaColor: "#ad1457", link: "/category/fruits" },
];

const DEFAULT_VALUE_PROPS = [
  { icon: "clock", color: "#0c831f", bg: "#e6f4ea", title: "Fast delivery", sub: "Lightning fast" },
  { icon: "percent", color: "#d44000", bg: "#fff0ea", title: "Best prices", sub: "Lowest guaranteed" },
  { icon: "zap", color: "#7c3aed", bg: "#f3eeff", title: "Daily fresh", sub: "From the farm" },
  { icon: "truck", color: "#0369a1", bg: "#e0f0ff", title: "Free delivery", sub: "On orders ₹299+" },
];

export function AdminSettings() {
  const [sections, setSections] = useState(DEFAULT_SECTIONS as any[]);
  const [banners, setBanners] = useState(DEFAULT_BANNERS as any[]);
  const [valueProps, setValueProps] = useState(DEFAULT_VALUE_PROPS as any[]);
  const [storeName, setStoreName] = useState("");
  const [storeCity, setStoreCity] = useState("Nagpur");
  const [storeState, setStoreState] = useState("Maharashtra");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliveryTagline, setDeliveryTagline] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("25");
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState("299");
  const [footerText, setFooterText] = useState("Groceries delivered to your doorstep. Fresh produce, dairy, snacks & more.");
  const [deliveryRange, setDeliveryRange] = useState<"city_only" | "all_india">("city_only");
  const [supportEmail, setSupportEmail] = useState("");
  const [loginBadges, setLoginBadges] = useState([
    { icon: "clock", label: "10 min delivery" },
    { icon: "shield", label: "Secure payments" },
    { icon: "truck", label: "Free delivery ₹299+" },
  ]);
  const [quickLinks, setQuickLinks] = useState([
    { label: "Atta & Flour", emoji: "🌾", border: "border-amber-200", bg: "bg-amber-50", link: "/category/grains-pulses" },
    { label: "Rice & Dal", emoji: "🍚", border: "border-yellow-200", bg: "bg-yellow-50", link: "/category/grains-pulses" },
    { label: "Oil & Ghee", emoji: "🫒", border: "border-green-200", bg: "bg-green-50", link: "/category/oil-ghee" },
    { label: "Masala", emoji: "🌶️", border: "border-red-200", bg: "bg-red-50", link: "/category/spices-masala" },
    { label: "Tea & Coffee", emoji: "🍵", border: "border-emerald-200", bg: "bg-emerald-50", link: "/category/tea-coffee" },
    { label: "Biscuits", emoji: "🍪", border: "border-orange-200", bg: "bg-orange-50", link: "/category/snacks" },
    { label: "Bread", emoji: "🍞", border: "border-yellow-200", bg: "bg-yellow-50", link: "/category/bakery" },
    { label: "Eggs", emoji: "🥚", border: "border-slate-200", bg: "bg-slate-50", link: "/category/dairy-eggs" },
  ] as any[]);
  const [topBrands, setTopBrands] = useState(["Amul", "Tata", "Mother Dairy", "Haldiram's", "Britannia", "Nestle", "ITC", "Parle"]);
  const [newBrand, setNewBrand] = useState("");
  const [faqs, setFaqs] = useState([
    { q: "What are the delivery hours?", a: "We deliver from 7 AM to 10 PM, 7 days a week." },
    { q: "How do I return or replace an item?", a: "Go to My Orders, select the order, and tap 'Report Issue'." },
    { q: "What payment methods are accepted?", a: "UPI, credit/debit cards, net banking, wallet, and cash on delivery." },
    { q: "Is there a minimum order value?", a: "No minimum. Delivery fee may apply on smaller orders." },
  ] as { q: string; a: string }[]);
  const [autoSections, setAutoSections] = useState(false);
  const [autoRoundPrices, setAutoRoundPrices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [expandedBanner, setExpandedBanner] = useState<number | null>(null);
  const [roundingPrices, setRoundingPrices] = useState(false);
  const [roundResult, setRoundResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"store" | "banners" | "valueprops" | "sections" | "navigation" | "automation" | "integrations" | "customization">("store");
  const [sectionProductSearch, setSectionProductSearch] = useState("");
  const [sectionProductResults, setSectionProductResults] = useState<any[]>([]);
  const [sectionSearchLoading, setSectionSearchLoading] = useState(false);
  const [showQuickLinks, setShowQuickLinks] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [showTopBrands, setShowTopBrands] = useState(true);
  const [topBrandsPosition, setTopBrandsPosition] = useState<"top" | "middle" | "bottom">("middle");
  const [topBrandsBg, setTopBrandsBg] = useState<"dark" | "green" | "light">("dark");
  const [onlinePaymentsEnabled, setOnlinePaymentsEnabled] = useState(true);
  const [homepageLayout, setHomepageLayout] = useState<"layout1" | "layout2">("layout1");
  const [deliverySlots, setDeliverySlots] = useState([
    { label: "Morning", sub: "8 AM - 11 AM", icon: "🌅", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
    { label: "Afternoon", sub: "12 PM - 3 PM", icon: "☀️", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
    { label: "Evening", sub: "5 PM - 8 PM", icon: "🌆", days: ["Mon","Tue","Wed","Thu","Fri","Sat"] },
  ] as {label:string;sub:string;icon:string;days?:string[]}[]);
  const [todayCutoff, setTodayCutoff] = useState("15:00");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [whatsappOrderUpdates, setWhatsappOrderUpdates] = useState(false);
  const [whatsappProductAlerts, setWhatsappProductAlerts] = useState(false);
  const [waStatus, setWaStatus] = useState<"disconnected" | "qr_ready" | "connecting" | "connected">("disconnected");
  const [waQrDataUrl, setWaQrDataUrl] = useState<string | null>(null);
  const [waPhoneNumber, setWaPhoneNumber] = useState<string | null>(null);
  const [waError, setWaError] = useState<string | null>(null);
  const [waPolling, setWaPolling] = useState(false);
  const [bottomNav, setBottomNav] = useState(DEFAULT_BOTTOM_NAV as any[]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [smsConfigured, setSmsConfigured] = useState(false);
  const [smsProvider, setSmsProvider] = useState("Fast2SMS");
  const [smsApiKeyInput, setSmsApiKeyInput] = useState("");
  const [smsSaving, setSmsSaving] = useState(false);

  useEffect(() => {
    adminApi.getCategories().then(data => setAllCategories(data)).catch(() => {});
    adminApi.smsStatus().then(s => { setSmsConfigured(s.configured); setSmsProvider(s.provider || "Fast2SMS"); }).catch(() => {});
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    adminApi.getSettings()
      .then(data => {
        if (data.homepage_sections) setSections(data.homepage_sections);
        if (data.homepage_banners) setBanners(data.homepage_banners);
        if (data.homepage_value_props) setValueProps(data.homepage_value_props);
        if (data.store_config) {
          setStoreName(data.store_config.storeName || "");
          setDeliveryTime(data.store_config.deliveryTime || "");
          setDeliveryTagline(data.store_config.deliveryTagline ?? "");
          setDeliveryFee(String(data.store_config.deliveryFee ?? "25"));
          setFreeDeliveryThreshold(String(data.store_config.freeDeliveryThreshold ?? "299"));
          if (data.store_config.footerText !== undefined) setFooterText(data.store_config.footerText);
          if (data.store_config.storeState !== undefined) setStoreState(data.store_config.storeState);
          if (data.store_config.supportEmail) setSupportEmail(data.store_config.supportEmail);
          if (data.store_config.loginBadges && Array.isArray(data.store_config.loginBadges)) setLoginBadges(data.store_config.loginBadges);
          if (data.store_config.quickLinks && Array.isArray(data.store_config.quickLinks)) setQuickLinks(data.store_config.quickLinks);
          if (data.store_config.topBrands && Array.isArray(data.store_config.topBrands)) setTopBrands(data.store_config.topBrands);
          if (data.store_config.faqs && Array.isArray(data.store_config.faqs)) setFaqs(data.store_config.faqs);
        }
        if (data.store_city) {
          setStoreCity(String(data.store_city).replace(/^"|"$/g, "") || "Nagpur");
        }
        if (data.auto_sections_enabled) setAutoSections(data.auto_sections_enabled === true || data.auto_sections_enabled === "true");
        if (data.auto_round_prices) setAutoRoundPrices(data.auto_round_prices === true || data.auto_round_prices === "true");
        const dr = typeof data.delivery_range === "string" ? data.delivery_range.replace(/^"|"$/g, "").trim() : "";
        if (dr === "all_india") setDeliveryRange("all_india");
        if (data.store_config?.showQuickLinks === false) setShowQuickLinks(false);
        if (data.store_config?.showFooter === false) setShowFooter(false);
        if (data.store_config?.showCategories === false) setShowCategories(false);
        if (data.store_config?.showTopBrands !== undefined) setShowTopBrands(data.store_config.showTopBrands !== false);
        if (data.store_config?.topBrandsPosition) setTopBrandsPosition(data.store_config.topBrandsPosition);
        if (data.store_config?.topBrandsBg) setTopBrandsBg(data.store_config.topBrandsBg);
        if (data.store_config?.homepageLayout) setHomepageLayout(data.store_config.homepageLayout);
        if (data.online_payments_enabled !== undefined) setOnlinePaymentsEnabled(data.online_payments_enabled === true || data.online_payments_enabled === "true");
        if (data.delivery_slots && Array.isArray(data.delivery_slots) && data.delivery_slots.length > 0) {
          setDeliverySlots(data.delivery_slots);
        }
        if (data.store_config?.todayCutoff !== undefined) setTodayCutoff(data.store_config.todayCutoff);
        if (data.whatsapp_number) setWhatsappNumber(String(data.whatsapp_number));
        if (data.whatsapp_connected) setWhatsappConnected(data.whatsapp_connected === true || data.whatsapp_connected === "true");
        if (data.whatsapp_order_updates) setWhatsappOrderUpdates(data.whatsapp_order_updates === true || data.whatsapp_order_updates === "true");
        if (data.whatsapp_product_alerts) setWhatsappProductAlerts(data.whatsapp_product_alerts === true || data.whatsapp_product_alerts === "true");
        if (data.bottom_nav && Array.isArray(data.bottom_nav)) setBottomNav(data.bottom_nav);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const pollStatus = async () => {
      try {
        const s = await adminApi.whatsappStatus();
        setWaStatus(s.status);
        setWaQrDataUrl(s.qrDataUrl);
        setWaPhoneNumber(s.phoneNumber);
        setWaError(s.error);
        if (s.status === "connected") {
          setWhatsappConnected(true);
          setWhatsappNumber(s.phoneNumber || "");
        } else if (s.status === "disconnected") {
          setWhatsappConnected(false);
        }
      } catch {}
    };
    if (waPolling) {
      pollStatus();
      interval = setInterval(pollStatus, 2000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [waPolling]);

  const handleConnectWhatsApp = async () => {
    try {
      setWaError(null);
      setWaPolling(true);
      await adminApi.whatsappConnect();
    } catch (err: any) {
      setWaError(err.message);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      await adminApi.whatsappDisconnect();
      setWaStatus("disconnected");
      setWaQrDataUrl(null);
      setWaPhoneNumber(null);
      setWhatsappConnected(false);
      setWhatsappNumber("");
      setWaPolling(false);
    } catch (err: any) {
      setWaError(err.message);
    }
  };

  useEffect(() => {
    adminApi.whatsappStatus().then(s => {
      setWaStatus(s.status);
      setWaQrDataUrl(s.qrDataUrl);
      setWaPhoneNumber(s.phoneNumber);
      setWaError(s.error);
      if (s.status === "connected") {
        setWhatsappConnected(true);
        setWhatsappNumber(s.phoneNumber || "");
      }
      if (s.status !== "disconnected") {
        setWaPolling(true);
      }
    }).catch(() => {});
  }, []);

  const updateSection = (idx: number, field: string, value: any) => {
    const next = [...sections];
    (next[idx] as any)[field] = value;
    setSections(next);
  };

  const addSection = (templateType?: string) => {
    const id = `custom_${Date.now()}`;
    let newSection: any = {
      id, title: "New Section", subtitle: "Add a subtitle", emoji: "📦",
      bgFrom: "#f0f9ff", bgTo: "#e0f2fe", accentColor: "#0369a1",
      type: "category", categorySlug: "vegetables", visible: true, buttons: [],
    };
    if (templateType === "fullbanner") {
      newSection = {
        id, type: "fullbanner", visible: true,
        title: "Fresh Deals Every Day", subtitle: "Shop the best groceries at great prices",
        emoji: "🛒", bgFrom: "#0c831f", bgTo: "#16a34a", accentColor: "#ffffff",
        tagLabel: "🔥 Hot Deal", buttonLabel: "Shop Now", buttonLink: "/products",
        imageUrl: "", buttons: [],
      };
    } else if (templateType === "minibanner") {
      newSection = {
        id, type: "minibanner", visible: true,
        title: "Free Delivery on orders ₹199+", subtitle: "Limited time offer",
        emoji: "🚚", bgFrom: "#eff6ff", bgTo: "#dbeafe", accentColor: "#1d4ed8",
        link: "/products", buttons: [],
      };
    } else if (templateType === "promo") {
      newSection = {
        id, type: "promo", visible: true,
        title: "Get 10% OFF on your first order!", subtitle: "Use code: FRESH10 | Min. order ₹199",
        emoji: "🏷️", bgFrom: "#0c831f", bgTo: "#0a6f1a", accentColor: "#ffffff",
        buttonLabel: "Shop Now →", buttonLink: "/products",
        buttons: [{ label: "Shop Now →", link: "/products", bg: "#ffffff" }],
      };
    }
    setSections([...sections, newSection]);
    setExpandedSection(sections.length);
  };

  const removeSection = (idx: number) => {
    setSections(sections.filter((_, i) => i !== idx));
    setExpandedSection(null);
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const next = [...sections];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    setSections(next);
    setExpandedSection(newIdx);
  };

  const addButton = (sectionIdx: number) => {
    const next = [...sections];
    const section = next[sectionIdx] as any;
    if (!section.buttons) section.buttons = [];
    section.buttons.push({ label: "New Button", bg: section.accentColor || "#0c831f" });
    setSections(next);
  };

  const updateButton = (sectionIdx: number, btnIdx: number, field: string, value: string) => {
    const next = [...sections];
    (next[sectionIdx] as any).buttons[btnIdx][field] = value;
    setSections(next);
  };

  const removeButton = (sectionIdx: number, btnIdx: number) => {
    const next = [...sections];
    (next[sectionIdx] as any).buttons.splice(btnIdx, 1);
    setSections(next);
  };

  const updateBanner = (idx: number, field: string, value: string) => {
    const next = [...banners];
    (next[idx] as any)[field] = value;
    setBanners(next);
  };

  const addBanner = () => {
    setBanners([...banners, {
      bgFrom: "#f0f9ff", bgTo: "#e0f2fe", tag: "NEW", tagColor: "#0c831f",
      title: "New Banner", sub: "Add description here",
      img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
      cta: "Shop Now", ctaColor: "#0c831f", link: "/products",
    }]);
    setExpandedBanner(banners.length);
  };

  const removeBanner = (idx: number) => {
    setBanners(banners.filter((_, i) => i !== idx));
    setExpandedBanner(null);
  };

  const updateValueProp = (idx: number, field: string, value: string) => {
    const next = [...valueProps];
    (next[idx] as any)[field] = value;
    setValueProps(next);
  };

  const addValueProp = () => {
    setValueProps([...valueProps, { icon: "zap", color: "#0c831f", bg: "#e6f4ea", title: "New Feature", sub: "Description" }]);
  };

  const removeValueProp = (idx: number) => {
    setValueProps(valueProps.filter((_, i) => i !== idx));
  };

  const searchSectionProducts = async (q: string, sectionIdx: number) => {
    setSectionProductSearch(q);
    if (q.length < 2) { setSectionProductResults([]); return; }
    setSectionSearchLoading(true);
    try {
      const data = await adminApi.getProducts({ search: q, page: "1" });
      const existing = sections[sectionIdx]?.productIds || [];
      setSectionProductResults(data.products.filter((p: any) => !existing.includes(p.id)));
    } catch {}
    setSectionSearchLoading(false);
  };

  const addSectionProduct = (sectionIdx: number, product: any) => {
    const next = [...sections];
    if (!next[sectionIdx].productIds) next[sectionIdx].productIds = [];
    if (!next[sectionIdx]._productNames) next[sectionIdx]._productNames = {};
    next[sectionIdx].productIds.push(product.id);
    next[sectionIdx]._productNames[product.id] = product.name;
    setSections(next);
    setSectionProductResults(sectionProductResults.filter(p => p.id !== product.id));
  };

  const removeSectionProduct = (sectionIdx: number, productId: number) => {
    const next = [...sections];
    next[sectionIdx].productIds = (next[sectionIdx].productIds || []).filter((id: number) => id !== productId);
    setSections(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettings({
        homepage_sections: sections,
        homepage_banners: banners,
        homepage_value_props: valueProps,
        store_config: { storeName, deliveryTime, deliveryTagline, deliveryFee: Number(deliveryFee), freeDeliveryThreshold: Number(freeDeliveryThreshold), showQuickLinks, showFooter, showCategories, showTopBrands, topBrandsPosition, topBrandsBg, storeState, footerText, supportEmail, loginBadges, quickLinks, topBrands, faqs, todayCutoff, homepageLayout },
        store_city: storeCity,
        delivery_range: deliveryRange,
        delivery_slots: deliverySlots,
        auto_sections_enabled: autoSections,
        auto_round_prices: autoRoundPrices,
        whatsapp_number: whatsappNumber,
        whatsapp_connected: whatsappConnected,
        whatsapp_order_updates: whatsappOrderUpdates,
        whatsapp_product_alerts: whatsappProductAlerts,
        bottom_nav: bottomNav,
        online_payments_enabled: onlinePaymentsEnabled,
      });
      setSaved(true);
      showToast("Settings saved successfully!");
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) { showToast(err.message || "Failed to save settings", "error"); }
    setSaving(false);
  };

  const handleRoundPrices = async () => {
    setRoundingPrices(true);
    setRoundResult(null);
    try {
      const result = await adminApi.roundPrices();
      setRoundResult(`Updated ${result.updated} product prices to round figures`);
      setTimeout(() => setRoundResult(null), 4000);
    } catch (err: any) { setRoundResult(`Error: ${err.message}`); }
    setRoundingPrices(false);
  };

  const handleReset = () => {
    if (activeTab === "banners") setBanners(DEFAULT_BANNERS);
    else if (activeTab === "valueprops") setValueProps(DEFAULT_VALUE_PROPS);
    else if (activeTab === "sections") setSections(DEFAULT_SECTIONS);
  };

  if (loading) {
    return <AdminLayout><div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-gray-200 rounded-lg" /><div className="h-64 bg-gray-100 rounded-xl" /></div></AdminLayout>;
  }

  const tabs = [
    { key: "store", label: "Store Config", emoji: "🏪" },
    { key: "customization", label: "Customization", emoji: "🎨" },
    { key: "banners", label: "Banners", emoji: "🖼️" },
    { key: "valueprops", label: "Value Props", emoji: "⚡" },
    { key: "sections", label: "Sections", emoji: "📦" },
    { key: "navigation", label: "Bottom Nav", emoji: "📱" },
    { key: "automation", label: "Automation", emoji: "🤖" },
    { key: "integrations", label: "Integrations", emoji: "🔗" },
  ] as const;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900">Settings</h1>
            <p className="text-[13px] text-gray-500">Customize your store appearance and configuration</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset} className="flex items-center gap-2 h-10 px-4 border border-gray-200 rounded-xl text-[13px] font-medium hover:bg-gray-50 transition-colors">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 h-10 px-4 bg-[#0c831f] hover:bg-[#0a6f1a] text-white rounded-xl text-[13px] font-bold transition-colors disabled:opacity-60">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all ${
                activeTab === t.key
                  ? "bg-[#0c831f] text-white shadow-md"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>

        {activeTab === "store" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-[16px] font-bold text-gray-900 mb-4">Store Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-1">Store Name</label>
                <input value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-1">Header Tagline</label>
                <input value={deliveryTagline} onChange={e => setDeliveryTagline(e.target.value)} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="e.g. Fast delivery to your door" />
                <p className="text-[10px] text-gray-400 mt-1">Shown in the header next to the location pin</p>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-1">Store City</label>
                <input value={storeCity} onChange={e => setStoreCity(e.target.value)} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="Nagpur" />
                <p className="text-[10px] text-gray-400 mt-1">{deliveryRange === "city_only" ? "Orders from outside this city will be blocked" : "Used for display purposes only (All India delivery enabled)"}</p>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-1">Delivery Range</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setDeliveryRange("city_only")}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-center border-2 transition-all text-[13px] font-semibold ${deliveryRange === "city_only" ? "border-[#0c831f] bg-[#f0fdf4] text-[#0c831f]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                    🏙️ City Only
                  </button>
                  <button type="button" onClick={() => setDeliveryRange("all_india")}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-center border-2 transition-all text-[13px] font-semibold ${deliveryRange === "all_india" ? "border-[#0c831f] bg-[#f0fdf4] text-[#0c831f]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                    🇮🇳 All India
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{deliveryRange === "city_only" ? "Only accept orders from your store city" : "Accept orders from any city in India"}</p>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-1">Store State</label>
                <input value={storeState} onChange={e => setStoreState(e.target.value)} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="Maharashtra" />
                <p className="text-[10px] text-gray-400 mt-1">Shown below the tagline in the header</p>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-1">Default Delivery Time</label>
                <input value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="e.g. 1 Day" />
                <p className="text-[10px] text-gray-400 mt-1">Shown on product cards</p>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-1">Delivery Fee (₹)</label>
                <input type="number" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-1">Free Delivery Threshold (₹)</label>
                <input type="number" value={freeDeliveryThreshold} onChange={e => setFreeDeliveryThreshold(e.target.value)} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[12px] font-semibold text-gray-600 block mb-1">Footer Description</label>
                <input value={footerText} onChange={e => setFooterText(e.target.value)} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100">
              <h3 className="text-[14px] font-bold text-gray-900 mb-1">Homepage Display</h3>
              <p className="text-[11px] text-gray-500 mb-3">Choose how your homepage looks for customers</p>

              <div className="mb-4">
                <p className="text-[12px] font-bold text-gray-700 mb-2">Homepage Layout</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setHomepageLayout("layout1")}
                    className={`relative rounded-xl border-2 p-3 text-left transition-all ${homepageLayout === "layout1" ? "border-[#0c831f] bg-[#f0faf2]" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}
                  >
                    {homepageLayout === "layout1" && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-[#0c831f] rounded-full flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">✓</span>
                      </div>
                    )}
                    <div className="space-y-1 mb-2">
                      <div className="h-2 bg-gray-300 rounded-sm w-full" />
                      <div className="h-1.5 bg-gray-200 rounded-sm w-3/4" />
                      <div className="flex gap-1 mt-1">
                        {[1,2,3,4].map(i => <div key={i} className="h-4 flex-1 bg-gray-200 rounded-sm" />)}
                      </div>
                      <div className="h-1.5 bg-[#0c831f]/30 rounded-sm w-1/2 mt-1" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-800">Layout 1 — Full</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Banners, categories &amp; product sections</p>
                  </button>
                  <button
                    onClick={() => setHomepageLayout("layout2")}
                    className={`relative rounded-xl border-2 p-3 text-left transition-all ${homepageLayout === "layout2" ? "border-[#0c831f] bg-[#f0faf2]" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}
                  >
                    {homepageLayout === "layout2" && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-[#0c831f] rounded-full flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">✓</span>
                      </div>
                    )}
                    <div className="space-y-1 mb-2">
                      <div className="h-1.5 bg-[#0c831f]/50 rounded-sm w-1/2" />
                      <div className="flex gap-1 mt-1">
                        {[1,2,3,4].map(i => <div key={i} className="h-4 flex-1 bg-gray-200 rounded-sm" />)}
                      </div>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        {[1,2,3,4].map(i => <div key={i} className="h-5 bg-gray-200 rounded-sm" />)}
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-gray-800">Layout 2 — Simple</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Categories + 2×2 product grid only</p>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-[13px] font-bold text-gray-800">Category Grid</p>
                    <p className="text-[11px] text-gray-500">Show "Shop by Category" grid on homepage</p>
                  </div>
                  <button
                    onClick={() => setShowCategories(!showCategories)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-3 ${showCategories ? "bg-green-600" : "bg-gray-300"}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showCategories ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-[13px] font-bold text-gray-800">Online Payments (UPI)</p>
                    <p className="text-[11px] text-gray-500">When OFF, only Cash on Delivery is shown at checkout</p>
                  </div>
                  <button
                    onClick={() => setOnlinePaymentsEnabled(!onlinePaymentsEnabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-3 ${onlinePaymentsEnabled ? "bg-green-600" : "bg-gray-300"}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${onlinePaymentsEnabled ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-[13px] font-bold text-gray-800">Quick Links Bar</p>
                    <p className="text-[11px] text-gray-500">Show the sub-category shortcuts (Atta & Flour, Rice & Dal, etc.) on homepage</p>
                  </div>
                  <button
                    onClick={() => setShowQuickLinks(!showQuickLinks)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-3 ${showQuickLinks ? "bg-green-600" : "bg-gray-300"}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showQuickLinks ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-[13px] font-bold text-gray-800">Footer</p>
                    <p className="text-[11px] text-gray-500">Show the footer section at the bottom of all pages</p>
                  </div>
                  <button
                    onClick={() => setShowFooter(!showFooter)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-3 ${showFooter ? "bg-green-600" : "bg-gray-300"}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${showFooter ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-bold text-gray-900">Delivery Slots</h3>
                <button onClick={() => setDeliverySlots([...deliverySlots, { label: "New Slot", sub: "Time range", icon: "🕐", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] }])}
                  className="flex items-center gap-1 text-[12px] font-bold text-[#0c831f] hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add Slot
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mb-3">Configure delivery time slots and their day availability. Customers see slots filtered by day in checkout. Slots that have already passed are automatically hidden.</p>
              <div className="space-y-2">
                {deliverySlots.map((slot, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <input value={slot.icon} onChange={e => { const s = [...deliverySlots]; s[idx] = { ...s[idx], icon: e.target.value }; setDeliverySlots(s); }}
                        className="w-10 h-9 text-center bg-white border border-gray-200 rounded-lg text-[16px] focus:outline-none focus:border-[#0c831f]" maxLength={2} />
                      <input value={slot.label} onChange={e => { const s = [...deliverySlots]; s[idx] = { ...s[idx], label: e.target.value }; setDeliverySlots(s); }}
                        className="flex-1 h-9 px-3 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f]" placeholder="Slot name" />
                      <button onClick={() => setDeliverySlots(deliverySlots.filter((_, i) => i !== idx))}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input value={slot.sub} onChange={e => { const s = [...deliverySlots]; s[idx] = { ...s[idx], sub: e.target.value }; setDeliverySlots(s); }}
                      className="w-full h-9 px-3 mt-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f]" placeholder="Time range (e.g. 8 AM - 11 AM)" />
                    <div className="mt-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Available Days</p>
                      <div className="flex flex-wrap gap-1">
                        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day => {
                          const slotDays = slot.days || ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
                          const active = slotDays.includes(day);
                          return (
                            <button key={day} type="button" onClick={() => {
                              const s = [...deliverySlots];
                              const currentDays = s[idx].days || ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
                              s[idx] = { ...s[idx], days: active ? currentDays.filter(d => d !== day) : [...currentDays, day] };
                              setDeliverySlots(s);
                            }}
                              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${active ? "bg-[#0c831f] text-white" : "bg-gray-200 text-gray-500"}`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100">
              <h3 className="text-[14px] font-bold text-gray-900 mb-1">Today's Order Cutoff Time</h3>
              <p className="text-[11px] text-gray-400 mb-3">After this time, the "Today" tab is disabled and all orders default to Tomorrow. Leave blank to disable cutoff.</p>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={todayCutoff}
                  onChange={e => setTodayCutoff(e.target.value)}
                  className="h-9 px-3 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f]"
                />
                <button onClick={() => setTodayCutoff("")} className="text-[11px] text-gray-400 hover:text-red-500 underline">Clear</button>
              </div>
              {todayCutoff && (
                <p className="text-[11px] text-gray-500 mt-2">Today orders close at <span className="font-semibold text-gray-800">{todayCutoff}</span>. After that, only Tomorrow slots are shown.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "banners" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Image className="w-5 h-5 text-[#ea580c]" />
                <h2 className="text-[16px] font-bold text-gray-900">Homepage Banners</h2>
              </div>
              <button onClick={addBanner} className="flex items-center gap-1.5 h-9 px-3 bg-[#0c831f] hover:bg-[#0a6f1a] text-white rounded-lg text-[12px] font-bold transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Banner
              </button>
            </div>
            <p className="text-[13px] text-gray-500 mb-4">Customize the hero banners at the top of the homepage. Each banner can link to a category or page.</p>

            <div className="space-y-3">
              {banners.map((banner, idx) => {
                const isExpanded = expandedBanner === idx;
                return (
                  <div key={idx} className={`border rounded-xl overflow-hidden transition-all ${isExpanded ? "border-orange-300 shadow-sm" : "border-gray-100"}`}>
                    <div className="flex items-center gap-3 p-3.5 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpandedBanner(isExpanded ? null : idx)}>
                      <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                        <img src={banner.img} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{banner.title}</p>
                        <p className="text-[10px] text-gray-400">{banner.tag} · {banner.cta}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={e => { e.stopPropagation(); removeBanner(idx); }} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Title</label>
                            <input value={banner.title} onChange={e => updateBanner(idx, "title", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Subtitle</label>
                            <input value={banner.sub} onChange={e => updateBanner(idx, "sub", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Tag Label</label>
                            <input value={banner.tag} onChange={e => updateBanner(idx, "tag", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">CTA Text</label>
                            <input value={banner.cta} onChange={e => updateBanner(idx, "cta", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Link URL</label>
                            <input value={banner.link} onChange={e => updateBanner(idx, "link", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="/category/vegetables" />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Image URL</label>
                            <input value={banner.img} onChange={e => updateBanner(idx, "img", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Background — From Color</label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={banner.bgFrom || "#e8f5e9"} onChange={e => updateBanner(idx, "bgFrom", e.target.value)} className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer" />
                              <input value={banner.bgFrom || ""} onChange={e => updateBanner(idx, "bgFrom", e.target.value)} className="flex-1 h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="#e8f5e9" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Background — To Color</label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={banner.bgTo || "#c8e6c9"} onChange={e => updateBanner(idx, "bgTo", e.target.value)} className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer" />
                              <input value={banner.bgTo || ""} onChange={e => updateBanner(idx, "bgTo", e.target.value)} className="flex-1 h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="#c8e6c9" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Tag Color</label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={banner.tagColor || "#0c831f"} onChange={e => updateBanner(idx, "tagColor", e.target.value)} className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer" />
                              <input value={banner.tagColor || ""} onChange={e => updateBanner(idx, "tagColor", e.target.value)} className="flex-1 h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="#0c831f" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Button Color</label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={banner.ctaColor || "#0c831f"} onChange={e => updateBanner(idx, "ctaColor", e.target.value)} className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer" />
                              <input value={banner.ctaColor || ""} onChange={e => updateBanner(idx, "ctaColor", e.target.value)} className="flex-1 h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="#0c831f" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 h-16 rounded-lg relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${banner.bgFrom || "#e8f5e9"}, ${banner.bgTo || "#c8e6c9"})` }}>
                          <div className="absolute inset-0 p-3 flex items-center gap-3">
                            <div>
                              <span className="text-[7px] font-bold tracking-wider px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: banner.tagColor || "#0c831f" }}>{banner.tag}</span>
                              <p className="text-[12px] font-bold text-gray-800 mt-0.5">{banner.title}</p>
                            </div>
                            <img src={banner.img} alt="" className="h-12 w-12 rounded-lg object-cover ml-auto opacity-40" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "valueprops" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#7c3aed]" />
                <h2 className="text-[16px] font-bold text-gray-900">Value Props (Feature Pills)</h2>
              </div>
              <button onClick={addValueProp} className="flex items-center gap-1.5 h-9 px-3 bg-[#0c831f] hover:bg-[#0a6f1a] text-white rounded-lg text-[12px] font-bold transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <p className="text-[13px] text-gray-500 mb-4">These are the feature highlight pills shown below the banners (e.g. "Fast delivery", "Best prices").</p>

            <div className="space-y-3">
              {valueProps.map((vp, idx) => (
                <div key={idx} className="border border-gray-100 rounded-xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">Title</label>
                      <input value={vp.title} onChange={e => updateValueProp(idx, "title", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">Subtitle</label>
                      <input value={vp.sub} onChange={e => updateValueProp(idx, "sub", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">Icon</label>
                      <select value={vp.icon} onChange={e => updateValueProp(idx, "icon", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white">
                        <option value="clock">🕐 Clock</option>
                        <option value="percent">💰 Percent</option>
                        <option value="zap">⚡ Zap</option>
                        <option value="truck">🚚 Truck</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">Icon Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={vp.color} onChange={e => updateValueProp(idx, "color", e.target.value)} className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer" />
                        <input value={vp.color} onChange={e => updateValueProp(idx, "color", e.target.value)} className="flex-1 h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">Background Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={vp.bg} onChange={e => updateValueProp(idx, "bg", e.target.value)} className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer" />
                        <input value={vp.bg} onChange={e => updateValueProp(idx, "bg", e.target.value)} className="flex-1 h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button onClick={() => removeValueProp(idx)} className="flex items-center gap-1 h-9 px-3 text-red-500 hover:bg-red-50 rounded-lg text-[12px] font-semibold transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "sections" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#7c3aed]" />
                <h2 className="text-[16px] font-bold text-gray-900">Homepage Sections</h2>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap mb-4">
              <span className="text-[11px] font-semibold text-gray-400 self-center">Add:</span>
              <button onClick={() => addSection()} className="flex items-center gap-1 h-9 px-3 bg-gray-100 active:bg-gray-200 text-gray-700 rounded-lg text-[12px] font-bold transition-colors">
                <Plus className="w-3.5 h-3.5" /> Category
              </button>
              <button onClick={() => addSection("minibanner")} className="flex items-center gap-1 h-9 px-3 bg-blue-50 active:bg-blue-100 text-blue-700 rounded-lg text-[12px] font-bold transition-colors">
                <Plus className="w-3.5 h-3.5" /> Mini Banner
              </button>
              <button onClick={() => addSection("fullbanner")} className="flex items-center gap-1 h-9 px-3 bg-purple-50 active:bg-purple-100 text-purple-700 rounded-lg text-[12px] font-bold transition-colors">
                <Plus className="w-3.5 h-3.5" /> Full Banner
              </button>
              <button onClick={() => addSection("promo")} className="flex items-center gap-1 h-9 px-3 bg-green-50 active:bg-green-100 text-[#0c831f] rounded-lg text-[12px] font-bold transition-colors">
                <Plus className="w-3.5 h-3.5" /> Promo Strip
              </button>
            </div>

            <div className="space-y-3">
              {sections.map((section, idx) => {
                const isExpanded = expandedSection === idx;
                return (
                  <div key={section.id} className={`border rounded-xl overflow-hidden transition-all ${isExpanded ? "border-[#0c831f]/30 shadow-sm" : "border-gray-100"}`}>
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpandedSection(isExpanded ? null : idx)}>
                      <GripVertical className="w-4 h-4 text-gray-300 shrink-0 hidden sm:block" />
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-base sm:text-lg shrink-0" style={{ background: `linear-gradient(135deg, ${section.bgFrom}, ${section.bgTo})` }}>
                        {section.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] sm:text-[13px] font-semibold text-gray-900 truncate">{section.title}</p>
                        <p className="text-[10px] text-gray-400 truncate">{section.type === "deals" ? "Deals Section" : section.type === "featured" ? "Featured Products" : section.type === "custom" ? "Custom (Manual Picks)" : section.type === "promo" ? "Promo Banner" : section.type === "fullbanner" ? "Full Width Banner" : section.type === "minibanner" ? "Mini Banner Strip" : section.type === "quicknav" ? "Quick Nav Capsules" : section.type === "trustpills" ? "Trust Badges / Pills" : `Category: ${section.categorySlug || section.categoryId || "—"}`}</p>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                        <label className="hidden sm:flex items-center gap-1.5 cursor-pointer mr-2" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={section.visible !== false} onChange={e => updateSection(idx, "visible", e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-300 text-[#0c831f] focus:ring-[#0c831f]" />
                          <span className="text-[10px] text-gray-500">{section.visible !== false ? "Visible" : "Hidden"}</span>
                        </label>
                        <button onClick={e => { e.stopPropagation(); moveSection(idx, -1); }} disabled={idx === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5 text-gray-400" /></button>
                        <button onClick={e => { e.stopPropagation(); moveSection(idx, 1); }} disabled={idx === sections.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5 text-gray-400" /></button>
                        <button onClick={e => { e.stopPropagation(); removeSection(idx); }} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-3 sm:px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                        <div className="sm:hidden flex items-center justify-between mb-1">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={section.visible !== false} onChange={e => updateSection(idx, "visible", e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-300 text-[#0c831f] focus:ring-[#0c831f]" />
                            <span className="text-[11px] font-semibold text-gray-600">{section.visible !== false ? "Visible" : "Hidden"}</span>
                          </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Title</label>
                            <input value={section.title} onChange={e => updateSection(idx, "title", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Subtitle</label>
                            <input value={section.subtitle} onChange={e => updateSection(idx, "subtitle", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Emoji</label>
                            <input value={section.emoji} onChange={e => updateSection(idx, "emoji", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Section Type</label>
                            <select value={section.type || "category"} onChange={e => updateSection(idx, "type", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white">
                              <option value="deals">Deals (Top Discounted)</option>
                              <option value="category">Category Products</option>
                              <option value="featured">Featured Products</option>
                              <option value="custom">Custom (Manual Picks Only)</option>
                              <option value="promo">Promo Banner (small)</option>
                              <option value="fullbanner">Full Width Banner (with image)</option>
                              <option value="minibanner">Mini Banner Strip</option>
                              <option value="quicknav">Quick Nav Capsules</option>
                              <option value="trustpills">Trust Badges / Pills</option>
                            </select>
                          </div>
                          {section.type !== "deals" && section.type !== "custom" && section.type !== "promo" && section.type !== "fullbanner" && section.type !== "minibanner" && section.type !== "quicknav" && section.type !== "trustpills" && (
                            <div>
                              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Category</label>
                              <select value={section.categorySlug || ""} onChange={e => updateSection(idx, "categorySlug", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white">
                                <option value="">Select a category</option>
                                {allCategories.map((cat: any) => (
                                  <option key={cat.id} value={cat.slug}>{cat.icon} {cat.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          {(section.type === "promo" || section.type === "fullbanner" || section.type === "minibanner") && (
                            <div>
                              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Link URL (tap destination)</label>
                              <input value={(section as any).link || ""} onChange={e => updateSection(idx, "link", e.target.value)} placeholder="/products or /category/vegetables" className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                            </div>
                          )}
                          {section.type === "fullbanner" && (<>
                            <div>
                              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Image URL</label>
                              <input value={(section as any).imageUrl || ""} onChange={e => updateSection(idx, "imageUrl", e.target.value)} placeholder="https://... (shown on right side)" className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Tag Label (top badge text)</label>
                              <input value={(section as any).tagText || ""} onChange={e => updateSection(idx, "tagText", e.target.value)} placeholder="e.g. FRESH DELIVERY" className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Tag Color</label>
                              <div className="flex items-center gap-2">
                                <input type="color" value={(section as any).tagColor || "#0c831f"} onChange={e => updateSection(idx, "tagColor", e.target.value)} className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer" />
                                <input value={(section as any).tagColor || ""} onChange={e => updateSection(idx, "tagColor", e.target.value)} className="flex-1 h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="#0c831f" />
                              </div>
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Button Text (CTA)</label>
                              <input value={(section as any).ctaText || ""} onChange={e => updateSection(idx, "ctaText", e.target.value)} placeholder="e.g. Shop Now" className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Button Color</label>
                              <div className="flex items-center gap-2">
                                <input type="color" value={(section as any).ctaColor || "#0c831f"} onChange={e => updateSection(idx, "ctaColor", e.target.value)} className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer" />
                                <input value={(section as any).ctaColor || ""} onChange={e => updateSection(idx, "ctaColor", e.target.value)} className="flex-1 h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="#0c831f" />
                              </div>
                            </div>
                          </>)}
                          {section.type !== "promo" && section.type !== "fullbanner" && section.type !== "minibanner" && section.type !== "quicknav" && section.type !== "trustpills" && (
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Max Products</label>
                            <input type="number" min="1" max="50" value={section.maxProducts || ""} onChange={e => updateSection(idx, "maxProducts", e.target.value ? Number(e.target.value) : undefined)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="Default: 20" />
                          </div>
                          )}
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Accent Color</label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={section.accentColor} onChange={e => updateSection(idx, "accentColor", e.target.value)} className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer" />
                              <input value={section.accentColor} onChange={e => updateSection(idx, "accentColor", e.target.value)} className="flex-1 h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Background From</label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={section.bgFrom} onChange={e => updateSection(idx, "bgFrom", e.target.value)} className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer" />
                              <input value={section.bgFrom} onChange={e => updateSection(idx, "bgFrom", e.target.value)} className="flex-1 h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Background To</label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={section.bgTo} onChange={e => updateSection(idx, "bgTo", e.target.value)} className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer" />
                              <input value={section.bgTo} onChange={e => updateSection(idx, "bgTo", e.target.value)} className="flex-1 h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 h-8 rounded-lg" style={{ background: `linear-gradient(to right, ${section.bgFrom}, ${section.bgTo})` }}>
                          <div className="h-full flex items-center px-3">
                            <span className="text-[11px] font-bold" style={{ color: section.accentColor }}>{section.emoji} Preview</span>
                          </div>
                        </div>

                        <div className="border-t border-gray-100 pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] font-semibold text-gray-500">
                              {section.type === "trustpills" ? "Trust Pills (edit each badge)" : section.type === "quicknav" ? "Nav Capsules" : "Sub-Buttons (optional filter tags)"}
                            </label>
                            <button onClick={() => addButton(idx)} className="flex items-center gap-1 text-[11px] font-bold text-[#0c831f] hover:underline">
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          </div>
                          {(section.buttons || []).length > 0 ? (
                            <div className="space-y-2">
                              {(section.buttons || []).map((btn: any, bi: number) => (
                                <div key={bi} className="space-y-1.5 pb-2 border-b border-gray-100 last:border-0">
                                  <div className="flex items-center gap-2">
                                    <input value={btn.label} onChange={e => updateButton(idx, bi, "label", e.target.value)} placeholder="Label" className="w-28 h-8 px-2 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-[#0c831f]" />
                                    {(section.type === "quicknav" || section.type === "trustpills") ? (
                                      <input value={btn.emoji || ""} onChange={e => updateButton(idx, bi, "emoji", e.target.value)} placeholder="Emoji 🌟" className="w-20 h-8 px-2 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-[#0c831f]" />
                                    ) : (
                                      <input value={btn.tag || ""} onChange={e => updateButton(idx, bi, "tag", e.target.value)} placeholder="Filter tag (e.g. leafy)" className="flex-1 h-8 px-2 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-[#0c831f]" />
                                    )}
                                    <input type="color" value={btn.bg || "#f0f0f0"} onChange={e => updateButton(idx, bi, "bg", e.target.value)} className="w-8 h-8 rounded border border-gray-200 cursor-pointer" />
                                    <button onClick={() => removeButton(idx, bi)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3 text-red-400" /></button>
                                  </div>
                                  {section.type === "quicknav" && (
                                    <div className="flex items-center gap-2 pl-1">
                                      <input value={btn.sublabel || ""} onChange={e => updateButton(idx, bi, "sublabel", e.target.value)} placeholder="Sublabel (e.g. Fresh stock)" className="flex-1 h-7 px-2 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:border-[#0c831f]" />
                                      <input value={btn.link || ""} onChange={e => updateButton(idx, bi, "link", e.target.value)} placeholder="Link (e.g. /products)" className="flex-1 h-7 px-2 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:border-[#0c831f]" />
                                    </div>
                                  )}
                                  {section.type === "trustpills" && (
                                    <div className="pl-1">
                                      <input value={btn.sublabel || ""} onChange={e => updateButton(idx, bi, "sublabel", e.target.value)} placeholder="Sub text (e.g. On orders ₹199+)" className="w-full h-7 px-2 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:border-[#0c831f]" />
                                    </div>
                                  )}
                                  {section.type === "promo" && (
                                    <div className="pl-1">
                                      <input value={btn.link || ""} onChange={e => updateButton(idx, bi, "link", e.target.value)} placeholder="CTA link (e.g. /products)" className="w-full h-7 px-2 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:border-[#0c831f]" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-gray-400 italic">{section.type === "trustpills" ? "No pills. Add some above." : "No sub-buttons."}</p>
                          )}
                        </div>

                        {section.type !== "trustpills" && section.type !== "fullbanner" && section.type !== "promo" && section.type !== "minibanner" && section.type !== "quicknav" && <div className="border-t border-gray-100 pt-3">
                          <label className="text-[11px] font-semibold text-gray-500 block mb-2">{section.type === "custom" ? "Products (required — select products to display in this section)" : "Featured Products (optional — pin specific products to this section)"}</label>
                          <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="text"
                              value={expandedSection === idx ? sectionProductSearch : ""}
                              onChange={e => searchSectionProducts(e.target.value, idx)}
                              placeholder="Search products to add..."
                              className="w-full h-9 pl-9 pr-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-[#0c831f] focus:bg-white"
                            />
                          </div>
                          {sectionSearchLoading && <p className="text-[10px] text-gray-400 mb-2">Searching...</p>}
                          {expandedSection === idx && sectionProductResults.length > 0 && (
                            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg bg-white divide-y divide-gray-50 mb-2">
                              {sectionProductResults.map((prod: any) => (
                                <button key={prod.id} onClick={() => addSectionProduct(idx, prod)} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-green-50 transition-colors text-left">
                                  <div className="w-6 h-6 rounded bg-gray-100 overflow-hidden shrink-0">
                                    {prod.imageUrl && <img src={prod.imageUrl} alt="" className="w-full h-full object-cover" />}
                                  </div>
                                  <span className="text-[11px] font-medium text-gray-800 truncate flex-1">{prod.name}</span>
                                  <span className="text-[10px] text-gray-400">₹{prod.price}</span>
                                  <Plus className="w-3 h-3 text-green-600 shrink-0" />
                                </button>
                              ))}
                            </div>
                          )}
                          {(section.productIds || []).length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {(section.productIds || []).map((pid: number) => (
                                <span key={pid} className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-semibold px-2 py-1 rounded-full">
                                  {section._productNames?.[pid] || `#${pid}`}
                                  <button onClick={() => removeSectionProduct(idx, pid)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">{section.type === "custom" ? "No products selected. Add products above for this section to display." : "No featured products. Section will show products from its category."}</p>
                          )}
                        </div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "customization" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-[16px] font-bold text-gray-900 mb-4">Login Page Badges</h2>
              <p className="text-[12px] text-gray-500 mb-3">Trust badges shown at the bottom of the login page</p>
              <div className="space-y-2">
                {loginBadges.map((badge, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select value={badge.icon} onChange={e => { const n = [...loginBadges]; n[i] = { ...n[i], icon: e.target.value }; setLoginBadges(n); }} className="w-20 sm:w-24 h-9 px-2 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[12px] shrink-0">
                      <option value="clock">Clock</option>
                      <option value="shield">Shield</option>
                      <option value="truck">Truck</option>
                    </select>
                    <input value={badge.label} onChange={e => { const n = [...loginBadges]; n[i] = { ...n[i], label: e.target.value }; setLoginBadges(n); }} className="flex-1 min-w-0 h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px]" placeholder="Badge text" />
                    <button onClick={() => setLoginBadges(loginBadges.filter((_, j) => j !== i))} className="p-1.5 hover:bg-red-50 rounded-lg shrink-0"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                ))}
                {loginBadges.length < 5 && (
                  <button onClick={() => setLoginBadges([...loginBadges, { icon: "clock", label: "" }])} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0c831f] hover:underline mt-1">
                    <Plus className="w-3.5 h-3.5" /> Add Badge
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-[16px] font-bold text-gray-900 mb-4">Quick Links</h2>
              <p className="text-[12px] text-gray-500 mb-3">Category shortcut pills shown on the homepage</p>
              <div className="space-y-2">
                {quickLinks.map((ql, i) => (
                  <div key={i} className="bg-[#f7f7f7] rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input value={ql.emoji} onChange={e => { const n = [...quickLinks]; n[i] = { ...n[i], emoji: e.target.value }; setQuickLinks(n); }} className="w-12 h-9 px-2 bg-white border border-gray-200 rounded-lg text-center text-[14px]" placeholder="🌾" />
                      <input value={ql.label} onChange={e => { const n = [...quickLinks]; n[i] = { ...n[i], label: e.target.value }; setQuickLinks(n); }} className="flex-1 h-9 px-3 bg-white border border-gray-200 rounded-lg text-[13px]" placeholder="Label" />
                      <button onClick={() => setQuickLinks(quickLinks.filter((_, j) => j !== i))} className="p-1.5 hover:bg-red-50 rounded-lg shrink-0"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                    </div>
                    <input value={ql.link} onChange={e => { const n = [...quickLinks]; n[i] = { ...n[i], link: e.target.value }; setQuickLinks(n); }} className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-[12px]" placeholder="/category/slug" />
                  </div>
                ))}
                {quickLinks.length < 12 && (
                  <button onClick={() => setQuickLinks([...quickLinks, { label: "", emoji: "", link: "/category/", bg: "bg-gray-50", border: "border-gray-200" }])} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0c831f] hover:underline mt-1">
                    <Plus className="w-3.5 h-3.5" /> Add Quick Link
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[16px] font-bold text-gray-900">Top Brands</h2>
                <button
                  onClick={() => setShowTopBrands(!showTopBrands)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${showTopBrands ? "bg-[#0c831f]" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${showTopBrands ? "left-5.5 translate-x-0.5" : "left-0.5"}`} />
                </button>
              </div>
              <p className="text-[12px] text-gray-500 mb-4">Scrollable brand strip shown on the homepage</p>

              <div className="space-y-4">
                <div>
                  <p className="text-[12px] font-semibold text-gray-600 mb-2">Position on home page</p>
                  <div className="flex gap-2">
                    {([["top", "🔝 Top"], ["middle", "↕️ Middle"], ["bottom", "⬇️ Bottom"]] as const).map(([val, label]) => (
                      <button key={val} onClick={() => setTopBrandsPosition(val)}
                        className={`flex-1 py-2 rounded-xl text-[12px] font-bold border-2 transition-all ${topBrandsPosition === val ? "border-[#0c831f] bg-[#f0fdf4] text-[#0c831f]" : "border-gray-100 text-gray-600 hover:border-gray-200"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[12px] font-semibold text-gray-600 mb-2">Background style</p>
                  <div className="flex gap-2">
                    {([["dark", "🌑 Dark"], ["green", "🟢 Green"], ["light", "⬜ Light"]] as const).map(([val, label]) => (
                      <button key={val} onClick={() => setTopBrandsBg(val)}
                        className={`flex-1 py-2 rounded-xl text-[12px] font-bold border-2 transition-all ${topBrandsBg === val ? "border-[#0c831f] bg-[#f0fdf4] text-[#0c831f]" : "border-gray-100 text-gray-600 hover:border-gray-200"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[12px] font-semibold text-gray-600 mb-2">Brand names</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {topBrands.map((brand, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-[#f7f7f7] border border-gray-200 rounded-lg px-3 py-1.5">
                        <span className="text-[13px] font-medium text-gray-700">{brand}</span>
                        <button onClick={() => setTopBrands(topBrands.filter((_, j) => j !== i))} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={newBrand} onChange={e => setNewBrand(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newBrand.trim()) { setTopBrands([...topBrands, newBrand.trim()]); setNewBrand(""); } }} className="flex-1 h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px]" placeholder="Type brand name & press Enter" />
                    <button onClick={() => { if (newBrand.trim()) { setTopBrands([...topBrands, newBrand.trim()]); setNewBrand(""); } }} className="h-9 px-4 bg-[#0c831f] text-white text-[12px] font-bold rounded-lg hover:bg-[#0a6f1a]">Add</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              {(() => {
                const sIdx = sections.findIndex((s: any) => s.type === "promo" || s.id === "promo_first_order");
                const promo = sIdx >= 0 ? sections[sIdx] : null;
                const updatePromo = (field: string, value: any) => {
                  if (sIdx < 0) return;
                  const next = [...sections];
                  (next[sIdx] as any)[field] = value;
                  setSections(next);
                };
                const updatePromoBtn = (field: string, value: string) => {
                  if (sIdx < 0) return;
                  const next = [...sections];
                  if (!next[sIdx].buttons) next[sIdx].buttons = [{ label: "Shop Now", bg: "#ffffff", link: "/products" }];
                  next[sIdx].buttons[0] = { ...next[sIdx].buttons[0], [field]: value };
                  setSections(next);
                };
                const btn = promo?.buttons?.[0];
                return (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-[16px] font-bold text-gray-900">Promo Strip</h2>
                      {promo && (
                        <button
                          onClick={() => updatePromo("visible", !promo.visible)}
                          className={`relative w-11 h-6 rounded-full transition-colors ${promo.visible ? "bg-[#0c831f]" : "bg-gray-200"}`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${promo.visible ? "left-[22px]" : "left-0.5"}`} />
                        </button>
                      )}
                    </div>
                    <p className="text-[12px] text-gray-500 mb-4">The full-width green promotional banner (coupon/discount strip) on the home page</p>
                    {promo ? (
                      <div className="space-y-3">
                        <div className="rounded-xl overflow-hidden" style={{ background: `linear-gradient(to right, ${promo.bgFrom}, ${promo.bgTo})` }}>
                          <div className="flex items-center gap-3 px-4 py-3">
                            <span className="text-[26px] shrink-0">{promo.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold text-white leading-tight truncate">{promo.title}</p>
                              <p className="text-[11px] text-white/80 mt-0.5 truncate">{promo.subtitle}</p>
                            </div>
                            <div className="shrink-0 bg-white rounded-lg px-3 py-1.5">
                              <span className="text-[12px] font-bold" style={{ color: promo.bgFrom }}>{btn?.label || "Shop Now"} →</span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Headline</label>
                            <input value={promo.title} onChange={e => updatePromo("title", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] font-semibold focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="Get 10% OFF on your first order!" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Sub-text</label>
                            <input value={promo.subtitle} onChange={e => updatePromo("subtitle", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="Use code: MKS10 | Min. order ₹199" />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Emoji</label>
                            <input value={promo.emoji} onChange={e => updatePromo("emoji", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[20px] text-center focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="🏷️" />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Button Label</label>
                            <input value={btn?.label || "Shop Now"} onChange={e => updatePromoBtn("label", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="Shop Now" />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Button Link</label>
                            <input value={btn?.link || "/products"} onChange={e => updatePromoBtn("link", e.target.value)} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="/products" />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">Background Gradient</label>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 w-10 shrink-0">Start</span>
                                <input type="color" value={promo.bgFrom} onChange={e => updatePromo("bgFrom", e.target.value)} className="w-8 h-8 rounded border border-gray-200 cursor-pointer shrink-0" />
                                <input value={promo.bgFrom} onChange={e => updatePromo("bgFrom", e.target.value)} className="flex-1 h-8 px-2 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:border-[#0c831f] focus:bg-white min-w-0" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 w-10 shrink-0">End</span>
                                <input type="color" value={promo.bgTo} onChange={e => updatePromo("bgTo", e.target.value)} className="w-8 h-8 rounded border border-gray-200 cursor-pointer shrink-0" />
                                <input value={promo.bgTo} onChange={e => updatePromo("bgTo", e.target.value)} className="flex-1 h-8 px-2 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:border-[#0c831f] focus:bg-white min-w-0" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-[13px] text-gray-500 mb-3">No promo strip on the homepage yet.</p>
                        <button
                          onClick={() => {
                            const id = `promo_${Date.now()}`;
                            setSections(prev => [{
                              id, type: "promo", visible: true,
                              title: "Get 10% OFF on your first order!", subtitle: "Use code: FRESH10 | Min. order ₹199",
                              emoji: "🏷️", bgFrom: "#0c831f", bgTo: "#0a6f1a", accentColor: "#ffffff",
                              buttonLabel: "Shop Now →", buttonLink: "/products",
                              buttons: [{ label: "Shop Now →", link: "/products", bg: "#ffffff" }],
                            } as any, ...prev]);
                          }}
                          className="flex items-center gap-2 mx-auto h-9 px-4 bg-[#0c831f] text-white rounded-lg text-[13px] font-bold hover:bg-[#0a6f1a] transition-colors"
                        >
                          <Plus className="w-4 h-4" /> Create Promo Strip
                        </button>
                        <p className="text-[11px] text-gray-400 mt-2">Then click Save Changes at the top.</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[16px] font-bold text-gray-900">Trust Pills</h2>
                <button
                  onClick={() => {
                    const sIdx = sections.findIndex(s => s.id === "trust_pills");
                    if (sIdx < 0) return;
                    const next = [...sections];
                    if (!next[sIdx].buttons) next[sIdx].buttons = [];
                    next[sIdx].buttons.push({ emoji: "✨", label: "New Feature", sublabel: "Add details", bg: "#f0fdf4" });
                    setSections(next);
                  }}
                  className="flex items-center gap-1.5 h-8 px-3 bg-[#0c831f] hover:bg-[#0a6f1a] text-white rounded-lg text-[12px] font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Pill
                </button>
              </div>
              <p className="text-[12px] text-gray-500 mb-4">The scrollable trust badge pills shown below the promotional banner (Free Delivery, Good Quality, etc.)</p>
              {(() => {
                const sIdx = sections.findIndex(s => s.id === "trust_pills");
                const pills: any[] = sIdx >= 0 ? (sections[sIdx].buttons || []) : [];
                return (
                  <div className="space-y-3">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                      {pills.map((p: any, i: number) => (
                        <div key={i} className="shrink-0 flex flex-col items-center justify-center rounded-2xl px-4 py-3 min-w-[90px] border border-gray-100 shadow-sm" style={{ backgroundColor: p.bg || "#f0fdf4" }}>
                          <span className="text-[22px] leading-none mb-1">{p.emoji}</span>
                          <p className="text-[11px] font-bold text-gray-900 text-center leading-tight">{p.label}</p>
                          <p className="text-[9px] text-gray-500 text-center mt-0.5 leading-tight">{p.sublabel || p.sub}</p>
                        </div>
                      ))}
                      {pills.length === 0 && <p className="text-[12px] text-gray-400 italic py-3">No pills yet. Add one above.</p>}
                    </div>
                    <div className="space-y-2">
                      {pills.map((p: any, i: number) => (
                        <div key={i} className="bg-[#f7f7f7] rounded-xl p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              value={p.emoji || ""}
                              onChange={e => {
                                const sIdx2 = sections.findIndex(s => s.id === "trust_pills");
                                if (sIdx2 < 0) return;
                                const next = [...sections];
                                next[sIdx2].buttons[i] = { ...next[sIdx2].buttons[i], emoji: e.target.value };
                                setSections(next);
                              }}
                              className="w-12 h-9 px-2 bg-white border border-gray-200 rounded-lg text-center text-[18px]"
                              placeholder="🚚"
                            />
                            <input
                              value={p.label || ""}
                              onChange={e => {
                                const sIdx2 = sections.findIndex(s => s.id === "trust_pills");
                                if (sIdx2 < 0) return;
                                const next = [...sections];
                                next[sIdx2].buttons[i] = { ...next[sIdx2].buttons[i], label: e.target.value };
                                setSections(next);
                              }}
                              className="flex-1 h-9 px-3 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold"
                              placeholder="Free Delivery"
                            />
                            <input
                              type="color"
                              value={p.bg || "#f0fdf4"}
                              onChange={e => {
                                const sIdx2 = sections.findIndex(s => s.id === "trust_pills");
                                if (sIdx2 < 0) return;
                                const next = [...sections];
                                next[sIdx2].buttons[i] = { ...next[sIdx2].buttons[i], bg: e.target.value };
                                setSections(next);
                              }}
                              className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer shrink-0"
                              title="Background color"
                            />
                            <button
                              onClick={() => {
                                const sIdx2 = sections.findIndex(s => s.id === "trust_pills");
                                if (sIdx2 < 0) return;
                                const next = [...sections];
                                next[sIdx2].buttons = next[sIdx2].buttons.filter((_: any, j: number) => j !== i);
                                setSections(next);
                              }}
                              className="p-1.5 hover:bg-red-50 rounded-lg shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                          <input
                            value={p.sublabel || p.sub || ""}
                            onChange={e => {
                              const sIdx2 = sections.findIndex(s => s.id === "trust_pills");
                              if (sIdx2 < 0) return;
                              const next = [...sections];
                              next[sIdx2].buttons[i] = { ...next[sIdx2].buttons[i], sublabel: e.target.value, sub: e.target.value };
                              setSections(next);
                            }}
                            className="w-full h-8 px-3 bg-white border border-gray-200 rounded-lg text-[12px]"
                            placeholder="Sub text (e.g. On orders ₹199+)"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-[16px] font-bold text-gray-900 mb-4">FAQs</h2>
              <p className="text-[12px] text-gray-500 mb-3">Questions & answers shown in the Help section of the account page</p>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div key={i} className="bg-[#f7f7f7] rounded-xl p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] font-bold text-gray-400 mt-2">Q{i + 1}</span>
                      <input value={faq.q} onChange={e => { const n = [...faqs]; n[i] = { ...n[i], q: e.target.value }; setFaqs(n); }} className="flex-1 h-9 px-3 bg-white border border-gray-200 rounded-lg text-[13px] font-semibold" placeholder="Question" />
                      <button onClick={() => setFaqs(faqs.filter((_, j) => j !== i))} className="p-1.5 hover:bg-red-50 rounded-lg mt-0.5"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                    </div>
                    <textarea value={faq.a} onChange={e => { const n = [...faqs]; n[i] = { ...n[i], a: e.target.value }; setFaqs(n); }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[12px] min-h-[60px] resize-none" placeholder="Answer" />
                  </div>
                ))}
                <button onClick={() => setFaqs([...faqs, { q: "", a: "" }])} className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0c831f] hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add FAQ
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-[16px] font-bold text-gray-900 mb-4">Support Contact</h2>
              <label className="text-[12px] font-semibold text-gray-600 block mb-1">Support Email</label>
              <input value={supportEmail} onChange={e => setSupportEmail(e.target.value)} className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder={`support@${storeName.toLowerCase().replace(/\s+/g, "")}.in`} />
              <p className="text-[10px] text-gray-400 mt-1">Displayed on the account Help & Support page</p>
            </div>
          </div>
        )}

        {activeTab === "navigation" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-[#0c831f]" />
                <h2 className="text-[16px] font-bold text-gray-900">Mobile Bottom Navigation</h2>
              </div>
              <button onClick={() => setBottomNav([...bottomNav, { label: "New", icon: "star", href: "/" }])} className="flex items-center gap-1.5 h-9 px-3 bg-[#0c831f] hover:bg-[#0a6f1a] text-white rounded-lg text-[12px] font-bold transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <p className="text-[13px] text-gray-500 mb-4">Configure the bottom navigation bar shown on mobile devices. Maximum 5 items recommended.</p>

            <div className="space-y-3">
              {bottomNav.map((item: any, idx: number) => (
                <div key={idx} className="border border-gray-100 rounded-xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">Label</label>
                      <input value={item.label} onChange={e => { const n = [...bottomNav]; n[idx] = { ...n[idx], label: e.target.value }; setBottomNav(n); }} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">Icon</label>
                      <select value={item.icon} onChange={e => { const n = [...bottomNav]; n[idx] = { ...n[idx], icon: e.target.value }; setBottomNav(n); }} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white">
                        {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">Link</label>
                      <input value={item.href} onChange={e => { const n = [...bottomNav]; n[idx] = { ...n[idx], href: e.target.value }; setBottomNav(n); }} className="w-full h-9 px-3 bg-[#f7f7f7] border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" placeholder="/categories" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => { if (idx > 0) { const n = [...bottomNav]; [n[idx], n[idx - 1]] = [n[idx - 1], n[idx]]; setBottomNav(n); } }} disabled={idx === 0} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5 text-gray-500" /></button>
                    <button onClick={() => { if (idx < bottomNav.length - 1) { const n = [...bottomNav]; [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]]; setBottomNav(n); } }} disabled={idx === bottomNav.length - 1} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5 text-gray-500" /></button>
                    <button onClick={() => setBottomNav(bottomNav.filter((_, i) => i !== idx))} className="p-1.5 hover:bg-red-50 rounded-lg ml-auto"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button onClick={() => setBottomNav(DEFAULT_BOTTOM_NAV)} className="text-[12px] font-medium text-gray-500 hover:text-gray-700">Reset to defaults</button>
            </div>
          </div>
        )}

        {activeTab === "automation" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-orange-500" />
              <h2 className="text-[16px] font-bold text-gray-900">Automation Settings</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-[13px] font-bold text-gray-800">Auto Section Adjuster</p>
                  <p className="text-[11px] text-gray-500">When products are fetched, automatically assign them to homepage sections</p>
                </div>
                <button
                  onClick={() => setAutoSections(!autoSections)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${autoSections ? "bg-[#0c831f]" : "bg-gray-300"}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoSections ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-[13px] font-bold text-gray-800">Auto Round Prices</p>
                  <p className="text-[11px] text-gray-500">Automatically round all prices up to nearest rupee (e.g. ₹16.6 → ₹17)</p>
                </div>
                <button
                  onClick={() => setAutoRoundPrices(!autoRoundPrices)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${autoRoundPrices ? "bg-[#0c831f]" : "bg-gray-300"}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoRoundPrices ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-gray-800">Round All Prices Now</p>
                  <p className="text-[11px] text-gray-500">Manually round all existing product prices to whole numbers</p>
                  {roundResult && <p className="text-[11px] text-green-600 font-semibold mt-1">{roundResult}</p>}
                </div>
                <button
                  onClick={handleRoundPrices}
                  disabled={roundingPrices}
                  className="flex items-center gap-1.5 h-8 px-3 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${roundingPrices ? "animate-spin" : ""}`} />
                  {roundingPrices ? "Rounding..." : "Round Prices"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                <h2 className="text-[16px] font-bold text-gray-900">WhatsApp Business Integration</h2>
                {whatsappConnected && (
                  <span className="ml-auto text-[11px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Connected
                  </span>
                )}
              </div>
              <p className="text-[13px] text-gray-500 mb-5">
                {whatsappConnected
                  ? "Your WhatsApp account is connected. OTPs and order notifications will be sent from this number."
                  : "Connect your WhatsApp account to send OTP messages and order notifications to customers."}
              </p>

              {waStatus === "disconnected" && !whatsappConnected ? (
                <div className="space-y-4">
                  {waError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-[12px] text-red-600 font-medium">{waError}</p>
                    </div>
                  )}
                  <button
                    onClick={handleConnectWhatsApp}
                    className="w-full h-12 bg-[#25d366] hover:bg-[#20bd5a] text-white font-bold text-[14px] rounded-xl transition-colors flex items-center justify-center gap-2.5 shadow-lg shadow-[#25d366]/20"
                  >
                    <QrCode className="w-5 h-5" /> Connect WhatsApp Device
                  </button>
                  <p className="text-[11px] text-gray-400 text-center">This will launch a real WhatsApp Web session. Scan the QR code with your phone to link this server.</p>
                </div>
              ) : waStatus === "connecting" && !waQrDataUrl ? (
                <div className="border-2 border-[#25d366] rounded-2xl overflow-hidden">
                  <div className="bg-[#075e54] px-5 py-3">
                    <p className="text-white font-bold text-[14px]">Initializing WhatsApp...</p>
                  </div>
                  <div className="bg-white p-8 flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-[#25d366]/30 border-t-[#25d366] rounded-full animate-spin mb-5" />
                    <p className="text-[15px] font-bold text-gray-800 mb-1">Starting WhatsApp Web</p>
                    <p className="text-[12px] text-gray-500 text-center">Launching headless browser and generating QR code...</p>
                  </div>
                </div>
              ) : (waStatus === "qr_ready" || waStatus === "connecting") && waQrDataUrl ? (
                <div className="border-2 border-[#25d366] rounded-2xl overflow-hidden">
                  <div className="bg-[#075e54] px-5 py-3 flex items-center gap-3">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.467l4.584-1.472A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.18-.693-5.82-1.87l-.418-.249-2.718.873.888-2.643-.273-.434A9.785 9.785 0 012.182 12c0-5.418 4.4-9.818 9.818-9.818 5.418 0 9.818 4.4 9.818 9.818 0 5.418-4.4 9.818-9.818 9.818z"/></svg>
                    <div>
                      <p className="text-white font-bold text-[14px]">Scan QR Code</p>
                      <p className="text-white/70 text-[11px]">Open WhatsApp on your phone → Settings → Linked Devices → Link a Device</p>
                    </div>
                  </div>
                  <div className="bg-white p-6">
                    <div className="flex flex-col items-center">
                      <div className="relative p-3 border-4 border-[#25d366] rounded-2xl mb-4">
                        <img src={waQrDataUrl} alt="WhatsApp QR Code" className="w-[240px] h-[240px]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                            <svg className="w-7 h-7 text-[#25d366]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                          </div>
                        </div>
                      </div>
                      <p className="text-[14px] font-bold text-gray-800 mb-1">Scan with WhatsApp</p>
                      <p className="text-[12px] text-gray-500 text-center max-w-[280px] mb-3">
                        Point your phone's camera at this QR code. The code refreshes automatically.
                      </p>
                      <p className="text-[10px] text-gray-400">Waiting for scan...</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3 flex items-center justify-center border-t border-gray-100">
                    <button
                      onClick={handleDisconnectWhatsApp}
                      className="text-[12px] font-medium text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : waStatus === "connected" || whatsappConnected ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-bold text-green-800">Device Connected</p>
                        <p className="text-[12px] text-green-600">{waPhoneNumber || whatsappNumber || "WhatsApp linked"}</p>
                      </div>
                      <button
                        onClick={handleDisconnectWhatsApp}
                        className="text-[12px] font-medium text-red-500 hover:text-red-600 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-[13px] font-bold text-gray-800">OTP via WhatsApp</p>
                        <p className="text-[11px] text-gray-500">Login OTPs will be sent from this WhatsApp account</p>
                      </div>
                      <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-[13px] font-bold text-gray-800">Order Notifications</p>
                        <p className="text-[11px] text-gray-500">Order updates sent from connected WhatsApp</p>
                      </div>
                      <button
                        onClick={() => setWhatsappOrderUpdates(!whatsappOrderUpdates)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${whatsappOrderUpdates ? "bg-green-600" : "bg-gray-300"}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${whatsappOrderUpdates ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-[13px] font-bold text-gray-800">Product Alerts</p>
                        <p className="text-[11px] text-gray-500">New product and offer notifications</p>
                      </div>
                      <button
                        onClick={() => setWhatsappProductAlerts(!whatsappProductAlerts)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${whatsappProductAlerts ? "bg-green-600" : "bg-gray-300"}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${whatsappProductAlerts ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  </div>

                  {whatsappOrderUpdates && (
                    <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                      <p className="text-[12px] text-green-700 font-medium">Order updates enabled. Customers will receive via WhatsApp:</p>
                      <ul className="text-[11px] text-green-600 mt-1 space-y-0.5">
                        <li>• Order confirmation with order ID</li>
                        <li>• Order packed notification</li>
                        <li>• Out for delivery alert with estimated time</li>
                        <li>• Delivery confirmation</li>
                      </ul>
                    </div>
                  )}

                  {whatsappProductAlerts && (
                    <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                      <p className="text-[12px] text-green-700 font-medium">Product alerts enabled. Customers will receive via WhatsApp:</p>
                      <ul className="text-[11px] text-green-600 mt-1 space-y-0.5">
                        <li>• New product additions with price and details</li>
                        <li>• Price drop and discount notifications</li>
                        <li>• Back-in-stock alerts for popular items</li>
                        <li>• Flash sale and limited offer announcements</li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-5 h-5 text-blue-600" />
                <h2 className="text-[16px] font-bold text-gray-900">SMS Gateway (Fast2SMS)</h2>
                {smsConfigured && (
                  <span className="ml-auto text-[11px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Connected
                  </span>
                )}
                {!smsConfigured && (
                  <span className="ml-auto text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                    Not configured
                  </span>
                )}
              </div>
              <p className="text-[13px] text-gray-500 mb-4">
                {smsConfigured
                  ? "SMS gateway is active. OTPs will be sent via SMS when WhatsApp is not connected."
                  : "Configure Fast2SMS to send OTPs via SMS. Without this, OTPs are only visible in the admin notifications panel (when WhatsApp is disconnected)."}
              </p>

              {smsConfigured ? (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-bold text-blue-800">{smsProvider} Active</p>
                        <p className="text-[12px] text-blue-600">API key is configured and ready</p>
                      </div>
                      <button
                        onClick={async () => {
                          try { await adminApi.removeSmsApiKey(); setSmsConfigured(false); setSmsApiKeyInput(""); showToast("SMS API key removed"); } catch { showToast("Failed to remove", "error"); }
                        }}
                        className="text-[12px] font-medium text-red-500 hover:text-red-600 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="border border-gray-100 rounded-xl p-4">
                    <p className="text-[13px] font-bold text-gray-800">OTP Delivery Priority</p>
                    <ul className="text-[11px] text-gray-500 mt-1.5 space-y-1">
                      <li>1. WhatsApp (if connected)</li>
                      <li>2. SMS via {smsProvider} (fallback)</li>
                      <li>3. Admin notification panel (always logged)</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[12px] font-semibold text-gray-600 block mb-1">Fast2SMS API Key</label>
                    <input
                      type="password"
                      value={smsApiKeyInput}
                      onChange={e => setSmsApiKeyInput(e.target.value)}
                      placeholder="Enter your Fast2SMS API key"
                      className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Get your API key from <a href="https://www.fast2sms.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">fast2sms.com</a> (free tier available for Indian numbers)
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!smsApiKeyInput.trim()) return;
                      setSmsSaving(true);
                      try { await adminApi.saveSmsApiKey(smsApiKeyInput.trim()); setSmsConfigured(true); showToast("SMS gateway configured!"); } catch { showToast("Failed to save API key", "error"); }
                      setSmsSaving(false);
                    }}
                    disabled={smsSaving || !smsApiKeyInput.trim()}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" /> {smsSaving ? "Saving..." : "Save API Key"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {toast && (
          <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-[13px] font-semibold transition-all animate-in fade-in slide-in-from-bottom-4 ${toast.type === "error" ? "bg-red-500 text-white" : "bg-[#0c831f] text-white"}`}>
            {toast.msg}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
