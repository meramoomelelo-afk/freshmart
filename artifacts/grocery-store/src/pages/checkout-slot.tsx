import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, X, Check, Clock, Zap } from "lucide-react";
import { useGetCart } from "@workspace/api-client-react";
import { getCheckoutState, saveCheckoutState } from "@/lib/checkout-store";
import { motion } from "framer-motion";

interface DeliverySlot {
  label: string;
  sub: string;
  icon: string;
  days?: string[];
}

const DEFAULT_SLOTS: DeliverySlot[] = [
  { label: "Morning", sub: "8 AM – 11 AM", icon: "🌅", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
  { label: "Afternoon", sub: "12 PM – 3 PM", icon: "☀️", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
  { label: "Evening", sub: "5 PM – 8 PM", icon: "🌆", days: ["Mon","Tue","Wed","Thu","Fri","Sat"] },
];

const SLOT_COLORS = [
  { from: "from-amber-50", to: "to-orange-100", border: "border-amber-200", selectedBorder: "border-[#0c831f]", icon: "text-amber-500", badge: "bg-amber-100 text-amber-700" },
  { from: "from-yellow-50", to: "to-amber-100", border: "border-yellow-200", selectedBorder: "border-[#0c831f]", icon: "text-yellow-500", badge: "bg-yellow-100 text-yellow-700" },
  { from: "from-indigo-50", to: "to-purple-100", border: "border-indigo-200", selectedBorder: "border-[#0c831f]", icon: "text-indigo-500", badge: "bg-indigo-100 text-indigo-700" },
];

const WEEK_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function buildDayOptions() {
  const now = new Date();
  return [0, 1, 2].map(offset => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
    const dateLabel = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const label = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : dayName;
    return { label, dateLabel, dayAbbr: WEEK_DAYS[d.getDay()], date: d };
  });
}

function isTodayCutoffPassed(todayCutoff: number): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= todayCutoff;
}

function isSlotPassed(slot: DeliverySlot, isToday: boolean, todayCutoff: number): boolean {
  if (!isToday) return false;
  const now = new Date();
  const hour = now.getHours();
  const sub = slot.sub.toLowerCase();
  if (sub.includes("8 am") || sub.includes("8am")) return hour >= 11;
  if (sub.includes("12 pm") || sub.includes("12pm")) return hour >= 15;
  if (sub.includes("5 pm") || sub.includes("5pm")) return hour >= 20;
  return hour >= todayCutoff;
}

export function CheckoutSlot() {
  const [, setLocation] = useLocation();
  const { data: cart } = useGetCart();
  const cs = getCheckoutState();

  const [slots, setSlots] = useState<DeliverySlot[]>(DEFAULT_SLOTS);
  const [todayCutoff, setTodayCutoff] = useState(14);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);
  const [dayOptions] = useState(buildDayOptions);

  useEffect(() => {
    const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${BASE}/api/settings/public`).then(r => r.json()).then(d => {
      if (d.delivery_slots && Array.isArray(d.delivery_slots) && d.delivery_slots.length > 0) {
        setSlots(d.delivery_slots);
      }
      if (d.store_config?.todayCutoff !== undefined) setTodayCutoff(Number(d.store_config.todayCutoff) || 14);
    }).catch(() => {});
  }, []);

  const dayOption = dayOptions[selectedDay];
  const isToday = selectedDay === 0;
  const todayBlocked = isToday && isTodayCutoffPassed(todayCutoff);

  const availableSlots = slots.filter(slot => {
    const days = slot.days ?? WEEK_DAYS;
    return days.includes(dayOption.dayAbbr) && !isSlotPassed(slot, isToday, todayCutoff);
  });

  const subtotal = cart?.total ?? 0;
  const deliveryFee = cs.deliveryFee ?? 0;
  const couponDiscount = cs.couponDiscount ?? 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - couponDiscount);
  const itemCount = cart?.itemCount ?? 0;

  const handleContinue = () => {
    const slot = selectedSlotIdx !== null ? availableSlots[selectedSlotIdx] : null;
    const slotLabel = slot ? `${slot.label} (${slot.sub}) – ${dayOption.label}, ${dayOption.dateLabel}` : "";
    saveCheckoutState({
      selectedDay,
      selectedSlot: selectedSlotIdx ?? 0,
      deliverySlotLabel: slotLabel,
    });
    setLocation("/checkout/payment");
  };

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      {/* Header */}
      <div className="bg-white px-4 py-3.5 flex items-center gap-3 border-b border-gray-100 sticky top-0 z-10">
        <button onClick={() => setLocation("/checkout/address")}
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
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${i < 3 ? "bg-[#0c831f]" : "bg-gray-200"}`}>
                {i < 2 ? (
                  <Check className="w-3 h-3 text-white" />
                ) : (
                  <span className={`text-[10px] font-bold ${i < 3 ? "text-white" : "text-gray-400"}`}>{i + 1}</span>
                )}
              </div>
              <span className={`text-[11px] font-${i === 2 ? "bold" : "semibold"} ${i <= 2 ? "text-[#0c831f]" : "text-gray-400"}`}>{step.label}</span>
            </div>
            {i < 3 && <div className={`flex-1 h-px mx-2 ${i < 2 ? "bg-[#0c831f]" : "bg-gray-200"}`} style={{ width: "16px" }} />}
          </div>
        ))}
      </div>

      <div className="pb-[120px] px-4">
        {/* Delivery Schedule Banner */}
        <div className="mt-4 mb-5 text-center">
          <div className="inline-flex items-center gap-2 bg-[#e6f4ea] px-4 py-2 rounded-full">
            <Clock className="w-4 h-4 text-[#0c831f]" />
            <span className="text-[13px] font-bold text-[#0c831f]">Choose your delivery schedule</span>
          </div>
        </div>

        {/* Day Selector */}
        <div className="mb-5">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">Select Delivery Date</p>
          <div className="grid grid-cols-3 gap-2">
            {dayOptions.map((day, i) => {
              const isBlocked = i === 0 && todayBlocked;
              const isSelected = selectedDay === i && !isBlocked;
              return (
                <button key={i}
                  onClick={() => { if (!isBlocked) { setSelectedDay(i); setSelectedSlotIdx(null); } }}
                  disabled={isBlocked}
                  className={`relative py-3 px-2 rounded-2xl border-2 text-center transition-all ${
                    isSelected
                      ? "border-[#0c831f] bg-[#0c831f] shadow-lg shadow-[#0c831f]/20"
                      : isBlocked
                        ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                        : "border-gray-200 bg-white hover:border-[#0c831f]/40 hover:bg-[#f0fdf4]"
                  }`}>
                  {isBlocked && (
                    <span className="absolute top-1.5 right-1.5 text-[8px] bg-red-100 text-red-500 font-bold px-1.5 py-0.5 rounded-full">Closed</span>
                  )}
                  <p className={`text-[14px] font-bold ${isSelected ? "text-white" : "text-gray-900"}`}>{day.label}</p>
                  <p className={`text-[11px] mt-0.5 ${isSelected ? "text-white/80" : "text-gray-400"}`}>{day.dateLabel}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slot Cards */}
        <div className="mb-5">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">Select Time Slot</p>
          {availableSlots.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
              <div className="text-4xl mb-3">😴</div>
              <p className="text-[15px] font-bold text-gray-700 mb-1">No slots available</p>
              <p className="text-[13px] text-gray-400">Try selecting a different day</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {availableSlots.map((slot, i) => {
                const isSelected = selectedSlotIdx === i;
                const colors = SLOT_COLORS[i % SLOT_COLORS.length];
                const isFirst = i === 0;
                return (
                  <motion.button key={`${dayOption.label}-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => setSelectedSlotIdx(i)}
                    className={`relative w-full overflow-hidden rounded-2xl border-2 transition-all text-left ${
                      isSelected
                        ? `${colors.selectedBorder} shadow-lg shadow-[#0c831f]/15`
                        : `${colors.border} shadow-sm hover:shadow-md hover:${colors.selectedBorder}`
                    }`}>
                    <div className={`bg-gradient-to-br ${colors.from} ${colors.to} p-4`}>
                      {isFirst && (
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-[#0c831f] text-white text-[9px] font-bold px-2 py-1 rounded-full">
                          <Zap className="w-2.5 h-2.5" /> FASTEST
                        </span>
                      )}
                      {isSelected && (
                        <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-[#0c831f] flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="text-[44px] leading-none">{slot.icon}</div>
                        <div>
                          <p className="text-[18px] font-bold text-gray-900">{slot.label}</p>
                          <p className="text-[14px] text-gray-600 mt-0.5 font-medium">{slot.sub}</p>
                          <span className={`inline-block mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
                            ✓ Available
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Price Summary (compact) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] text-gray-600">Item total</span>
            <span className="text-[13px] font-medium text-gray-900">₹{subtotal.toFixed(0)}</span>
          </div>
          {cs.couponApplied && couponDiscount > 0 && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] text-[#0c831f]">Coupon discount</span>
              <span className="text-[13px] font-medium text-[#0c831f]">− ₹{couponDiscount.toFixed(0)}</span>
            </div>
          )}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] text-gray-600">Delivery fee</span>
            <span className="text-[13px] font-bold text-[#0c831f]">{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
          </div>
          <div className="h-px bg-gray-100 my-2" />
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold text-gray-900">Grand total</span>
            <span className="text-[14px] font-bold text-gray-900">₹{grandTotal.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {selectedSlotIdx !== null && availableSlots[selectedSlotIdx] ? (
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <p className="text-[13px] font-bold text-gray-700">{availableSlots[selectedSlotIdx].icon} {availableSlots[selectedSlotIdx].label}</p>
              <p className="text-[11px] text-gray-400">{dayOption.label} · {availableSlots[selectedSlotIdx].sub}</p>
            </div>
            <button onClick={handleContinue}
              className="flex-1 h-[52px] bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[16px] rounded-xl transition-colors shadow-sm">
              Continue
            </button>
          </div>
        ) : (
          <button disabled className="w-full h-[52px] bg-gray-200 text-gray-400 font-bold text-[16px] rounded-xl cursor-not-allowed">
            {availableSlots.length === 0 ? "Pick another day" : "Select a time slot"}
          </button>
        )}
      </div>
    </div>
  );
}
