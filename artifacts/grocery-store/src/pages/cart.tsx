import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Minus, Plus, Store, X, Tag, Trash2, ChevronRight, Percent } from "lucide-react";
import {
  useGetCart, useUpdateCartItem, useRemoveFromCart, useClearCart, getGetCartQueryKey,
} from "@workspace/api-client-react";
import { validateCoupon } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { LoginSheet } from "@/components/login-sheet";
import { saveCheckoutState, getCheckoutState } from "@/lib/checkout-store";

export function Cart() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: cart, isLoading } = useGetCart();
  const { user } = useAuth();
  const updateCartMut = useUpdateCartItem();
  const removeFromCartMut = useRemoveFromCart();
  const clearCartMut = useClearCart();

  const saved = getCheckoutState();
  const [couponCode, setCouponCode] = useState(saved.couponCode);
  const [couponApplied, setCouponApplied] = useState(saved.couponApplied);
  const [couponDiscount, setCouponDiscount] = useState(saved.couponDiscount);
  const [couponMessage, setCouponMessage] = useState(saved.couponMessage);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [showLoginSheet, setShowLoginSheet] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);

  useEffect(() => {
    const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${BASE}/api/settings/public`).then(r => r.json()).then(d => {
      const fee = d.store_config?.deliveryFee ?? 0;
      setDeliveryFee(Number(fee) || 0);
    }).catch(() => {});
  }, []);

  const invalidateCart = () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });

  const handleQty = (productId: string, qty: number) => {
    if (qty === 0) removeFromCartMut.mutate({ productId }, { onSuccess: invalidateCart });
    else updateCartMut.mutate({ productId, data: { quantity: qty } }, { onSuccess: invalidateCart });
    if (couponApplied) { setCouponApplied(false); setCouponDiscount(0); setCouponMessage(""); }
  };

  const isUpdating = updateCartMut.isPending || removeFromCartMut.isPending || clearCartMut.isPending;
  const subtotal = cart?.total ?? 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - couponDiscount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !cart) return;
    setCouponLoading(true); setCouponError("");
    try {
      const r = await validateCoupon(couponCode.trim(), cart.total ?? subtotal);
      setCouponApplied(true); setCouponDiscount(r.discount); setCouponMessage(r.message);
    } catch (err: any) { setCouponError(err.message || "Invalid coupon code"); }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setCouponCode(""); setCouponApplied(false); setCouponDiscount(0);
    setCouponMessage(""); setCouponError("");
  };

  const handleContinue = () => {
    if (!user) { setShowLoginSheet(true); return; }
    saveCheckoutState({
      couponCode: couponApplied ? couponCode : "",
      couponApplied,
      couponDiscount,
      couponMessage,
      deliveryFee,
      name: user.name || "",
      phone: user.phone || "",
    });
    setLocation("/checkout/address");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f2f3f5]">
        <div className="bg-white px-4 py-3.5 border-b border-gray-100">
          <Skeleton className="h-5 w-44" />
        </div>
        <div className="p-3 space-y-3">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm flex flex-col items-center max-w-sm w-full">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5">
            <Store className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-[20px] font-bold text-gray-900 mb-1.5">Your cart is empty</h2>
          <p className="text-[14px] text-gray-500 text-center mb-6">Add some items to get started!</p>
          <button onClick={() => setLocation("/")}
            className="w-full h-12 text-[15px] font-bold rounded-xl bg-[#0c831f] hover:bg-[#0a6f1a] text-white transition-colors">
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      {/* Header */}
      <div className="bg-white px-4 py-3.5 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
        <div>
          <h1 className="text-[16px] font-bold text-gray-900">
            Your items ({cart.itemCount} item{cart.itemCount !== 1 ? "s" : ""})
          </h1>
        </div>
        <Link href="/">
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </Link>
      </div>

      {/* Scrollable Content */}
      <div className="pb-[120px]">
        {/* Items card */}
        <div className="bg-white mx-3 mt-3 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between border-b border-gray-100">
            <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">
              {cart.itemCount} ITEM{cart.itemCount !== 1 ? "S" : ""}
            </span>
            <span className="text-[12px] font-bold text-gray-800">Total ₹{grandTotal.toFixed(0)}</span>
          </div>

          <AnimatePresence>
            {cart.items.map((item, idx) => {
              const price = (item as any).variantPrice ?? item.product.price;
              const origPrice = (item as any).variantOriginalPrice ?? item.product.originalPrice;
              const variantLabel = (item as any).variantLabel || item.product.quantity || item.product.unit;
              return (
                <motion.div key={item.productId} layout
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0, overflow: "hidden" }}>
                  <div className={`flex gap-3 px-4 pt-3.5 pb-2.5 ${idx < cart.items.length - 1 ? "" : ""}`}>
                    <div className="w-[72px] h-[72px] bg-[#f7f7f7] rounded-xl overflow-hidden shrink-0 border border-gray-100">
                      <img
                        src={item.product.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80"}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80"; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[14px] text-gray-900 leading-tight">{item.product.name}</p>
                      {variantLabel && <p className="text-[11px] text-gray-400 mt-0.5">{variantLabel}</p>}
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center border-2 border-[#0c831f] rounded-xl h-9 overflow-hidden">
                          <button
                            onClick={() => handleQty(item.productId, item.quantity - 1)}
                            disabled={isUpdating}
                            className="px-3 h-full text-[#0c831f] hover:bg-[#f0fdf4] transition-colors disabled:opacity-50">
                            {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                          </button>
                          <span className="w-7 text-center font-bold text-[14px] text-[#0c831f]">{item.quantity}</span>
                          <button
                            onClick={() => handleQty(item.productId, item.quantity + 1)}
                            disabled={isUpdating}
                            className="px-3 h-full text-[#0c831f] hover:bg-[#f0fdf4] transition-colors disabled:opacity-50">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[15px] text-gray-900">₹{(price * item.quantity).toFixed(0)}</p>
                          {origPrice > price && (
                            <p className="text-[10px] text-gray-400 line-through">₹{(origPrice * item.quantity).toFixed(0)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`px-4 pb-3 flex justify-center ${idx < cart.items.length - 1 ? "border-b border-gray-100" : ""}`}>
                    <button
                      onClick={() => removeFromCartMut.mutate({ productId: item.productId }, { onSuccess: invalidateCart })}
                      disabled={isUpdating}
                      className="text-[11px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-[0.15em] transition-colors disabled:opacity-40 py-0.5">
                      Remove
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Coupons & Offers */}
        <div className="bg-white mx-3 mt-3 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {couponApplied ? (
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#e6f4ea] flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4 text-[#0c831f]" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#0c831f]">"{couponCode}" applied!</p>
                  <p className="text-[11px] text-[#0c831f]">{couponMessage || `You saved ₹${couponDiscount}`}</p>
                </div>
              </div>
              <button onClick={removeCoupon} className="text-[12px] font-bold text-red-500 hover:underline shrink-0">Remove</button>
            </div>
          ) : showCouponInput ? (
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 bg-[#f7f7f7] rounded-xl p-3">
                <Tag className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  value={couponCode}
                  onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                  placeholder="Enter coupon code"
                  className="flex-1 bg-transparent text-[13px] font-medium focus:outline-none uppercase tracking-widest"
                  autoFocus
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="text-[12px] font-bold text-[#0c831f] disabled:opacity-40 shrink-0">
                  {couponLoading ? "..." : "Apply"}
                </button>
              </div>
              {couponError && <p className="text-[11px] text-red-500 font-medium mt-1.5 px-1">{couponError}</p>}
            </div>
          ) : (
            <button onClick={() => setShowCouponInput(true)} className="w-full flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#fff0ea] flex items-center justify-center shrink-0">
                  <Percent className="w-4 h-4 text-[#d44000]" />
                </div>
                <div className="text-left">
                  <p className="text-[14px] font-bold text-gray-900">Coupons and offers</p>
                  <p className="text-[11px] text-gray-500">Save more with coupon and offers</p>
                </div>
              </div>
              <span className="text-[13px] font-bold text-[#0c831f] flex items-center gap-0.5 shrink-0">
                Apply <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </button>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="bg-white mx-3 mt-3 rounded-2xl shadow-sm border border-gray-100 px-4 py-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-gray-700">Item total</span>
              <span className="text-[14px] font-medium text-gray-900">₹{subtotal.toFixed(0)}</span>
            </div>
            {couponApplied && couponDiscount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#0c831f]">Coupon discount</span>
                <span className="text-[14px] font-medium text-[#0c831f]">− ₹{couponDiscount.toFixed(0)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-gray-700">Delivery fee</span>
              {deliveryFee === 0 ? (
                <span className="text-[14px] font-medium flex items-center gap-1.5">
                  <span className="line-through text-gray-400 text-[12px]">₹0</span>
                  <span className="text-[#0c831f] font-bold">FREE</span>
                </span>
              ) : (
                <span className="text-[14px] font-medium text-gray-900">₹{deliveryFee}</span>
              )}
            </div>
          </div>
          <div className="h-px bg-gray-100 my-3" />
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-gray-900">Grand total</span>
            <span className="text-[15px] font-bold text-gray-900">₹{grandTotal.toFixed(0)}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Inclusive of all taxes</p>
          <div className="h-px bg-gray-100 my-3" />
          <p className="text-[13px] text-gray-600">
            Average delivery time: <span className="font-bold text-gray-800">3-5 days</span>
          </p>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <p className="text-[17px] font-bold text-gray-900">₹{grandTotal.toFixed(0)}</p>
            <p className="text-[11px] text-gray-400">Total amount</p>
          </div>
          <button
            onClick={handleContinue}
            className="flex-1 h-[52px] bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[16px] rounded-xl transition-colors shadow-sm">
            Continue
          </button>
        </div>
      </div>

      <LoginSheet
        show={showLoginSheet}
        onClose={() => setShowLoginSheet(false)}
        onSuccess={() => {
          setShowLoginSheet(false);
          saveCheckoutState({
            couponCode: couponApplied ? couponCode : "",
            couponApplied, couponDiscount, couponMessage, deliveryFee,
          });
          setLocation("/checkout/address");
        }}
      />
    </div>
  );
}
