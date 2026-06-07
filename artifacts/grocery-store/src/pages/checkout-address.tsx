import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, X, Home, Briefcase, MapPin, Plus, Check, Edit2, ChevronRight, Percent, Tag } from "lucide-react";
import { useGetCart } from "@workspace/api-client-react";
import { validateCoupon } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { getCheckoutState, saveCheckoutState } from "@/lib/checkout-store";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface Address {
  id: number;
  label?: string;
  fullAddress?: string;
  landmark?: string;
  city?: string;
  pincode?: string;
  isDefault?: boolean;
}

export function CheckoutAddress() {
  const [, setLocation] = useLocation();
  const { data: cart } = useGetCart();
  const { user, getAddresses, addAddress, updateAddress } = useAuth();
  const cs = getCheckoutState();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedId, setSelectedId] = useState<number | undefined>(cs.selectedAddressId);
  const [selectedAddr, setSelectedAddr] = useState<Address | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState<number | null>(null);
  const [updatingAddress, setUpdatingAddress] = useState(false);
  const [storeCity, setStoreCity] = useState("Nagpur");

  const [couponCode, setCouponCode] = useState(cs.couponCode);
  const [couponApplied, setCouponApplied] = useState(cs.couponApplied);
  const [couponDiscount, setCouponDiscount] = useState(cs.couponDiscount);
  const [couponMessage, setCouponMessage] = useState(cs.couponMessage);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);

  const [newAddr, setNewAddr] = useState({ label: "Home", fullAddress: "", landmark: "", city: storeCity, pincode: "" });
  const [editingAddr, setEditingAddr] = useState({ label: "Home", fullAddress: "", landmark: "", city: "", pincode: "" });

  useEffect(() => {
    if (!user) { setLocation("/cart"); return; }
    const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${BASE}/api/settings/public`).then(r => r.json()).then(d => {
      if (d.store_city) setStoreCity(d.store_city);
    }).catch(() => {});
    getAddresses().then(data => {
      const addrs = (data as any)?.addresses ?? data ?? [];
      setAddresses(addrs);
      if (!selectedId && addrs.length > 0) {
        const def = addrs.find((a: Address) => a.isDefault) ?? addrs[0];
        setSelectedId(def.id);
        setSelectedAddr(def);
      } else if (selectedId) {
        const found = addrs.find((a: Address) => a.id === selectedId);
        if (found) setSelectedAddr(found);
      }
    }).catch(() => {}).finally(() => setLoadingAddresses(false));
  }, [user]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.fullAddress.trim()) return;
    setAddingAddress(true);
    try {
      const data = await addAddress({ ...newAddr, city: newAddr.city || storeCity });
      const created = data?.address ?? data;
      if (created?.id) {
        const updated = [...addresses, created];
        setAddresses(updated);
        setSelectedId(created.id);
        setSelectedAddr(created);
        setShowAddForm(false);
        setNewAddr({ label: "Home", fullAddress: "", landmark: "", city: storeCity, pincode: "" });
      }
    } catch {}
    setAddingAddress(false);
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddrId || !editingAddr.fullAddress.trim()) return;
    setUpdatingAddress(true);
    try {
      const data = await updateAddress(editingAddrId, { ...editingAddr, city: editingAddr.city || storeCity });
      const updated = data?.address ?? data;
      if (updated?.id) {
        setAddresses(prev => prev.map(a => a.id === editingAddrId ? { ...a, ...updated } : a));
        if (selectedId === editingAddrId) setSelectedAddr({ ...selectedAddr, ...updated } as Address);
        setEditingAddrId(null);
      }
    } catch {}
    setUpdatingAddress(false);
  };

  const subtotal = cart?.total ?? 0;
  const deliveryFee = cs.deliveryFee ?? 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - couponDiscount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !cart) return;
    setCouponLoading(true); setCouponError("");
    try {
      const r = await validateCoupon(couponCode.trim(), subtotal);
      setCouponApplied(true); setCouponDiscount(r.discount); setCouponMessage(r.message);
    } catch (err: any) { setCouponError(err.message || "Invalid coupon code"); }
    setCouponLoading(false);
  };

  const handleContinue = () => {
    if (!selectedAddr) return;
    saveCheckoutState({
      selectedAddressId: selectedAddr.id,
      addressLabel: selectedAddr.label,
      addressFull: selectedAddr.fullAddress,
      addressLandmark: selectedAddr.landmark,
      addressCity: selectedAddr.city,
      addressPincode: selectedAddr.pincode,
      couponCode: couponApplied ? couponCode : "",
      couponApplied, couponDiscount, couponMessage,
    });
    setLocation("/checkout/slot");
  };

  const itemCount = cart?.itemCount ?? 0;

  return (
    <div className="min-h-screen bg-[#f2f3f5]">
      {/* Header */}
      <div className="bg-white px-4 py-3.5 flex items-center gap-3 border-b border-gray-100 sticky top-0 z-10">
        <button onClick={() => setLocation("/cart")}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[16px] font-bold text-gray-900">Your items ({itemCount} item{itemCount !== 1 ? "s" : ""})</h1>
        </div>
        <button onClick={() => setLocation("/")}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress indicator */}
      <div className="bg-white px-4 py-2 border-b border-gray-100 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-[#0c831f] flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
          <span className="text-[11px] font-semibold text-[#0c831f]">Cart</span>
        </div>
        <div className="flex-1 h-px bg-[#0c831f]" />
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-[#0c831f] flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">2</span>
          </div>
          <span className="text-[11px] font-bold text-[#0c831f]">Address</span>
        </div>
        <div className="flex-1 h-px bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-[10px] font-bold text-gray-400">3</span>
          </div>
          <span className="text-[11px] text-gray-400">Slot</span>
        </div>
        <div className="flex-1 h-px bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-[10px] font-bold text-gray-400">4</span>
          </div>
          <span className="text-[11px] text-gray-400">Pay</span>
        </div>
      </div>

      <div className="pb-[120px]">
        {/* Address selection */}
        <div className="px-3 pt-4">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider px-1 mb-2">
            Select Delivery Address
          </p>

          {loadingAddresses ? (
            <div className="space-y-3">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          ) : (
            <div className="space-y-2">
              {addresses.map(addr => {
                const isSelected = selectedId === addr.id;
                const isEditing = editingAddrId === addr.id;

                if (isEditing) {
                  return (
                    <form key={addr.id} onSubmit={handleUpdateAddress}
                      className="bg-white rounded-2xl p-4 border-2 border-[#0c831f] space-y-3 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[14px] font-bold text-gray-900">Edit Address</h3>
                        <button type="button" onClick={() => setEditingAddrId(null)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        {["Home", "Work", "Other"].map(l => (
                          <button key={l} type="button" onClick={() => setEditingAddr(a => ({ ...a, label: l }))}
                            className={`flex-1 h-9 rounded-xl text-[12px] font-bold border-2 transition-all flex items-center justify-center gap-1.5 ${editingAddr.label === l ? "border-[#0c831f] bg-[#f0fdf4] text-[#0c831f]" : "border-gray-100 text-gray-600"}`}>
                            {l === "Home" ? <Home className="w-3.5 h-3.5" /> : l === "Work" ? <Briefcase className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                            {l}
                          </button>
                        ))}
                      </div>
                      <textarea required rows={2} value={editingAddr.fullAddress}
                        onChange={e => setEditingAddr(a => ({ ...a, fullAddress: e.target.value }))}
                        placeholder="Flat no, building, street, area..."
                        className="w-full px-3 py-2.5 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white resize-none" />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={editingAddr.landmark} onChange={e => setEditingAddr(a => ({ ...a, landmark: e.target.value }))}
                          placeholder="Landmark (optional)"
                          className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f]" />
                        <input required value={editingAddr.city} onChange={e => setEditingAddr(a => ({ ...a, city: e.target.value }))}
                          placeholder={storeCity}
                          className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f]" />
                      </div>
                      <input value={editingAddr.pincode} onChange={e => setEditingAddr(a => ({ ...a, pincode: e.target.value }))}
                        placeholder="Pincode"
                        className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f]" />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setEditingAddrId(null)}
                          className="flex-1 h-10 border border-gray-200 rounded-xl text-[13px] font-medium hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={updatingAddress || !editingAddr.fullAddress.trim()}
                          className="flex-1 h-10 bg-[#0c831f] text-white font-bold text-[13px] rounded-xl disabled:opacity-50">
                          {updatingAddress ? "Saving..." : "Update"}
                        </button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div key={addr.id}
                    className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${isSelected ? "border-[#0c831f]" : "border-transparent shadow-sm hover:border-gray-200"}`}>
                    <div className="p-4 flex items-start gap-3 cursor-pointer" onClick={() => { setSelectedId(addr.id); setSelectedAddr(addr); }}>
                      <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${isSelected ? "border-[#0c831f] bg-[#0c831f]" : "border-gray-300"}`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[12px] font-bold uppercase tracking-wide text-gray-700">{addr.label || "Address"}</span>
                          {addr.isDefault && <span className="text-[9px] bg-[#e6f4ea] text-[#0c831f] font-bold px-1.5 py-0.5 rounded-full">DEFAULT</span>}
                        </div>
                        <p className="text-[13px] text-gray-800 leading-snug">{addr.fullAddress}</p>
                        {addr.landmark && <p className="text-[11px] text-gray-400 mt-0.5">Near {addr.landmark}</p>}
                        <p className="text-[11px] text-gray-400 mt-0.5">{addr.city}{addr.pincode ? ` – ${addr.pincode}` : ""}</p>
                      </div>
                      <button type="button"
                        onClick={e => { e.stopPropagation(); setEditingAddrId(addr.id); setEditingAddr({ label: addr.label || "Home", fullAddress: addr.fullAddress || "", landmark: addr.landmark || "", city: addr.city || storeCity, pincode: addr.pincode || "" }); }}
                        className="shrink-0 text-[11px] font-semibold text-[#0c831f] flex items-center gap-0.5 hover:underline">
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add new address */}
              {!showAddForm ? (
                <button onClick={() => setShowAddForm(true)}
                  className="w-full bg-white rounded-2xl p-4 border-2 border-dashed border-gray-200 flex items-center gap-3 hover:border-[#0c831f] hover:bg-[#f0fdf4] transition-all group">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-[#e6f4ea] flex items-center justify-center transition-colors">
                    <Plus className="w-4 h-4 text-gray-500 group-hover:text-[#0c831f]" />
                  </div>
                  <div className="text-left">
                    <p className="text-[14px] font-bold text-gray-700 group-hover:text-[#0c831f]">Add new address</p>
                    <p className="text-[11px] text-gray-400">Home, work or any other location</p>
                  </div>
                </button>
              ) : (
                <form onSubmit={handleAddAddress}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[15px] font-bold text-gray-900">Add New Address</h3>
                    <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {["Home", "Work", "Other"].map(l => (
                      <button key={l} type="button" onClick={() => setNewAddr(a => ({ ...a, label: l }))}
                        className={`flex-1 h-9 rounded-xl text-[12px] font-bold border-2 transition-all flex items-center justify-center gap-1.5 ${newAddr.label === l ? "border-[#0c831f] bg-[#f0fdf4] text-[#0c831f]" : "border-gray-100 text-gray-600"}`}>
                        {l === "Home" ? <Home className="w-3.5 h-3.5" /> : l === "Work" ? <Briefcase className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                        {l}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Full Address *</label>
                    <textarea required rows={2} value={newAddr.fullAddress}
                      onChange={e => setNewAddr(a => ({ ...a, fullAddress: e.target.value }))}
                      placeholder="Flat no, building, street, area..."
                      className="w-full px-3 py-2.5 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white resize-none transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Landmark</label>
                      <input value={newAddr.landmark} onChange={e => setNewAddr(a => ({ ...a, landmark: e.target.value }))}
                        placeholder="Near temple..."
                        className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">City *</label>
                      <input required value={newAddr.city} onChange={e => setNewAddr(a => ({ ...a, city: e.target.value }))}
                        placeholder={storeCity}
                        className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1 block">Pincode</label>
                    <input value={newAddr.pincode} onChange={e => setNewAddr(a => ({ ...a, pincode: e.target.value }))}
                      placeholder="440001"
                      className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all" />
                  </div>
                  <button type="submit" disabled={addingAddress || !newAddr.fullAddress.trim()}
                    className="w-full h-11 bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[14px] rounded-xl transition-colors disabled:opacity-50">
                    {addingAddress ? "Saving..." : "Save Address"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Coupons & Offers */}
        <div className="bg-white mx-3 mt-4 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                  <p className="text-[11px] text-gray-500">Apply a coupon to save more</p>
                </div>
              </div>
              <span className="text-[13px] font-bold text-[#0c831f] flex items-center gap-0.5 shrink-0">
                Apply <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </button>
          )}
        </div>

        {/* Price summary */}
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
        </div>
      </div>

      {/* Sticky Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {selectedAddr ? (
          <div className="flex items-center gap-3">
            <div className="shrink-0 min-w-0">
              <p className="text-[12px] font-bold text-gray-500 truncate">{selectedAddr.label || "Address"}</p>
              <p className="text-[12px] text-gray-700 truncate max-w-[160px]">{selectedAddr.city}</p>
            </div>
            <button onClick={handleContinue}
              className="flex-1 h-[52px] bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[16px] rounded-xl transition-colors shadow-sm">
              Continue
            </button>
          </div>
        ) : (
          <button disabled
            className="w-full h-[52px] bg-gray-200 text-gray-400 font-bold text-[16px] rounded-xl cursor-not-allowed">
            Select an address to continue
          </button>
        )}
      </div>
    </div>
  );
}
