import { useLocation } from "wouter";
import { useGetProducts, useGetCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X, BadgePercent } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  vegetables: "#16a34a",
  fruits: "#dc2626",
  "dairy-eggs": "#2563eb",
  snacks: "#ea580c",
  beverages: "#0891b2",
  bakery: "#b45309",
  "meat-fish": "#be123c",
  "grains-pulses": "#a16207",
  "spices-masala": "#dc2626",
  "oil-ghee": "#65a30d",
  "dry-fruits": "#92400e",
  cleaning: "#7c3aed",
  "personal-care": "#ec4899",
  "tea-coffee": "#78350f",
  "frozen-foods": "#0284c7",
  "baby-care": "#ec4899",
};

function getCatColor(slug: string): string {
  return CATEGORY_COLORS[slug] || "#6b7280";
}

export function Products() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState(initialSearch);
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: categories } = useGetCategories();
  const categoryId = useMemo(() => {
    if (selectedCategory === "all") return undefined;
    return categories?.find(c => c.slug === selectedCategory)?.id;
  }, [selectedCategory, categories]);

  const { data: products, isLoading } = useGetProducts({
    search: search || undefined,
    categoryId,
    ...(onSaleOnly ? { onSale: "true" } : {}),
  });

  const sortedProducts = useMemo(() => {
    if (!products) return [];
    const arr = [...products];
    switch (sortBy) {
      case "price-low": return arr.sort((a, b) => a.price - b.price);
      case "price-high": return arr.sort((a, b) => b.price - a.price);
      case "discount": return arr.sort((a, b) => b.discount - a.discount);
      default: return arr;
    }
  }, [products, sortBy]);

  const selectedCatName = selectedCategory === "all"
    ? "All Products"
    : categories?.find(c => c.slug === selectedCategory)?.name ?? "Products";

  return (
    <div className="max-w-[1400px] mx-auto md:px-6 py-4 flex gap-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <aside className="shrink-0 w-[220px] hidden md:block">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-[100px] shadow-lg shadow-black/5">
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#0c831f]/5 to-transparent">
            <h3 className="text-[12px] font-extrabold text-gray-500 uppercase tracking-widest">Categories</h3>
          </div>
          <ul className="py-1">
            <li>
              <button
                onClick={() => setSelectedCategory("all")}
                className={`w-full text-left px-4 py-2.5 text-[13px] flex items-center justify-between transition-all ${
                  selectedCategory === "all"
                    ? "bg-[#e6f4ea] text-[#0c831f] font-bold border-r-[3px] border-[#0c831f]"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>All Products</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${selectedCategory === "all" ? "bg-[#0c831f] text-white" : "bg-gray-100 text-gray-500"}`}>
                  {products?.length ?? "..."}
                </span>
              </button>
            </li>
            {categories?.map(cat => {
              const color = getCatColor(cat.slug);
              return (
                <li key={cat.id}>
                  <button
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-all ${
                      selectedCategory === cat.slug
                        ? "font-bold border-r-[3px]"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    style={selectedCategory === cat.slug ? { backgroundColor: `${color}10`, color, borderColor: color } : undefined}
                    data-testid={`filter-category-${cat.id}`}
                  >
                    <span className="text-[15px] w-5 text-center shrink-0">{cat.icon}</span>
                    <span className="flex-1 text-left truncate">{cat.name}</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={selectedCategory === cat.slug ? { backgroundColor: color, color: "white" } : { backgroundColor: "#f3f4f6", color: "#6b7280" }}
                    >
                      {cat.productCount}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      <div className="flex-1 min-w-0 px-3 md:px-0">
        <div className="hidden md:flex bg-white rounded-xl border border-gray-100 px-4 py-3 mb-4 items-center gap-3 shadow-sm">
          <div className="flex-1 min-w-0">
            <h1 className="text-[16px] font-extrabold text-gray-900 truncate">{selectedCatName}</h1>
            <p className="text-[11px] text-gray-500 font-medium">{sortedProducts.length} items</p>
          </div>

          <button
            onClick={() => setOnSaleOnly(!onSaleOnly)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold border-2 transition-all shrink-0 ${
              onSaleOnly
                ? "bg-[#536de6] text-white border-[#536de6]"
                : "border-gray-200 text-gray-600 bg-white hover:border-[#536de6] hover:text-[#536de6]"
            }`}
          >
            <BadgePercent className="w-3.5 h-3.5" />
            On Sale
          </button>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-9 text-[12px] bg-gray-50 border-gray-200 shrink-0 font-semibold" data-testid="select-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="discount">Biggest Discount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:hidden mb-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-[16px] font-extrabold text-gray-900 truncate">{selectedCatName}</h1>
              <p className="text-[11px] text-gray-500 font-medium">{sortedProducts.length} items</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-1.5 text-[12px] font-bold text-gray-700 bg-white border border-gray-200 rounded-lg px-3 h-9 shrink-0 hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter
            </button>
            <button
              onClick={() => setOnSaleOnly(!onSaleOnly)}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-[12px] font-bold border transition-all shrink-0 ${
                onSaleOnly
                  ? "bg-[#536de6] text-white border-[#536de6]"
                  : "border-gray-200 text-gray-600 bg-white hover:border-[#536de6] hover:text-[#536de6]"
              }`}
            >
              <BadgePercent className="w-3.5 h-3.5" />
              On Sale
            </button>
            <div className="flex-1" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-auto min-w-[120px] h-9 text-[12px] bg-white border-gray-200 shrink-0 font-semibold" data-testid="select-sort-mobile">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price-low">Price: Low → High</SelectItem>
                <SelectItem value="price-high">Price: High → Low</SelectItem>
                <SelectItem value="discount">Biggest Discount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {sidebarOpen && (
          <div className="md:hidden bg-white rounded-xl border border-gray-100 p-3 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Categories</p>
              <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setSelectedCategory("all"); setSidebarOpen(false); }}
                className={`px-3 py-1.5 rounded-full text-[12px] font-bold border-2 transition-all ${selectedCategory === "all" ? "bg-[#0c831f] text-white border-[#0c831f]" : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"}`}
              >
                All
              </button>
              {categories?.map(cat => {
                const color = getCatColor(cat.slug);
                const isActive = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.slug); setSidebarOpen(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border-2 transition-all"
                    style={isActive ? { backgroundColor: color, color: "white", borderColor: color } : { borderColor: `${color}30`, color }}
                  >
                    {cat.icon} {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array(12).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-[220px] rounded-xl" />
            ))}
          </div>
        ) : sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {sortedProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl py-16 flex flex-col items-center text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-[16px] font-extrabold text-gray-800 mb-1">No products found</h3>
            <p className="text-[13px] text-gray-500 max-w-xs">
              Try a different category or search term.
            </p>
            <button
              onClick={() => { setSearch(""); setSelectedCategory("all"); }}
              className="mt-4 text-[#0c831f] text-[13px] font-bold hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
