import { useRef, useState, useEffect } from "react";
import { Link } from "wouter";
import { ChevronRight, ChevronLeft, Clock, BadgePercent, Truck, Zap, ShieldCheck, RotateCcw } from "lucide-react";
import {
  useGetCategories,
  useGetProducts,
  useGetDeals,
} from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";

interface SectionButton {
  label: string;
  bg: string;
  tag?: string;
  emoji?: string;
  sublabel?: string;
  link?: string;
}

interface HomepageSection {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  bgFrom: string;
  bgTo: string;
  accentColor: string;
  type: string;
  categoryId?: number;
  categorySlug?: string;
  link?: string;
  visible?: boolean;
  buttons?: SectionButton[];
}

interface BannerItem {
  bg: string;
  tag: string;
  tagBg: string;
  title: string;
  sub: string;
  img: string;
  cta: string;
  ctaBg: string;
  link: string;
}

interface ValuePropItem {
  icon: string;
  color: string;
  bg: string;
  title: string;
  sub: string;
}

function usePublicSettings() {
  const [sections, setSections] = useState<HomepageSection[] | null>(null);
  const [banners, setBanners] = useState<BannerItem[] | null>(null);
  const [valueProps, setValueProps] = useState<ValuePropItem[] | null>(null);
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${base}/api/settings/public`)
      .then(r => r.json())
      .then(data => {
        if (data.homepage_sections) setSections(data.homepage_sections);
        if (data.homepage_banners) setBanners(data.homepage_banners);
        if (data.homepage_value_props) setValueProps(data.homepage_value_props);
        if (data.store_config) setStoreConfig(data.store_config);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const homepageLayout: "layout1" | "layout2" = storeConfig?.homepageLayout === "layout2" ? "layout2" : "layout1";
  return { sections, banners, valueProps, storeConfig, loading, homepageLayout };
}

const DEFAULT_BANNERS: BannerItem[] = [
  {
    bg: "from-[#e8f5e9] to-[#c8e6c9]", tag: "FRESH DELIVERY", tagBg: "bg-[#0c831f]",
    title: "Farm Fresh\nVegetables", sub: "Handpicked & delivered\nfresh to your home",
    img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80",
    cta: "Shop Now", ctaBg: "bg-[#0c831f]", link: "/category/vegetables",
  },
  {
    bg: "from-[#fff8e1] to-[#ffe0b2]", tag: "UP TO 40% OFF", tagBg: "bg-[#e65100]",
    title: "Daily\nEssentials", sub: "Atta, dal, oil & more",
    img: "https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?w=400&q=80",
    cta: "Shop Deals", ctaBg: "bg-[#e65100]", link: "/products",
  },
  {
    bg: "from-[#fce4ec] to-[#f8bbd0]", tag: "NEW ARRIVALS", tagBg: "bg-[#ad1457]",
    title: "Premium\nFruits", sub: "Mangoes, kiwis, berries & more",
    img: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80",
    cta: "Shop Fruits", ctaBg: "bg-[#ad1457]", link: "/category/fruits",
  },
];

const DEFAULT_VALUE_PROPS: ValuePropItem[] = [
  { icon: "truck", color: "#0c831f", bg: "#e6f4ea", title: "Fast Delivery", sub: "10-20 mins" },
  { icon: "percent", color: "#d44000", bg: "#fff0ea", title: "Best Prices", sub: "Lowest everyday" },
  { icon: "shield", color: "#1d4ed8", bg: "#eff6ff", title: "100% Authentic", sub: "Quality Assured" },
  { icon: "rotate", color: "#0891b2", bg: "#ecfeff", title: "Easy Returns", sub: "No hassle" },
];

const DEFAULT_SECTIONS: HomepageSection[] = [
  {
    id: "promo_first_order",
    title: "Get 10% OFF on your first order!",
    subtitle: "Use code: MKS10  |  Min. order ₹199",
    emoji: "🏷️",
    bgFrom: "#0c831f", bgTo: "#16a34a",
    accentColor: "#0c831f",
    type: "promo",
    link: "/products",
    visible: true,
    buttons: [{ label: "Shop Now", bg: "#ffffff", link: "/products" }],
  },
  {
    id: "quick_nav",
    title: "",
    subtitle: "",
    emoji: "",
    bgFrom: "#ffffff", bgTo: "#ffffff",
    accentColor: "#0c831f",
    type: "quicknav",
    visible: false,
    buttons: [
      { label: "New Arrivals", bg: "#e8f5e9", emoji: "🌟", sublabel: "Fresh stock", link: "/products" },
      { label: "Combo Offers", bg: "#fff3e0", emoji: "🎁", sublabel: "Save more", link: "/products" },
      { label: "Best Sellers", bg: "#fef3c7", emoji: "🏆", sublabel: "Top rated", link: "/products" },
      { label: "Seasonal Picks", bg: "#fce4ec", emoji: "🍂", sublabel: "Limited time", link: "/products" },
    ],
  },
  {
    id: "trust_pills",
    title: "Trust Badges",
    subtitle: "Why shop with us",
    emoji: "✅",
    bgFrom: "#f0fdf4", bgTo: "#dcfce7",
    accentColor: "#16a34a",
    type: "trustpills",
    visible: true,
    buttons: [
      { emoji: "🚚", label: "Free Delivery", sublabel: "On orders ₹199+", bg: "#e8f5e9" },
      { emoji: "✅", label: "Good Quality", sublabel: "Always fresh", bg: "#eff6ff" },
      { emoji: "🔒", label: "100% Safe", sublabel: "Secure payment", bg: "#fef3c7" },
      { emoji: "↩️", label: "Easy Return", sublabel: "No questions asked", bg: "#fce7f3" },
    ],
  },
  { id: "super_deals", title: "Top Discounted Products", subtitle: "Best deals & offers just for you!", emoji: "🔥", bgFrom: "#fffbeb", bgTo: "#fef3c7", accentColor: "#b45309", type: "deals", visible: true },
  { id: "vegetables", title: "Fresh Vegetables", subtitle: "Farm-fresh, picked daily", emoji: "🥦", bgFrom: "#ecfdf5", bgTo: "#d1fae5", accentColor: "#15803d", type: "category", categorySlug: "vegetables", visible: true },
  { id: "fruits", title: "Fresh Fruits", subtitle: "Sweet, ripe & nutritious", emoji: "🍎", bgFrom: "#fff7ed", bgTo: "#ffedd5", accentColor: "#ea580c", type: "category", categorySlug: "fruits", visible: true },
  { id: "dairy-eggs", title: "Dairy & Eggs", subtitle: "Milk, paneer, eggs & more", emoji: "🥛", bgFrom: "#eff6ff", bgTo: "#dbeafe", accentColor: "#1d4ed8", type: "category", categorySlug: "dairy-eggs", visible: true },
  { id: "snacks", title: "Snacks & Munchies", subtitle: "Crunchy, tasty & irresistible", emoji: "🍿", bgFrom: "#fff7ed", bgTo: "#ffedd5", accentColor: "#ea580c", type: "category", categorySlug: "snacks", visible: true },
  { id: "beverages", title: "Beverages", subtitle: "Juices, cola, chai & more", emoji: "🥤", bgFrom: "#ecfeff", bgTo: "#cffafe", accentColor: "#0891b2", type: "category", categorySlug: "beverages", visible: true },
  { id: "bakery", title: "Bakery & Bread", subtitle: "Freshly baked every morning", emoji: "🍞", bgFrom: "#fef7ee", bgTo: "#fed7aa", accentColor: "#c2410c", type: "category", categorySlug: "bakery", visible: true },
  { id: "meat-fish", title: "Meat & Fish", subtitle: "Fresh & hygienic non-veg", emoji: "🍗", bgFrom: "#fef2f2", bgTo: "#fecaca", accentColor: "#dc2626", type: "category", categorySlug: "meat-fish", visible: true },
  { id: "grains-pulses", title: "Grains & Pulses", subtitle: "Atta, rice, dal & more", emoji: "🌾", bgFrom: "#fffbeb", bgTo: "#fef3c7", accentColor: "#b45309", type: "category", categorySlug: "grains-pulses", visible: true },
  { id: "spices-masala", title: "Spices & Masala", subtitle: "Authentic Indian flavours", emoji: "🌶️", bgFrom: "#fef2f2", bgTo: "#fecaca", accentColor: "#dc2626", type: "category", categorySlug: "spices-masala", visible: true },
  { id: "oil-ghee", title: "Oil & Ghee", subtitle: "Pure oils & desi ghee", emoji: "🫒", bgFrom: "#f7fee7", bgTo: "#ecfccb", accentColor: "#65a30d", type: "category", categorySlug: "oil-ghee", visible: true },
  { id: "dry-fruits", title: "Dry Fruits & Nuts", subtitle: "Premium nuts & dried fruits", emoji: "🥜", bgFrom: "#fef7ee", bgTo: "#fed7aa", accentColor: "#92400e", type: "category", categorySlug: "dry-fruits", visible: true },
];

function ScrollRow({ products, loading }: {
  products?: ReturnType<typeof useGetProducts>["data"];
  loading: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 220, behavior: "smooth" });

  return (
    <div className="relative group mt-3">
      <button onClick={() => scroll(-1)} className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronLeft className="w-4 h-4 text-gray-600" />
      </button>
      <div ref={ref} className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 md:px-6">
        {loading
          ? Array(6).fill(0).map((_, i) => (
              <div key={i} className="shrink-0 w-[140px] md:w-[160px]">
                <Skeleton className="h-[240px] rounded-xl" />
              </div>
            ))
          : products && products.length > 0 ? products.map((p, i) => (
              <div key={p.id} className="shrink-0 w-[140px] md:w-[160px]">
                <ProductCard product={p} index={i} />
              </div>
            )) : (
              <div className="w-full py-6 text-center">
                <p className="text-[13px] text-gray-400">No products in this category yet</p>
              </div>
            )}
      </div>
      <button onClick={() => scroll(1)} className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );
}

function HeroBanner({ banners }: { banners: BannerItem[] }) {
  const [active, setActive] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.offsetWidth);
    setActive(idx);
  };

  const goTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.offsetWidth * i, behavior: "smooth" });
    setActive(i);
  };

  return (
    <div className="px-3 md:px-6">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory rounded-2xl"
      >
        {banners.map((b, i) => (
          <Link key={i} href={b.link} className="shrink-0 w-full snap-start">
            <div
              className={`relative overflow-hidden h-[140px] md:h-[155px] ${!b.bgFrom && b.bg ? `bg-gradient-to-br ${b.bg}` : ""}`}
              style={b.bgFrom ? { background: `linear-gradient(135deg, ${b.bgFrom}, ${b.bgTo || b.bgFrom})` } : undefined}
            >
              <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
                <span
                  className={`text-[9px] font-bold tracking-[0.1em] px-2.5 py-[4px] rounded-full w-fit text-white ${!b.tagColor && b.tagBg ? b.tagBg : ""}`}
                  style={b.tagColor ? { backgroundColor: b.tagColor } : undefined}
                >
                  {b.tag}
                </span>
                <div>
                  <h3 className="text-gray-900 font-extrabold text-[20px] leading-tight whitespace-pre-line">
                    {b.title}
                  </h3>
                  <p className="text-gray-500 text-[11px] mt-0.5 leading-tight whitespace-pre-line line-clamp-2">
                    {b.sub}
                  </p>
                  <div
                    className={`mt-2.5 text-[10px] font-bold px-3 py-[5px] rounded-full w-fit text-white shadow-sm ${!b.ctaColor && b.ctaBg ? b.ctaBg : ""}`}
                    style={b.ctaColor ? { backgroundColor: b.ctaColor } : undefined}
                  >
                    {b.cta} →
                  </div>
                </div>
              </div>
              <img src={b.img} alt="" className="absolute right-0 top-0 w-[48%] h-full object-cover opacity-25" />
            </div>
          </Link>
        ))}
      </div>
      {banners.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-200 ${
                i === active ? "w-5 h-1.5 bg-[#0c831f]" : "w-1.5 h-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryGrid({ layout2 = false }: { layout2?: boolean }) {
  const { data: categories, isLoading } = useGetCategories();

  return (
    <section className="px-3 md:px-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-[#0c831f] rounded-full shrink-0" />
          <h2 className="text-[15px] md:text-[17px] font-bold text-gray-900">Shop by Category</h2>
        </div>
        <Link href="/categories" className="flex items-center gap-0.5 text-[#0c831f] text-[12px] font-bold hover:underline shrink-0">
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-[82px] rounded-2xl">
              <Skeleton className="w-full h-full rounded-2xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2">
          {categories?.map((cat) => (
            <Link key={cat.id} href={`/category/${cat.slug}`} data-testid={`link-category-${cat.id}`}>
              <div
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl h-[82px] px-1 hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
                style={{ backgroundColor: cat.color + "15" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[22px] shrink-0"
                  style={{ backgroundColor: cat.color + "25" }}
                >
                  {cat.icon}
                </div>
                <span className="text-[9px] md:text-[10px] font-bold text-gray-700 text-center leading-tight line-clamp-2 w-full px-1">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function Layout2ProductGrid() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${base}/api/products?limit=80`)
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="px-3 md:px-6 pb-6">
      <div className="flex items-center gap-2.5 mb-3 mt-5">
        <div className="w-1 h-5 bg-[#0c831f] rounded-full shrink-0" />
        <h2 className="text-[16px] md:text-[18px] font-bold text-gray-900">All Products</h2>
        <Link href="/products" className="flex items-center gap-0.5 text-[#0c831f] text-[12px] font-bold hover:underline ml-auto">
          see all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {loading
          ? Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-[240px] rounded-xl" />)
          : products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>
    </section>
  );
}

const DEFAULT_TOP_BRANDS = ["Amul", "Tata", "Mother Dairy", "Haldiram's", "Britannia", "Nestle", "ITC", "Parle"];

const DEFAULT_QUICK_LINKS = [
  { label: "Atta & Flour", emoji: "🌾", bg: "bg-amber-50", border: "border-amber-200", link: "/category/grains-pulses" },
  { label: "Rice & Dal", emoji: "🍚", bg: "bg-yellow-50", border: "border-yellow-200", link: "/category/grains-pulses" },
  { label: "Oil & Ghee", emoji: "🫒", bg: "bg-green-50", border: "border-green-200", link: "/category/oil-ghee" },
  { label: "Masala", emoji: "🌶️", bg: "bg-red-50", border: "border-red-200", link: "/category/spices-masala" },
  { label: "Tea & Coffee", emoji: "🍵", bg: "bg-emerald-50", border: "border-emerald-200", link: "/category/beverages" },
  { label: "Biscuits", emoji: "🍪", bg: "bg-orange-50", border: "border-orange-200", link: "/category/snacks" },
  { label: "Bread", emoji: "🍞", bg: "bg-yellow-50", border: "border-yellow-200", link: "/category/bakery" },
  { label: "Eggs", emoji: "🥚", bg: "bg-slate-50", border: "border-slate-200", link: "/category/dairy-eggs" },
];

function QuickLinks({ items }: { items?: any[] }) {
  const links = items && items.length > 0 ? items : DEFAULT_QUICK_LINKS;
  return (
    <div className="px-3 md:px-6">
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
        {links.map((l: any) => (
          <Link key={l.label} href={l.link || "#"}>
            <div className={`shrink-0 ${l.bg || "bg-gray-50"} ${l.border || "border-gray-200"} border rounded-xl px-3 py-2 flex items-center gap-2 min-w-[110px] hover:shadow-md transition-shadow cursor-pointer`}>
              <span className="text-[18px] leading-none shrink-0">{l.emoji}</span>
              <span className="text-[11px] font-semibold text-gray-700 whitespace-nowrap">{l.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const ICON_MAP: Record<string, any> = {
  clock: Clock,
  percent: BadgePercent,
  zap: Zap,
  truck: Truck,
  shield: ShieldCheck,
  rotate: RotateCcw,
};

function ValueProps({ items }: { items: ValuePropItem[] }) {
  return (
    <div className="px-3 md:px-6">
      <div className="grid grid-cols-4 gap-2">
        {items.map(({ icon, color, bg, title, sub }) => {
          const Icon = ICON_MAP[icon] || Truck;
          return (
            <div key={title} className="bg-white rounded-xl px-1.5 py-2.5 h-[74px] flex flex-col items-center justify-center gap-1.5 border border-gray-100 text-center">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <div className="min-w-0 w-full">
                <div className="text-[9px] font-bold text-gray-900 leading-tight truncate px-0.5">{title}</div>
                <div className="text-[8px] text-gray-500 leading-tight truncate px-0.5">{sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionDivider() {
  return <div className="h-px bg-gray-100" />;
}

function PromoSection({ section }: { section: HomepageSection }) {
  const s = section as any;
  const ctaBtn = section.buttons?.[0] || (s.buttonLabel ? { label: s.buttonLabel, link: s.buttonLink || "/products" } : null);
  const href = ctaBtn?.link || s.link || (section.categorySlug ? `/category/${section.categorySlug}` : "/products");
  return (
    <div className="px-3 md:px-6 mt-3">
      <Link href={href}>
        <div
          className="relative rounded-2xl overflow-hidden px-4 py-3.5 flex items-center gap-3"
          style={{ background: `linear-gradient(135deg, ${section.bgFrom || "#0c831f"}, ${section.bgTo || "#16a34a"})` }}
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-[20px] leading-none">{section.emoji || "🏷️"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-extrabold text-[13px] leading-snug">{section.title}</p>
            <p className="text-white/80 text-[10px] mt-0.5 leading-tight">{section.subtitle}</p>
          </div>
          {ctaBtn && (
            <div className="shrink-0 bg-white rounded-2xl px-4 py-2.5">
              <span className="font-extrabold text-[13px] whitespace-nowrap" style={{ color: section.bgFrom || "#0c831f" }}>
                {ctaBtn.label}
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

function MiniBannerSection({ section }: { section: HomepageSection }) {
  const href = (section as any).link || (section.categorySlug ? `/category/${section.categorySlug}` : "/products");
  return (
    <div className="px-3 md:px-6 py-1">
      <Link href={href}>
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${section.bgFrom || "#e8f5e9"}, ${section.bgTo || "#c8e6c9"})` }}
        >
          <span className="text-[22px] leading-none shrink-0">{section.emoji || "🚚"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-gray-900 leading-tight truncate">{section.title}</p>
            {section.subtitle && <p className="text-[10px] text-gray-600 mt-0.5 leading-tight truncate">{section.subtitle}</p>}
          </div>
          <div
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: section.accentColor || "#0c831f" }}
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
        </div>
      </Link>
    </div>
  );
}

function QuickNavSection({ section }: { section: HomepageSection }) {
  const buttons = section.buttons || [];
  if (buttons.length === 0) return null;
  return (
    <div className="px-3 md:px-6">
      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        {buttons.map((btn, i) => (
          <Link key={i} href={btn.link || "/products"}>
            <div
              className="shrink-0 flex items-center gap-2.5 rounded-xl px-3.5 py-2 border border-gray-100 min-w-[130px] hover:shadow-md transition-shadow cursor-pointer"
              style={{ backgroundColor: btn.bg || "#f9fafb" }}
            >
              {btn.emoji && <span className="text-[22px] leading-none shrink-0">{btn.emoji}</span>}
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-gray-900 whitespace-nowrap leading-tight">{btn.label}</div>
                {btn.sublabel && <div className="text-[10px] text-gray-500 whitespace-nowrap leading-tight">{btn.sublabel}</div>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const DEFAULT_TRUST_PILLS = [
  { emoji: "🚚", label: "Free Delivery", sub: "On orders ₹199+", bg: "#e8f5e9", accent: "#0c831f" },
  { emoji: "✅", label: "Good Quality", sub: "Always fresh", bg: "#eff6ff", accent: "#1d4ed8" },
  { emoji: "🔒", label: "100% Safe", sub: "Secure payment", bg: "#fef3c7", accent: "#b45309" },
  { emoji: "↩️", label: "Easy Return", sub: "No questions asked", bg: "#fce7f3", accent: "#be185d" },
];

function TrustPillsSection({ section }: { section: HomepageSection }) {
  const pills = (section.buttons && section.buttons.length > 0)
    ? section.buttons
    : DEFAULT_TRUST_PILLS;
  return (
    <div className="px-3 md:px-6 mt-3 mb-3">
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
        {pills.map((pill: any, i: number) => (
          <div key={i} className="shrink-0 flex flex-col items-center justify-center rounded-2xl px-4 py-3 min-w-[90px] border border-gray-100 shadow-sm" style={{ backgroundColor: pill.bg || "#f0fdf4" }}>
            <span className="text-[22px] leading-none mb-1.5">{pill.emoji}</span>
            <p className="text-[11px] font-bold text-gray-900 whitespace-nowrap text-center leading-tight">{pill.label}</p>
            <p className="text-[9px] text-gray-500 whitespace-nowrap text-center mt-0.5 leading-tight">{pill.sublabel || pill.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FullBannerSection({ section }: { section: HomepageSection }) {
  const s = section as any;
  const href = s.link || s.buttonLink || (section.categorySlug ? `/category/${section.categorySlug}` : "/products");
  const tagText = s.tagText || s.tagLabel;
  const ctaText = s.ctaText || s.buttonLabel || "Shop Now";
  const bgFrom = section.bgFrom || "#0c831f";
  const bgTo = section.bgTo || "#16a34a";
  return (
    <div className="px-3 md:px-6 py-1">
      <Link href={href}>
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${bgFrom}, ${bgTo})` }}
        >
          <div className="flex items-center gap-3 p-4 pr-3">
            <div className="flex-1 min-w-0">
              {tagText && (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold mb-2 tracking-wide">
                  {tagText}
                </div>
              )}
              {!tagText && section.emoji && (
                <div className="text-[28px] mb-1.5 leading-none">{section.emoji}</div>
              )}
              {section.title && (
                <h3 className="text-white font-extrabold text-[17px] leading-tight">{section.title}</h3>
              )}
              {section.subtitle && (
                <p className="text-white/75 text-[11px] mt-1 leading-tight">{section.subtitle}</p>
              )}
              <div className="mt-3 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3.5 py-1.5 rounded-xl shadow-sm">
                <span className="text-[12px] font-bold" style={{ color: bgFrom }}>{ctaText}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: bgFrom }} />
              </div>
            </div>
            {s.imageUrl ? (
              <img src={s.imageUrl} alt="" className="w-[38%] h-[110px] object-contain rounded-xl shrink-0 drop-shadow-lg" />
            ) : (
              <div className="w-[72px] h-[72px] rounded-2xl bg-white/15 flex items-center justify-center shrink-0 text-[38px] leading-none">
                {section.emoji || "🛒"}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

function TopBrandsSection({ brands, bg = "dark" }: { brands?: string[]; bg?: string }) {
  const list = brands && brands.length > 0 ? brands : DEFAULT_TOP_BRANDS;
  const bgClass = bg === "green"
    ? "bg-gradient-to-r from-[#0c831f] to-[#16a34a]"
    : bg === "light"
    ? "bg-gray-50 border-t border-b border-gray-100"
    : "bg-gradient-to-r from-[#1e293b] to-[#334155]";
  const titleClass = bg === "light" ? "text-gray-900" : "text-white";
  const subClass = bg === "light" ? "text-gray-500" : "text-gray-400";
  const chipClass = bg === "light"
    ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
    : "bg-white/10 border border-white/20 text-white hover:bg-white/20";
  return (
    <>
      <SectionDivider />
      <div className={`${bgClass} py-5`}>
        <div className="flex items-center gap-2 px-4 md:px-6 mb-3">
          <span className="text-xl">⭐</span>
          <div>
            <h2 className={`text-[16px] font-bold ${titleClass}`}>Top Brands</h2>
            <p className={`text-[11px] ${subClass} mt-0.5`}>Shop from India's most trusted brands</p>
          </div>
        </div>
        <div className="flex gap-2 px-4 md:px-6 overflow-x-auto no-scrollbar">
          {list.map(b => (
            <Link key={b} href="/products">
              <div className={`shrink-0 ${chipClass} rounded-xl px-4 py-2.5 transition-colors`}>
                <span className="text-[12px] font-bold whitespace-nowrap">{b}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

function DynamicSectionContent({ section }: { section: HomepageSection }) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [products, setProducts] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const sectionProductIds = (section as any).productIds as number[] | undefined;
  const maxProducts = (section as any).maxProducts as number | undefined;

  const isNonProductType = section.type === "promo" || section.type === "quicknav" || section.type === "minibanner";

  useEffect(() => {
    if (isNonProductType) { setLoading(false); return; }

    const fetchProducts = async () => {
      try {
        let mainProducts: any[] = [];
        const limit = maxProducts || 20;

        if (section.type === "custom") {
          if (sectionProductIds && sectionProductIds.length > 0) {
            const idsStr = sectionProductIds.join(",");
            const r = await fetch(`${base}/api/products?ids=${idsStr}`);
            mainProducts = await r.json();
          }
        } else {
          if (section.type === "deals") {
            const r = await fetch(`${base}/api/deals`);
            mainProducts = await r.json();
          } else if (section.type === "featured") {
            const r = await fetch(`${base}/api/products?featured=true&limit=${limit}`);
            mainProducts = await r.json();
          } else if (section.categorySlug) {
            const r = await fetch(`${base}/api/products?categorySlug=${section.categorySlug}&limit=${limit}`);
            mainProducts = await r.json();
          } else if (section.categoryId) {
            const r = await fetch(`${base}/api/products?categoryId=${section.categoryId}&limit=${limit}`);
            mainProducts = await r.json();
          }

          if (sectionProductIds && sectionProductIds.length > 0) {
            const idsStr = sectionProductIds.join(",");
            const r = await fetch(`${base}/api/products?ids=${idsStr}`);
            const pinned: any[] = await r.json();
            const existingIds = new Set(mainProducts.map((p: any) => String(p.id)));
            const newPinned = pinned.filter((p: any) => !existingIds.has(String(p.id)));
            mainProducts = [...newPinned, ...mainProducts];
          }
        }

        if (maxProducts && mainProducts.length > maxProducts) {
          mainProducts = mainProducts.slice(0, maxProducts);
        }

        setProducts(mainProducts);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [section.type, section.categorySlug, section.categoryId, sectionProductIds?.join(","), maxProducts, isNonProductType]);

  if (section.visible === false) return null;

  if (section.type === "promo") {
    return <PromoSection section={section} />;
  }

  if (section.type === "minibanner") {
    return <MiniBannerSection section={section} />;
  }

  if (section.type === "quicknav") {
    return <QuickNavSection section={section} />;
  }

  if (section.type === "trustpills") {
    return <TrustPillsSection section={section} />;
  }

  if (section.type === "fullbanner") {
    return <FullBannerSection section={section} />;
  }

  if (!loading && (!products || products.length === 0)) return null;

  if (loading) {
    return (
      <>
        <SectionDivider />
        <div className="rounded-t-2xl overflow-hidden py-4" style={{ minHeight: 300 }}>
          <div className="flex items-center gap-2 px-4 md:px-6">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28 mt-1" />
            </div>
          </div>
          <div className="flex gap-2.5 overflow-hidden px-4 md:px-6 mt-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="shrink-0 w-[140px] md:w-[160px]">
                <Skeleton className="h-[240px] rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  const hasGradient = section.bgFrom && section.bgTo && section.bgFrom !== "#ffffff";

  const filteredProducts = activeFilter && products
    ? products.filter((p: any) => {
        const tag = activeFilter.toLowerCase();
        const name = (p.name || "").toLowerCase();
        const tags = (p.tags || []).map((t: string) => t.toLowerCase());
        const desc = (p.description || "").toLowerCase();
        return name.includes(tag) || tags.some((t: string) => t.includes(tag)) || desc.includes(tag);
      })
    : products;

  return (
    <>
      <SectionDivider />
      <div
        className="rounded-t-2xl overflow-hidden py-4"
        style={hasGradient ? { background: `linear-gradient(to bottom, ${section.bgFrom}, ${section.bgTo})` } : undefined}
      >
        <div className="flex items-center justify-between px-4 md:px-6 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[20px]">{section.emoji}</span>
            <div>
              <h2 className="text-[16px] font-bold text-gray-900">{section.title}</h2>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: section.accentColor || "#666" }}>{section.subtitle}</p>
            </div>
          </div>
          <Link href={section.categorySlug ? `/category/${section.categorySlug}` : "/products"} className="flex items-center gap-0.5 text-[12px] font-bold hover:underline shrink-0" style={{ color: section.accentColor || "#0c831f" }}>
            See all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {section.buttons && section.buttons.length > 0 && (
          <div className="flex gap-3 px-4 md:px-6 mt-3 mb-1 overflow-x-auto no-scrollbar">
            {section.buttons.map((btn: any, i: number) => {
              const isActive = activeFilter === (btn.tag || btn.label);
              return (
                <button
                  key={i}
                  onClick={() => setActiveFilter(isActive ? null : (btn.tag || btn.label))}
                  className={`shrink-0 h-[38px] flex items-center gap-1.5 rounded-xl px-4 border transition-all duration-150 ${
                    isActive
                      ? "text-white border-transparent shadow-sm"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                  style={isActive ? { backgroundColor: btn.bg } : undefined}
                >
                  {btn.emoji && <span className="text-[16px] leading-none shrink-0">{btn.emoji}</span>}
                  <span className="text-[13px] font-medium whitespace-nowrap leading-none">{btn.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <ScrollRow products={filteredProducts || undefined} loading={loading} />
      </div>
    </>
  );
}

export function Home() {
  const { sections: savedSections, banners: savedBanners, valueProps: savedValueProps, storeConfig, loading: settingsLoading, homepageLayout } = usePublicSettings();

  const sections: HomepageSection[] = savedSections || DEFAULT_SECTIONS;

  const banners = savedBanners || DEFAULT_BANNERS;
  const valueProps = savedValueProps || DEFAULT_VALUE_PROPS;
  const visibleSections = sections.filter(s => s.visible !== false);
  const showQuickLinks = storeConfig?.showQuickLinks === true;
  const showCategories = storeConfig?.showCategories !== false;

  const showTopBrands = storeConfig?.showTopBrands !== false;
  const topBrandsPosition: string = storeConfig?.topBrandsPosition || "middle";
  const topBrandsBg: string = storeConfig?.topBrandsBg || "dark";
  const topBrandsEl = showTopBrands
    ? <TopBrandsSection brands={storeConfig?.topBrands} bg={topBrandsBg} />
    : null;

  const firstBatch = visibleSections.slice(0, 8);
  const secondBatch = visibleSections.slice(8);

  if (settingsLoading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="space-y-4 pt-3 pb-2 px-3 md:px-6">
          <Skeleton className="h-[140px] rounded-2xl" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[74px] rounded-xl" />)}
          </div>
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-4 gap-2">
            {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-[82px] rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (homepageLayout === "layout2") {
    return (
      <div className="bg-white">
        <div className="space-y-3.5 pt-3 pb-3">
          <HeroBanner banners={banners} />
          <ValueProps items={valueProps} />
          {showCategories && <CategoryGrid />}
          {visibleSections.filter(s => s.type === "promo").map((s, i) => (
            <DynamicSectionContent key={s.id || i} section={s} />
          ))}
          {visibleSections.filter(s => s.type === "quicknav").map((s, i) => (
            <DynamicSectionContent key={s.id || i} section={s} />
          ))}
          {visibleSections.filter(s => s.type === "trustpills").map((s, i) => (
            <DynamicSectionContent key={s.id || i} section={s} />
          ))}
          {showQuickLinks && <QuickLinks items={storeConfig?.quickLinks} />}
        </div>
        <div className="h-px bg-gray-100 mx-3 my-1" />
        <Layout2ProductGrid />
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="space-y-3.5 pt-3">
        <HeroBanner banners={banners} />
        <ValueProps items={valueProps} />
        {showCategories && <CategoryGrid />}
        {showQuickLinks && <QuickLinks items={storeConfig?.quickLinks} />}
      </div>

      {topBrandsPosition === "top" && topBrandsEl}

      {firstBatch.map((section, idx) => (
        <DynamicSectionContent key={section.id || idx} section={section} />
      ))}

      {topBrandsPosition === "middle" && topBrandsEl}

      {secondBatch.map((section, idx) => (
        <DynamicSectionContent key={section.id || `after-${idx}`} section={section} />
      ))}

      {topBrandsPosition === "bottom" && topBrandsEl}

      <SectionDivider />

      <div className="bg-white py-6 flex justify-center">
        <Link href="/products">
          <div className="border-2 border-[#0c831f] rounded-full px-6 py-3 flex items-center gap-2 hover:bg-[#e6f4ea] transition-colors">
            <span className="text-[13px] font-bold text-[#0c831f]">Browse all products</span>
            <ChevronRight className="w-4 h-4 text-[#0c831f]" />
          </div>
        </Link>
      </div>

      <div className="h-4" />
    </div>
  );
}
