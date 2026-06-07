import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingCart, MapPin, ChevronDown, Home, Grid3X3, User, Zap, ChevronRight, Heart, Tag, Package, Percent, Star } from "lucide-react";
import { useGetCart, useGetCategories } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ICON_MAP: Record<string, any> = {
  home: Home, grid: Grid3X3, cart: ShoppingCart, user: User,
  search: Search, heart: Heart, tag: Tag, package: Package,
  percent: Percent, star: Star,
};

const BASE = import.meta.env.BASE_URL || "/";

interface StoreConfig {
  storeName: string;
  deliveryTagline: string;
  storeState: string;
  footerText: string;
  showFooter?: boolean;
}

function StoreName({ name, size }: { name: string; size: "sm" | "lg" }) {
  const textSize = size === "lg" ? "text-[19px]" : "text-[16px]";

  if (!name) return <span className={`font-extrabold ${textSize} tracking-tight leading-none text-transparent`}>Loading</span>;

  const words = name.trim().split(/\s+/);
  let first: string;
  let rest: string;

  if (words.length > 1) {
    first = words[0];
    rest = words.slice(1).join(" ");
  } else {
    const suffixes = ["STORE", "MART", "SHOP", "BASKET", "FRESH", "KART", "CART", "BAZAAR", "MARKET", "store", "mart", "shop", "basket", "fresh", "kart", "cart", "bazaar", "market", "Store", "Mart", "Shop", "Basket", "Fresh", "Kart", "Cart", "Bazaar", "Market"];
    let splitIdx = -1;
    for (const suf of suffixes) {
      const idx = name.indexOf(suf);
      if (idx > 0) {
        splitIdx = idx;
        break;
      }
    }
    if (splitIdx > 0) {
      first = name.slice(0, splitIdx);
      rest = name.slice(splitIdx);
    } else {
      first = name;
      rest = "";
    }
  }

  if (!rest) {
    return (
      <span className={`font-extrabold ${textSize} tracking-tight leading-none text-[#0c831f]`}>
        {first}
      </span>
    );
  }
  return (
    <span className={`font-extrabold ${textSize} tracking-tight leading-none`}>
      <span className="text-[#0c831f]">{first}</span>
      <span className="text-[#f3c614]">{rest}</span>
    </span>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: cart } = useGetCart();
  const { data: categories } = useGetCategories();
  const { user } = useAuth();
  const [storeCity, setStoreCity] = useState("Nagpur");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [bottomNavConfig, setBottomNavConfig] = useState<any[] | null>(null);
  const [config, setConfig] = useState<StoreConfig>(() => {
    try {
      const cached = sessionStorage.getItem("store_config");
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      storeName: "",
      deliveryTagline: "Fast delivery to your door",
      storeState: "Maharashtra",
      footerText: "Groceries delivered to your doorstep. Fresh produce, dairy, snacks & more.",
    };
  });

  useEffect(() => {
    fetch(`${BASE}api/settings/public`).then(r => r.json()).then(d => {
      if (d.store_city) {
        const c = String(d.store_city).replace(/^"|"$/g, "");
        setStoreCity(c);
      }
      if (d.store_config) {
        setConfig(prev => {
          const newConfig = {
            storeName: d.store_config.storeName || prev.storeName,
            deliveryTagline: d.store_config.deliveryTagline ?? prev.deliveryTagline,
            storeState: d.store_config.storeState ?? prev.storeState,
            footerText: d.store_config.footerText ?? prev.footerText,
            showFooter: d.store_config.showFooter !== false,
          };
          try { sessionStorage.setItem("store_config", JSON.stringify(newConfig)); } catch {}
          if (newConfig.storeName) document.title = `${newConfig.storeName} - Grocery Store`;
          return newConfig;
        });
      }
      if (d.bottom_nav && Array.isArray(d.bottom_nav)) setBottomNavConfig(d.bottom_nav);
    }).catch(() => {}).finally(() => setSettingsLoaded(true));
  }, []);

  const totalItems = cart?.itemCount ?? 0;
  const totalPrice = cart?.total ?? 0;

  const isProductPage = location.startsWith("/product/");
  const isCartPage = location === "/cart";
  const isCheckoutFlow = location.startsWith("/checkout/");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f2f3f5]">
      {!isProductPage && !isCheckoutFlow && (
        <header className="sticky top-0 z-50 w-full bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.06)]">
          <div className="hidden md:flex max-w-[1400px] mx-auto px-6 h-[60px] items-center gap-5">
            <Link href="/" className="flex items-center gap-2 shrink-0" data-testid="link-home">
              <div className="bg-[#0c831f] rounded-xl p-1.5 shadow-sm">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <StoreName name={config.storeName} size="lg" />
            </Link>

            <div className="w-px h-9 bg-gray-200 shrink-0" />

            <button className="flex items-center gap-2 shrink-0 group hover:bg-[#f0fdf4] rounded-xl px-3 py-1.5 transition-colors">
              <div className="bg-[#e6f4ea] rounded-lg p-1.5">
                <MapPin className="w-4 h-4 text-[#0c831f] shrink-0" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[13px] text-gray-900">{config.deliveryTagline}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <span className="text-[11px] text-gray-500 block max-w-[150px] truncate">
                  {storeCity}, {config.storeState}
                </span>
              </div>
            </button>

            <form onSubmit={handleSearch} className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                <input
                  type="search"
                  placeholder="Search for atta, dal, fruits and more..."
                  className="w-full h-[42px] pl-10 pr-4 bg-[#f4f5f7] border border-transparent rounded-xl text-[14px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0c831f]/20 focus:border-[#0c831f] focus:bg-white transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </form>

            <Link href={user ? "/account" : "/login"} className="flex items-center gap-2 shrink-0 text-gray-700 hover:text-[#0c831f] hover:bg-[#f0fdf4] rounded-xl px-3 py-2 transition-colors">
              <User className="w-[18px] h-[18px]" />
              <span className="text-[13px] font-semibold">{user ? (user.name || "Account") : "Login"}</span>
            </Link>

            <Link href="/cart" className="shrink-0">
              <button
                className="flex items-center gap-2 bg-[#0c831f] hover:bg-[#0a6f1a] text-white rounded-xl px-4 h-[42px] transition-colors shadow-sm"
                data-testid="button-cart"
              >
                <ShoppingCart className="w-[18px] h-[18px] shrink-0" />
                {totalItems > 0 ? (
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] font-medium opacity-90">{totalItems} item{totalItems > 1 ? "s" : ""}</span>
                    <span className="text-[13px] font-bold">₹{totalPrice.toFixed(0)}</span>
                  </div>
                ) : (
                  <span className="text-[13px] font-semibold">My Cart</span>
                )}
              </button>
            </Link>
          </div>

          <div className="md:hidden">
            <div className="px-3 pt-2 pb-1 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-1.5 shrink-0" data-testid="link-home">
                <div className="bg-[#0c831f] rounded-lg p-1">
                  <Zap className="w-4 h-4 text-white fill-white" />
                </div>
                <StoreName name={config.storeName} size="sm" />
              </Link>
              <Link href="/cart" className="shrink-0">
                <button className="flex items-center gap-1.5 bg-[#0c831f] text-white rounded-lg px-2.5 h-[32px] shadow-sm" data-testid="button-cart">
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  {totalItems > 0 ? (
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-[8px] font-medium opacity-90">{totalItems} item{totalItems > 1 ? "s" : ""}</span>
                      <span className="text-[11px] font-bold">₹{totalPrice.toFixed(0)}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-semibold">Cart</span>
                  )}
                </button>
              </Link>
            </div>
            <div className="px-3 pb-1 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-[#0c831f] shrink-0" />
              <span className="text-[11px] font-bold text-gray-900 truncate">{config.deliveryTagline}</span>
              <span className="text-[10px] text-gray-400 shrink-0">{storeCity}</span>
              <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
            </div>
            <div className="px-3 pb-2">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Search for atta, dal, fruits..."
                    className="w-full h-[36px] pl-9 pr-3 bg-[#f4f5f7] border border-transparent rounded-xl text-[13px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0c831f]/20 focus:border-[#0c831f] focus:bg-white transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search"
                  />
                </div>
              </form>
            </div>
          </div>

          <div className="hidden md:block border-t border-gray-100 bg-white">
            <div className="max-w-[1400px] mx-auto px-6">
              <div className={`flex items-center gap-0 ${(categories?.length ?? 0) > 6 ? "overflow-x-auto no-scrollbar" : ""}`}>
                {categories?.map((cat) => {
                  const isActive = location === `/category/${cat.slug}`;
                  const fewCats = (categories?.length ?? 0) <= 6;
                  return (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      className={`flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-all ${fewCats ? "flex-1" : "shrink-0"} ${isActive ? "text-[#0c831f] border-[#0c831f] bg-[#f0fdf4]/50" : "text-gray-600 border-transparent hover:text-[#0c831f] hover:border-[#0c831f]/40"}`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      {cat.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </header>
      )}

      {isProductPage && (
        <header className="hidden md:block sticky top-0 z-50 w-full bg-white shadow-sm">
          <div className="max-w-[1400px] mx-auto px-6 h-[60px] flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="bg-[#0c831f] rounded-xl p-1.5 shadow-sm">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <StoreName name={config.storeName} size="lg" />
            </Link>
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search for atta, dal, fruits and more..."
                  className="w-full h-[40px] pl-10 pr-4 bg-[#f4f5f7] border border-transparent rounded-xl text-[14px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
            <Link href="/cart" className="shrink-0">
              <button className="flex items-center gap-2 bg-[#0c831f] hover:bg-[#0a6f1a] text-white rounded-lg px-3 h-[40px] transition-colors">
                <ShoppingCart className="w-4 h-4 shrink-0" />
                {totalItems > 0 ? (
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] font-medium opacity-90">{totalItems} item{totalItems > 1 ? "s" : ""}</span>
                    <span className="text-[13px] font-bold">₹{totalPrice.toFixed(0)}</span>
                  </div>
                ) : (
                  <span className="text-[13px] font-semibold">My Cart</span>
                )}
              </button>
            </Link>
          </div>
        </header>
      )}

      <main className={`flex-1 ${isProductPage || isCheckoutFlow || isCartPage ? "pb-0" : "pb-[60px] md:pb-0"}`}>
        {children}
      </main>

      {!isProductPage && !isCartPage && !isCheckoutFlow && settingsLoaded && config.showFooter !== false && (
        <footer className="bg-white border-t mt-8">
          <div className="md:hidden px-4 py-6 pb-20 space-y-4">
            <div className="flex items-center gap-1.5">
              <div className="bg-[#0c831f] rounded-lg p-1">
                <Zap className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <StoreName name={config.storeName} size="sm" />
            </div>
            <p className="text-[12px] text-gray-500 leading-relaxed">{config.footerText}</p>
            <div className="grid grid-cols-3 gap-3 text-[11px]">
              <div>
                <h4 className="font-bold text-gray-900 mb-1.5">Categories</h4>
                {["Vegetables", "Fruits", "Dairy & Eggs"].map(c => (
                  <p key={c} className="text-gray-500 py-0.5">{c}</p>
                ))}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1.5">Company</h4>
                {["About us", "Careers", "Contact"].map(c => (
                  <p key={c} className="text-gray-500 py-0.5">{c}</p>
                ))}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1.5">Legal</h4>
                {["Terms", "Privacy", "Refund"].map(c => (
                  <p key={c} className="text-gray-500 py-0.5">{c}</p>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <p className="text-[10px] text-gray-400 text-center">© {new Date().getFullYear()} {config.storeName}. Made with love in India</p>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="max-w-[1400px] mx-auto px-6 py-10 grid grid-cols-5 gap-8">
              <div className="col-span-2 space-y-3">
                <div className="flex items-center gap-1.5">
                  <div className="bg-[#0c831f] rounded-lg p-1.5">
                    <Zap className="w-4 h-4 text-white fill-white" />
                  </div>
                  <StoreName name={config.storeName} size="lg" />
                </div>
                <p className="text-[14px] text-gray-500 max-w-xs leading-relaxed">
                  {config.footerText}
                </p>
                <div className="flex gap-2 pt-2">
                  {["App Store", "Play Store"].map(s => (
                    <div key={s} className="bg-black text-white text-[12px] font-medium px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                      {s}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-[14px] mb-3 text-gray-900">Categories</h4>
                <ul className="space-y-2">
                  {["Vegetables", "Fruits", "Dairy & Eggs", "Snacks", "Beverages"].map(c => (
                    <li key={c}><a href="#" className="text-[13px] text-gray-500 hover:text-[#0c831f] transition-colors">{c}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-[14px] mb-3 text-gray-900">Company</h4>
                <ul className="space-y-2">
                  {["About us", "Careers", "Blog", "Press", "Contact us"].map(c => (
                    <li key={c}><a href="#" className="text-[13px] text-gray-500 hover:text-[#0c831f] transition-colors">{c}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-[14px] mb-3 text-gray-900">Legal</h4>
                <ul className="space-y-2">
                  {["Terms of service", "Privacy policy", "Refund policy", "Cookie policy"].map(c => (
                    <li key={c}><a href="#" className="text-[13px] text-gray-500 hover:text-[#0c831f] transition-colors">{c}</a></li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border-t">
              <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
                <span className="text-[12px] text-gray-400">© {new Date().getFullYear()} {config.storeName}. All rights reserved.</span>
                <span className="text-[12px] text-gray-400">Made with love in India</span>
              </div>
            </div>
          </div>
        </footer>
      )}

      <AnimatePresence>
        {totalItems > 0 && !isProductPage && !isCheckoutFlow && location !== "/cart" && (
          <motion.div
            key="cart-pill"
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="md:hidden fixed bottom-[64px] left-1/2 -translate-x-1/2 z-40 w-auto"
          >
            <Link href="/cart">
              <div className="bg-[#0c831f] rounded-full pl-2 pr-3 py-1.5 flex items-center gap-2.5 shadow-[0_4px_16px_rgba(12,131,31,0.4)] active:scale-95 transition-transform duration-75">
                <div className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 600, damping: 20 }}
                    className="text-white text-[11px] font-bold leading-none block"
                  >
                    {totalItems}
                  </motion.span>
                </div>
                <motion.span
                  key={totalPrice}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  className="text-white font-bold text-[13px]"
                >
                  ₹{totalPrice.toFixed(0)}
                </motion.span>
                <div className="w-px h-3 bg-white/30" />
                <span className="text-white/90 text-[12px] font-semibold">View Cart</span>
                <ChevronRight className="w-3.5 h-3.5 text-white/80" />
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {!isProductPage && !isCartPage && !isCheckoutFlow && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex items-stretch h-[56px] shadow-[0_-1px_4px_rgba(0,0,0,0.04)]">
          {(bottomNavConfig || [
            { href: "/", icon: "home", label: "Home" },
            { href: "/categories", icon: "grid", label: "Categories" },
            { href: "/cart", icon: "cart", label: "Cart" },
            { href: "/account", icon: "user", label: "Account" },
          ]).map((item: any) => {
            const Icon = NAV_ICON_MAP[item.icon] || Home;
            const active = location === item.href;
            const badge = item.href === "/cart" ? totalItems : 0;
            return (
              <Link key={item.label} href={item.href} className="flex-1 flex flex-col items-center justify-center gap-0.5 relative">
                <div className="relative">
                  <Icon className={`w-5 h-5 ${active ? "text-[#0c831f]" : "text-gray-400"}`} />
                  <AnimatePresence>
                    {badge ? (
                      <motion.span
                        key={badge}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        className="absolute -top-1.5 -right-2 bg-[#0c831f] text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                      >
                        {badge > 9 ? "9+" : badge}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
                <span className={`text-[10px] font-medium ${active ? "text-[#0c831f]" : "text-gray-400"}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
