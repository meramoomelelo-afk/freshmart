import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, X, Check, Banknote, Smartphone, CheckCircle2, Package, Clock3, MessageSquare, ChevronRight, Percent, Tag } from "lucide-react";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { apiRequest, validateCoupon } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { getCheckoutState, saveCheckoutState, clearCheckoutState } from "@/lib/checkout-store";
import { motion, AnimatePresence } from "framer-motion";

export function CheckoutPayment() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: cart } = useGetCart();
  const { user } = useAuth();
  const cs = getCheckoutState();

  const [paymentMethod, setPaymentMethod] = useState(cs.paymentMethod || "cash");
  const [upiId, setUpiId] = useState(cs.upiId || "");
  const [deliveryInstructions, setDeliveryInstructions] = useState(cs.deliveryInstructions || "");

  const [couponCode, setCouponCode] = useState(cs.couponCode);
  const [couponApplied, setCouponApplied] = useState(cs.couponApplied);
  const [couponDiscount, setCouponDiscount] = useState(cs.couponDiscount);
  const [couponMessage, setCouponMessage] = useState(cs.couponMessage);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);

  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<string | null>(null);

  const subtotal = cart?.total ?? 0;
  const deliveryFee = cs.deliveryFee ?? 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - couponDiscount);
  const itemCount = cart?.itemCount ?? 0;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !cart) return;
    setCouponLoading(true); setCouponError("");
    try {
      const r = await validateCoupon(couponCode.trim(), subtotal);
      setCouponApplied(true); setCouponDiscount(r.discount); setCouponMessage(r.message);
    } catch (err: any) { setCouponError(err.message || "Invalid coupon code"); }
    setCouponLoading(false);
  };

  const handlePlaceOrder = async () => {
    if (!cs.addressFull) { setPlaceError("Address is missing. Please go back and select an address."); return; }
    if (paymentMethod === "upi" && !upiId.trim()) { setPlaceError("Please enter your UPI ID."); return; }

    setPlacing(true); setPlaceError("");

    const slotLabel = cs.deliverySlotLabel || "";

    try {
      const data = await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify({
          name: cs.name || user?.name || "Customer",
          phone: cs.phone || user?.phone || "",
          address: cs.addressFull,
          city: cs.addressCity || "",
          landmark: cs.addressLandmark || "",
          pincode: cs.addressPincode || "",
          paymentMethod,
          upiId: paymentMethod === "upi" ? upiId.trim() : "",
          deliveryInstructions: deliveryInstructions.trim(),
          deliverySlot: slotLabel || undefined,
          couponCode: couponApplied ? couponCode : undefined,
        }),
      });

      setOrderId(data.orderId ?? data.id ?? "");
      setOrderCode(data.orderCode ?? data.code ?? "");
      clearCheckoutState();
      queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
    } catch (err: any) {
      setPlaceError(err.message || "Failed to place order. Please try again.");
    }
    setPlacing(false);
  };

  // ── Success Screen ──────────────────────────────────────────────────────
  if (orderId || orderCode) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          className="bg-white rounded-3xl p-7 shadow-lg max-w-sm w-full text-center"
        >
          <div className="w-20 h-20 bg-[#f0fdf4] rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-[#0c831f]" />
          </div>
          <h2 className="text-[22px] font-bold text-gray-900 mb-1.5">Order Placed! 🎉</h2>
          {orderCode && (
            <p className="text-[13px] text-gray-500 mb-1">
              Order <span className="font-bold text-gray-800">#{orderCode}</span>
            </p>
          )}
          <p className="text-[13px] text-gray-500 mb-6">
            We'll notify you once your order is confirmed.
          </p>

          <div className="bg-[#f2f3f5] rounded-2xl p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#e6f4ea] rounded-xl flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-[#0c831f]" />
              </div>
              <div className="text-left">
                <p className="text-[12px] font-bold text-gray-700">Payment</p>
                <p className="text-[11px] text-gray-500 capitalize">{paymentMethod === "cash" ? "Cash on Delivery" : paymentMethod.toUpperCase()}</p>
              </div>
            </div>
            {cs.deliverySlotLabel && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#e6f4ea] rounded-xl flex items-center justify-center shrink-0">
                  <Clock3 className="w-4 h-4 text-[#0c831f]" />
                </div>
                <div className="text-left">
                  <p className="text-[12px] font-bold text-gray-700">Delivery Slot</p>
                  <p className="text-[11px] text-gray-500">{cs.deliverySlotLabel}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            {orderId && (
              <button onClick={() => setLocation(`/order/${orderId}`)}
                className="w-full h-[50px] bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[15px] rounded-xl transition-colors flex items-center justify-center gap-2">
                <Package className="w-4 h-4" /> Track Order
              </button>
            )}
            <button onClick={() => setLocation("/")}
              className="w-full h-[50px] border-2 border-gray-200 hover:border-[#0c831f] hover:bg-[#f0fdf4] text-gray-700 hover:text-[#0c831f] font-bold text-[15px] rounded-xl transition-all">
              Continue Shopping
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const paymentOptions = [
    { value: "cash", icon: <Banknote className="w-5 h-5" />, label: "Cash on delivery", sub: "Pay in cash at the time of delivery" },
    { value: "upi", icon: <Smartphone className="w-5 h-5" />, label: "Pay via UPI", sub: "PhonePe, GPay, Paytm & more" },
  ];

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      {/* Header */}
      <div className="bg-white px-4 py-3.5 flex items-center gap-3 border-b border-gray-100 sticky top-0 z-10">
        <button onClick={() => setLocation("/checkout/slot")}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-[16px] font-bold text-gray-900">Your items ({itemCount} item{itemCount !== 1 ? "s" : ""})</h1>
        </div>
        <button onClick={() => setLocation("/")}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="bg-white px-4 py-2 border-b border-gray-100 flex items-center gap-2">
        {[{ label: "Cart" }, { label: "Address" }, { label: "Slot" }, { label: "Pay" }].map((step, i) => (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${i <= 3 ? "bg-[#0c831f]" : "bg-gray-200"}`}>
                {i < 3 ? (
                  <Check className="w-3 h-3 text-white" />
                ) : (
                  <span className={`text-[10px] font-bold ${i <= 3 ? "text-white" : "text-gray-400"}`}>{i + 1}</span>
                )}
              </div>
              <span className={`text-[11px] font-${i === 3 ? "bold" : "semibold"} ${i <= 3 ? "text-[#0c831f]" : "text-gray-400"}`}>{step.label}</span>
            </div>
            {i < 3 && <div className="h-px bg-[#0c831f] mx-2" style={{ width: "16px" }} />}
          </div>
        ))}
      </div>

      <div className="pb-[130px]">
        {/* Delivery address summary */}
        {cs.addressFull && (
          <div className="bg-white mx-3 mt-3 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-start gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#e6f4ea] flex items-center justify-center shrink-0 mt-0.5">
                <Package className="w-4 h-4 text-[#0c831f]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-[#0c831f] uppercase tracking-wide">{cs.addressLabel || "Delivering to"}</p>
                <p className="text-[13px] text-gray-800 font-medium leading-snug">{cs.addressFull}</p>
                {cs.addressCity && <p className="text-[11px] text-gray-400 mt-0.5">{cs.addressCity}{cs.addressPincode ? ` – ${cs.addressPincode}` : ""}</p>}
                {cs.deliverySlotLabel && (
                  <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    <Clock3 className="w-3 h-3" /> {cs.deliverySlotLabel}
                  </p>
                )}
              </div>
              <button onClick={() => setLocation("/checkout/address")} className="text-[11px] font-semibold text-[#0c831f] hover:underline shrink-0">
                Change
              </button>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="bg-white mx-3 mt-3 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 pt-3.5 pb-1">
            <p className="text-[13px] font-bold text-gray-700 uppercase tracking-wide">Payment Method</p>
          </div>
          {paymentOptions.map(opt => {
            const isSelected = paymentMethod === opt.value;
            return (
              <div key={opt.value}>
                <button
                  onClick={() => setPaymentMethod(opt.value)}
                  className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-all border-b border-gray-50 last:border-b-0 ${isSelected ? "bg-[#f0fdf4]" : "hover:bg-gray-50"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-[#0c831f]" : "bg-gray-100"}`}>
                    <span className={isSelected ? "text-white" : "text-gray-500"}>{opt.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-[14px] font-bold ${isSelected ? "text-[#0c831f]" : "text-gray-800"}`}>{opt.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{opt.sub}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? "border-[#0c831f] bg-[#0c831f]" : "border-gray-300"}`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>

                {/* UPI input */}
                <AnimatePresence>
                  {opt.value === "upi" && isSelected && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 pt-1">
                        <input value={upiId} onChange={e => setUpiId(e.target.value)}
                          placeholder="yourname@upi (e.g. name@paytm)"
                          className="w-full h-11 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all"
                          autoFocus />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Delivery Instructions */}
        <div className="bg-white mx-3 mt-3 rounded-2xl shadow-sm border border-gray-100 px-4 py-3.5">
          <label className="text-[13px] font-bold text-gray-700 flex items-center gap-2 mb-2.5">
            <MessageSquare className="w-4 h-4 text-gray-400" /> Delivery Instructions
            <span className="text-[11px] font-normal text-gray-400">(optional)</span>
          </label>
          <input value={deliveryInstructions} onChange={e => setDeliveryInstructions(e.target.value)}
            placeholder="Ring bell, leave at door, call before arriving..."
            className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all" />
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
              <button onClick={() => { setCouponCode(""); setCouponApplied(false); setCouponDiscount(0); setCouponMessage(""); }} className="text-[12px] font-bold text-red-500 hover:underline shrink-0">Remove</button>
            </div>
          ) : showCouponInput ? (
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 bg-[#f7f7f7] rounded-xl p-3">
                <Tag className="w-4 h-4 text-gray-400 shrink-0" />
                <input value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                  placeholder="Enter coupon code"
                  className="flex-1 bg-transparent text-[13px] font-medium focus:outline-none uppercase tracking-widest" autoFocus />
                <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()}
                  className="text-[12px] font-bold text-[#0c831f] disabled:opacity-40 shrink-0">{couponLoading ? "..." : "Apply"}</button>
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
                  <p className="text-[11px] text-gray-500">Apply a coupon to save more</p>
                </div>
              </div>
              <span className="text-[13px] font-bold text-[#0c831f] flex items-center gap-0.5 shrink-0">
                Apply <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </button>
          )}
        </div>

        {/* Price Summary */}
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
              <span className="text-[14px] font-bold text-[#0c831f]">{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
            </div>
          </div>
          <div className="h-px bg-gray-100 my-3" />
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-gray-900">Grand total</span>
            <span className="text-[15px] font-bold text-gray-900">₹{grandTotal.toFixed(0)}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Inclusive of all taxes</p>
        </div>

        {placeError && (
          <div className="mx-3 mt-3 p-3.5 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-[13px] text-red-600 font-medium">{placeError}</p>
          </div>
        )}
      </div>

      {/* Sticky Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <p className="text-[17px] font-bold text-gray-900">₹{grandTotal.toFixed(0)}</p>
            <p className="text-[11px] text-gray-400">Grand total</p>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="flex-1 h-[52px] bg-[#0c831f] hover:bg-[#0a6f1a] disabled:opacity-60 disabled:cursor-wait text-white font-bold text-[16px] rounded-xl transition-colors shadow-sm">
            {placing ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
