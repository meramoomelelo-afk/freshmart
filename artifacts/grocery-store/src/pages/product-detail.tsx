import { useParams, Link, useLocation } from "wouter";
import { useGetProduct, useGetProducts, useGetCart } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { optimisticSetQty, rollbackCart, invalidateCart } from "@/lib/cart-optimistic";
import { ChevronRight, Star, ChevronDown, ChevronUp, ChevronLeft, Leaf, Heart, Search, Share2, ShoppingCart } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlist } from "@/lib/wishlist";
import { useStoreConfig } from "@/lib/store-config";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function readCsrf(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const csrf = readCsrf();
  if (csrf) h["x-csrf-token"] = csrf;
  return h;
}

export function ProductDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const productId = params?.id ?? "";
  const { config: storeConfig } = useStoreConfig();
  const storeName = storeConfig.storeName || "Store";

  const [showDetails, setShowDetails] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  useEffect(() => {
    setSelectedVariant(null);
  }, [productId]);

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

  const queryClient = useQueryClient();

  const { data: product, isLoading } = useGetProduct(productId);
  const { data: similar } = useGetProducts(
    { categoryId: product?.categoryId },
    { query: { enabled: !!product?.categoryId } }
  );
  const { data: cart } = useGetCart();

  const { toggle: toggleWishlist, isWished } = useWishlist();

  const activeVariant = selectedVariant ?? (product?.variants?.[0] ?? null);
  const hasVariants = (product?.variants?.length ?? 0) > 0;

  // Match cart item by (productId + activeVariant) — each variant is a separate row
  const cartItem = cart?.items.find((item) => {
    if (String(item.productId) !== String(productId)) return false;
    if (hasVariants) {
      return ((item as any).variantLabel ?? null) === (activeVariant ?? null);
    }
    return true;
  });
  const qty = cartItem?.quantity ?? 0;
  const cartItemId = (cartItem as any)?.id as string | undefined;

  const cartCount = cart?.itemCount ?? 0;
  const cartTotal = cart?.total ?? 0;

  const runMutation = useCallback(
    async (newQty: number) => {
      if (!product) return;
      const vLabel = hasVariants && activeVariant ? activeVariant : undefined;
      const ctx = optimisticSetQty(queryClient, product, newQty, vLabel);
      const onError = () => rollbackCart(queryClient, ctx);
      const onSettled = () => invalidateCart(queryClient);

      try {
        if (newQty <= 0) {
          if (cartItemId) {
            const r = await fetch(`${BASE}/api/cart/item/${cartItemId}`, {
              method: "DELETE",
              headers: authHeaders(),
              credentials: "include",
            });
            if (!r.ok) throw new Error("Cart error");
          }
        } else if (qty === 0) {
          const body: Record<string, unknown> = { productId, quantity: newQty };
          if (vLabel) body.variantLabel = vLabel;
          const r = await fetch(`${BASE}/api/cart`, {
            method: "POST",
            headers: authHeaders(),
            credentials: "include",
            body: JSON.stringify(body),
          });
          if (!r.ok) throw new Error("Cart error");
        } else {
          if (cartItemId) {
            const r = await fetch(`${BASE}/api/cart/item/${cartItemId}`, {
              method: "PUT",
              headers: authHeaders(),
              credentials: "include",
              body: JSON.stringify({ quantity: newQty }),
            });
            if (!r.ok) throw new Error("Cart error");
          }
        }
        onSettled();
      } catch {
        onError();
      }
    },
    [queryClient, product, productId, qty, hasVariants, activeVariant, cartItemId]
  );

  const onAdd = () => { void runMutation(qty + 1); };
  const onSub = () => { if (qty > 0) void runMutation(qty - 1); };

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="h-12 flex items-center px-4">
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        <Skeleton className="w-full h-72" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white min-h-screen p-8 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-[18px] font-bold text-gray-800 mb-2">Product not found</h2>
        <Link href="/products" className="text-[#0c831f] font-semibold text-[14px] hover:underline">
          Browse all products →
        </Link>
      </div>
    );
  }

  const similarProducts = similar?.filter(p => p.id !== productId).slice(0, 10) ?? [];

  const baseGrams = product ? parseWeightToGrams(product.quantity) : null;
  const variantGrams = activeVariant ? parseWeightToGrams(activeVariant) : null;
  const variantPriceMap = ((product as any)?.variantPrices as Record<string, number>) || {};
  const explicitPrice = activeVariant != null && variantPriceMap[activeVariant] !== undefined ? variantPriceMap[activeVariant] : null;
  const displayPrice = explicitPrice !== null
    ? explicitPrice
    : (baseGrams && variantGrams && product)
      ? Math.round((product.price * variantGrams) / baseGrams)
      : product?.price ?? 0;
  const displayOriginalPrice = (baseGrams && variantGrams && product && explicitPrice === null)
    ? Math.round((product.originalPrice * variantGrams) / baseGrams)
    : product?.originalPrice ?? 0;

  return (
    <div className="bg-white min-h-screen pb-[180px] md:pb-20">

      <div className="md:hidden flex items-center justify-between px-3 py-2.5 bg-white sticky top-0 z-30 border-b border-gray-50">
        <button
          onClick={() => history.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => toggleWishlist(productId)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
            <motion.div
              key={isWished(productId) ? "wished" : "unwished"}
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              <Heart className={`w-5 h-5 ${isWished(productId) ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
            </motion.div>
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
            <Search className="w-5 h-5 text-gray-500" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
            <Share2 className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="hidden md:block max-w-3xl mx-auto pt-4 px-6">
        <button
          onClick={() => history.back()}
          className="flex items-center gap-1 text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="w-full relative overflow-hidden bg-white" style={{ aspectRatio: "1/1", maxHeight: "50vh" }}>
          {/* Blurred background layer */}
          <img
            src={product.imageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover scale-150 blur-3xl opacity-20 select-none pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-white/70" />
          {/* Product image */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="absolute inset-0 m-auto w-full h-full object-contain p-10 drop-shadow-md"
            style={{ objectPosition: "center" }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80";
            }}
          />
          {product.discount > 0 && (
            <div className="absolute top-3 right-3 bg-[#536de6] text-white text-[12px] font-bold px-2.5 py-1 rounded-lg z-10">
              {product.discount}% OFF
            </div>
          )}
        </div>

        <div className="px-4 pt-3 pb-2.5 flex items-center gap-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#0c831f]" />
            <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">{product.deliveryTime}</span>
          </div>
          {product.rating > 0 && (
            <>
              <div className="w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                ))}
                <span className="text-[12px] text-gray-500 ml-1">
                  ({product.reviewCount >= 1000 ? `${(product.reviewCount / 1000).toFixed(product.reviewCount >= 10000 ? 0 : 1)}k` : product.reviewCount})
                </span>
              </div>
            </>
          )}
          {product.isOrganic && (
            <>
              <div className="w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-green-600" />
                <span className="text-[12px] font-bold text-green-700">Organic</span>
              </div>
            </>
          )}
        </div>

        <div className="px-4 py-4 border-b border-gray-100">
          <h1 className="text-[18px] font-bold text-gray-900 leading-snug">{product.name}</h1>
          <p className="text-[13px] text-gray-500 mt-1">{product.quantity}</p>
          <div className="flex items-baseline gap-2 mt-2.5">
            <span className="text-[18px] font-extrabold text-gray-900">₹{displayPrice}</span>
            {displayOriginalPrice > displayPrice && displayOriginalPrice > 0 && (
              <span className="text-[14px] text-gray-400 line-through">₹{displayOriginalPrice}</span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Inclusive of all taxes</p>

          {product.variants && product.variants.length > 0 && (
            <div className="mt-3.5">
              <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Select variant</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: string) => {
                  const isSelected = selectedVariant === v || (!selectedVariant && v === product.variants![0]);
                  const variantInCart = cart?.items.some(
                    (item) =>
                      String(item.productId) === String(productId) &&
                      ((item as any).variantLabel ?? null) === v
                  );
                  return (
                    <button
                      key={v}
                      onClick={() => setSelectedVariant(v)}
                      className={`relative px-3.5 py-1.5 rounded-lg text-[13px] font-semibold border transition-all ${
                        isSelected
                          ? "border-[#0c831f] bg-[#e6f4ea] text-[#0c831f]"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {v}
                      {variantInCart && !isSelected && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#0c831f] rounded-full border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="border-b border-gray-100">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left"
          >
            <span className="text-[14px] font-semibold text-[#0c831f]">View product details</span>
            {showDetails ? <ChevronUp className="w-4 h-4 text-[#0c831f]" /> : <ChevronDown className="w-4 h-4 text-[#0c831f]" />}
          </button>
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2 text-[14px] text-gray-600">
                  {product.description && <p className="leading-relaxed">{product.description}</p>}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-2">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Category</span>
                      <p className="font-medium text-gray-800 text-[13px] mt-0.5">{product.categoryName}</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Net Weight</span>
                      <p className="font-medium text-gray-800 text-[13px] mt-0.5">{product.quantity}</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Unit</span>
                      <p className="font-medium text-gray-800 text-[13px] mt-0.5">{product.unit}</p>
                    </div>
                    {product.tags && product.tags.length > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tags</span>
                        <p className="font-medium text-gray-800 text-[13px] mt-0.5">{product.tags.join(", ")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-4 py-3.5 border-b border-gray-100 bg-[#fafafa]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#e6f4ea] flex items-center justify-center text-lg shrink-0 border border-[#c3e6cb]">
                {product.categoryName?.[0] ?? "F"}
              </div>
              <div>
                <p className="text-[14px] font-bold text-gray-900">{storeName} Essentials</p>
                <p className="text-[12px] text-gray-500">Explore all products</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {similarProducts.length > 0 && (
          <div className="px-4 py-5">
            <h2 className="text-[16px] font-bold text-gray-900 mb-3">Similar products</h2>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {similarProducts.map((p, i) => (
                <div key={p.id} className="shrink-0 w-[140px]">
                  <ProductCard product={p} index={i} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {cartCount > 0 && (
        <div className="fixed bottom-[80px] left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-md z-40">
          <Link href="/cart">
            <div className="bg-[#0c831f] rounded-xl px-4 py-2.5 flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-[13px]">View cart</span>
                <span className="text-white/60">·</span>
                <span className="text-white/80 text-[12px]">{cartCount} item{cartCount > 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-1 text-white">
                <span className="font-bold text-[14px]">₹{cartTotal.toFixed(0)}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-[12px] text-gray-500">{activeVariant || product.quantity}</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <p className="text-[17px] font-extrabold text-gray-900">₹{displayPrice}</p>
              {displayOriginalPrice > displayPrice && displayOriginalPrice > 0 && (
                <p className="text-[12px] text-gray-400 line-through">₹{displayOriginalPrice}</p>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">Inclusive of all taxes</p>
          </div>

          {!product.inStock ? (
            <div className="bg-gray-100 text-gray-400 text-[14px] font-bold px-6 py-3 rounded-xl">
              Out of stock
            </div>
          ) : qty > 0 ? (
            <div className="flex items-center bg-[#0c831f] rounded-xl h-[44px] overflow-hidden shadow-md min-w-[130px]">
              <button
                onClick={onSub}
                className="w-11 h-full flex items-center justify-center text-white hover:bg-[#0a6f1a] transition-colors"
                data-testid={`button-decrease-detail-${productId}`}
              >
                <span className="text-[20px] font-light">−</span>
              </button>
              <span className="flex-1 text-center text-[16px] font-bold text-white tabular-nums" data-testid={`text-quantity-detail-${productId}`}>
                {qty}
              </span>
              <button
                onClick={onAdd}
                className="w-11 h-full flex items-center justify-center text-white hover:bg-[#0a6f1a] transition-colors"
                data-testid={`button-increase-detail-${productId}`}
              >
                <span className="text-[20px] font-light">+</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onAdd}
              className="bg-[#0c831f] hover:bg-[#0a6f1a] text-white text-[15px] font-bold px-8 h-[44px] rounded-xl shadow-md active:scale-95 transition-all min-w-[130px]"
              data-testid={`button-add-detail-${productId}`}
            >
              Add to cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
