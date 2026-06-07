import { useCallback, useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { Link } from "wouter";
import { useGetCart } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { Product } from "@workspace/api-client-react";
import { optimisticSetQty, rollbackCart, invalidateCart } from "@/lib/cart-optimistic";

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

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const queryClient = useQueryClient();
  const { data: cart } = useGetCart();

  const dbVariants: string[] = (product as any).variants ?? [];
  const hasVariants = dbVariants.length > 0;
  const [selectedVariant, setSelectedVariant] = useState<string>(dbVariants[0] ?? "");

  useEffect(() => {
    if (dbVariants.length > 0 && !dbVariants.includes(selectedVariant)) {
      setSelectedVariant(dbVariants[0]);
    }
  }, [product.id]);

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

  const baseGrams = hasVariants ? parseWeightToGrams(product.quantity) : null;
  const variantGrams = hasVariants && selectedVariant ? parseWeightToGrams(selectedVariant) : null;
  const variantPriceMap = ((product as any).variantPrices as Record<string, number>) || {};
  const explicitPrice = selectedVariant != null && variantPriceMap[selectedVariant] !== undefined ? variantPriceMap[selectedVariant] : null;
  const displayPrice = explicitPrice !== null
    ? explicitPrice
    : (baseGrams && variantGrams && baseGrams > 0)
      ? Math.round((product.price * variantGrams) / baseGrams)
      : product.price;
  const displayOriginalPrice = (baseGrams && variantGrams && baseGrams > 0 && explicitPrice === null)
    ? Math.round((product.originalPrice * variantGrams) / baseGrams)
    : product.originalPrice;

  // Match cart item by (productId + selectedVariant) — each variant is a separate cart row
  const cartItem = cart?.items.find((item) => {
    if (String(item.productId) !== String(product.id)) return false;
    if (hasVariants) {
      return ((item as any).variantLabel ?? null) === (selectedVariant || null);
    }
    return true;
  });
  const qty = cartItem?.quantity ?? 0;
  const cartItemId = (cartItem as any)?.id as string | undefined;

  const mutate = useCallback(
    async (newQty: number) => {
      const vLabel = hasVariants && selectedVariant ? selectedVariant : undefined;
      const vPrice = vLabel !== undefined ? displayPrice : undefined;
      const ctx = optimisticSetQty(queryClient, product, newQty, vLabel, vPrice);
      const onError = () => rollbackCart(queryClient, ctx);
      const onSettled = () => invalidateCart(queryClient);

      try {
        if (newQty <= 0) {
          // Remove this specific variant from cart
          if (cartItemId) {
            const r = await fetch(`${BASE}/api/cart/item/${cartItemId}`, {
              method: "DELETE",
              headers: authHeaders(),
              credentials: "include",
            });
            if (!r.ok) throw new Error("Cart error");
          }
        } else if (qty === 0) {
          // New variant — always POST to create a separate cart row
          const body: Record<string, unknown> = { productId: product.id, quantity: newQty };
          if (vLabel) body.variantLabel = vLabel;
          const r = await fetch(`${BASE}/api/cart`, {
            method: "POST",
            headers: authHeaders(),
            credentials: "include",
            body: JSON.stringify(body),
          });
          if (!r.ok) throw new Error("Cart error");
        } else {
          // Update quantity for this specific variant row
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
    [queryClient, product, qty, hasVariants, selectedVariant, displayPrice, cartItemId]
  );

  const onAdd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    mutate(qty + 1);
  };

  const onSub = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (qty > 0) mutate(qty - 1);
  };

  return (
    <div data-testid={`card-product-${product.id}`} className="h-full">
      <Link
        href={`/product/${product.id}`}
        className="block bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200 h-full flex flex-col overflow-hidden"
      >
        <div className="relative bg-gray-50 rounded-t-xl overflow-hidden" style={{ aspectRatio: "1/1" }}>
          <img
            src={product.imageUrl?.replace("/uploads/p/l/", "/uploads/p/m/") || product.imageUrl}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-contain p-2"
            loading={index < 10 ? "eager" : "lazy"}
            decoding="async"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (!img.dataset.fallback) {
                img.dataset.fallback = "1";
                img.src = product.imageUrl;
              }
            }}
          />
          {product.discount > 0 && (
            <div className="absolute top-1.5 left-1.5">
              <span className="bg-[#0c831f] text-white text-[9px] font-extrabold px-1.5 py-[3px] rounded-md leading-none">
                {product.discount}% OFF
              </span>
            </div>
          )}
          {product.isOrganic && (
            <div className="absolute top-1.5 right-1.5">
              <span className="bg-[#065f46] text-white text-[8px] font-bold px-1.5 py-[3px] rounded-md leading-none tracking-wide">
                ORGANIC
              </span>
            </div>
          )}
        </div>

        <div className="px-2 pt-2 pb-2 flex flex-col flex-1">
          <p className="text-[12px] font-semibold text-gray-900 leading-snug line-clamp-2 mb-1">
            {product.name}
          </p>

          {hasVariants ? (
            <div onClick={(e) => e.preventDefault()} className="flex items-center gap-1 flex-wrap mb-1">
              {dbVariants.map((v) => {
                // Show in-cart indicator for each variant that's in cart
                const variantInCart = cart?.items.some(
                  (item) =>
                    String(item.productId) === String(product.id) &&
                    ((item as any).variantLabel ?? null) === v
                );
                return (
                  <button
                    key={v}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedVariant(v);
                    }}
                    style={{ touchAction: "manipulation" }}
                    className={`text-[9px] font-bold px-1.5 py-[2px] rounded border transition-colors select-none relative ${
                      selectedVariant === v
                        ? "bg-[#0c831f] text-white border-[#0c831f]"
                        : "bg-white text-gray-500 border-gray-200"
                    }`}
                  >
                    {v}
                    {variantInCart && selectedVariant !== v && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#0c831f] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 mb-1">{product.quantity}</p>
          )}

          <div className="mt-auto flex items-center justify-between gap-1">
            <div className="min-w-0 flex-1">
              <span className="text-[14px] font-bold text-gray-900">₹{displayPrice}</span>
              {displayOriginalPrice > displayPrice && displayOriginalPrice > 0 && (
                <span className="text-[10px] text-gray-400 line-through ml-1">₹{displayOriginalPrice}</span>
              )}
            </div>

            <div onClick={(e) => e.preventDefault()} className="shrink-0">
              {!product.inStock ? (
                <span className="text-[9px] text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-lg">
                  Sold out
                </span>
              ) : qty > 0 ? (
                <div className="flex items-center bg-[#0c831f] rounded-lg h-[28px] overflow-hidden shadow-sm">
                  <button
                    onClick={onSub}
                    style={{ touchAction: "manipulation" }}
                    className="w-[26px] h-full flex items-center justify-center text-white active:bg-[#085a16] select-none"
                    data-testid={`button-decrease-${product.id}`}
                  >
                    <Minus className="w-3 h-3 pointer-events-none" />
                  </button>
                  <span className="w-[22px] text-center text-[12px] font-bold text-white select-none tabular-nums" data-testid={`text-quantity-${product.id}`}>
                    {qty}
                  </span>
                  <button
                    onClick={onAdd}
                    style={{ touchAction: "manipulation" }}
                    className="w-[26px] h-full flex items-center justify-center text-white active:bg-[#085a16] select-none"
                    data-testid={`button-increase-${product.id}`}
                  >
                    <Plus className="w-3 h-3 pointer-events-none" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onAdd}
                  style={{ touchAction: "manipulation" }}
                  className="w-[28px] h-[28px] bg-white border-2 border-[#0c831f] text-[#0c831f] rounded-lg flex items-center justify-center active:scale-90 transition-transform duration-75 shadow-sm select-none"
                  data-testid={`button-add-${product.id}`}
                >
                  <Plus className="w-4 h-4 pointer-events-none" />
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
