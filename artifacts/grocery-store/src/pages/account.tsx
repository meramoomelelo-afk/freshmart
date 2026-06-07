import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { User, MapPin, ShoppingBag, Heart, HelpCircle, LogOut, ChevronRight, Bell, Wallet, Gift, Edit2, Plus, Trash2, Phone, Home, Building, X, Copy, MessageCircle, ChevronDown, ChevronUp, Mail, IndianRupee, Check, CreditCard, Clock, Tag, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import { useGetProduct } from "@workspace/api-client-react";
import { useStoreConfig as useStoreConfigHook } from "@/lib/store-config";

const DEFAULT_FAQS = [
  { q: "What are the delivery hours?", a: "We deliver from 7 AM to 10 PM, 7 days a week. Orders placed before 9 PM are usually delivered within 30-60 minutes depending on your location." },
  { q: "How do I return or replace an item?", a: "If you received a damaged or wrong item, go to My Orders, select the order, and tap 'Report Issue'. We'll arrange a replacement or refund within 24 hours." },
  { q: "What payment methods are accepted?", a: "We accept UPI (Google Pay, PhonePe, Paytm), credit/debit cards, net banking, wallet balance, and cash on delivery." },
  { q: "How can I track my order?", a: "Go to My Orders and tap on any active order to see real-time tracking with delivery partner details and estimated arrival time." },
  { q: "Can I cancel my order?", a: "You can cancel your order before it is packed. Once packed, cancellation is not possible. Refunds are processed within 2-3 business days." },
  { q: "Is there a minimum order value?", a: "There is no minimum order value. However, a delivery fee may be charged on orders below the free delivery threshold." },
  { q: "How do I apply a coupon code?", a: "On the cart page, you'll find an 'Apply Coupon' field. Enter your coupon code and tap Apply. The discount will be reflected in your order total." },
];

function useAccountConfig() {
  const { config } = useStoreConfigHook();
  return {
    storeName: config.storeName || "Store",
    faqs: (config.faqs && config.faqs.length > 0) ? config.faqs : DEFAULT_FAQS,
    supportEmail: config.supportEmail || "",
  };
}

function AddressModal({ address, onSave, onClose }: { address?: any; onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    label: address?.label || "Home",
    fullAddress: address?.fullAddress || "",
    landmark: address?.landmark || "",
    city: address?.city || "",
    pincode: address?.pincode || "",
    isDefault: address?.isDefault || false,
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md p-5 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold text-gray-900">{address ? "Edit Address" : "Add New Address"}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-gray-600 block mb-1">Label</label>
            <div className="flex gap-2">
              {["Home", "Work", "Other"].map(l => (
                <button key={l} type="button" onClick={() => setForm({ ...form, label: l })}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold border transition-colors ${form.label === l ? "border-[#0c831f] bg-[#f0fdf4] text-[#0c831f]" : "border-gray-200 text-gray-600"}`}
                >
                  {l === "Home" ? <Home className="w-3.5 h-3.5" /> : l === "Work" ? <Building className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-gray-600 block mb-1">Full Address</label>
            <textarea value={form.fullAddress} onChange={e => setForm({ ...form, fullAddress: e.target.value })} rows={3} placeholder="Flat no, building, street, area..."
              className="w-full p-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-gray-600 block mb-1">Landmark</label>
              <input value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} placeholder="Near..."
                className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-gray-600 block mb-1">City</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City"
                className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-gray-600 block mb-1">Pincode</label>
            <input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="560001"
              className="w-full h-10 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#0c831f] focus:bg-white" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-[#0c831f] focus:ring-[#0c831f]" />
            <span className="text-[13px] text-gray-700">Set as default address</span>
          </label>
        </div>

        <button
          onClick={() => onSave(form)}
          disabled={!form.fullAddress.trim()}
          className="w-full mt-4 h-11 bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[14px] rounded-xl transition-colors disabled:opacity-50"
        >
          {address ? "Update Address" : "Save Address"}
        </button>
      </motion.div>
    </div>
  );
}

function EditProfileModal({ user, onSave, onClose }: { user: any; onSave: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState(user?.name || "");

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-sm p-5"
      >
        <h3 className="text-[16px] font-bold text-gray-900 mb-4">Edit Profile</h3>
        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-semibold text-gray-600 block mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
              className="w-full h-11 px-3 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white" autoFocus />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-gray-600 block mb-1">Phone</label>
            <input value={user?.phone || ""} disabled className="w-full h-11 px-3 bg-gray-100 border border-gray-200 rounded-xl text-[14px] text-gray-400" />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 h-11 border border-gray-200 rounded-xl text-[14px] font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={() => { onSave(name); onClose(); }} disabled={!name.trim()}
            className="flex-1 h-11 bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[14px] rounded-xl disabled:opacity-50">Save</button>
        </div>
      </motion.div>
    </div>
  );
}

function WishlistItemCard({ productId, onRemove }: { productId: string; onRemove: () => void }) {
  const { data: product, isLoading } = useGetProduct(productId);
  if (isLoading) return <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-20 animate-pulse" />;
  if (!product) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex gap-3 items-center">
      <Link href={`/product/${product.id}`}>
        <div className="w-16 h-16 bg-[#f7f7f7] rounded-xl overflow-hidden shrink-0">
          <img src={product.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"} alt={product.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"; }} />
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/product/${product.id}`}>
          <p className="text-[13px] font-semibold text-gray-900 truncate hover:text-[#0c831f]">{product.name}</p>
        </Link>
        <p className="text-[11px] text-gray-400 mt-0.5">{product.quantity}</p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-[14px] font-bold text-gray-900">₹{product.price}</span>
          {product.originalPrice > product.price && (
            <span className="text-[11px] text-gray-400 line-through">₹{product.originalPrice}</span>
          )}
        </div>
      </div>
      <button onClick={onRemove} className="p-2 hover:bg-red-50 rounded-lg transition-colors shrink-0">
        <Heart className="w-5 h-5 fill-red-500 text-red-500" />
      </button>
    </div>
  );
}

function WalletTab({ storeName }: { storeName: string }) {
  return (
    <motion.div key="wallet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#e6f4ea] flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#0c831f]" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium">{storeName} Wallet</p>
            <p className="text-[22px] font-bold text-gray-900 flex items-center"><IndianRupee className="w-5 h-5" />0.00</p>
          </div>
        </div>
        <button className="w-full h-10 bg-[#0c831f] text-white text-[13px] font-bold rounded-xl hover:bg-[#0a6f1a] transition-colors">
          Add Money to Wallet
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-[14px] font-bold text-gray-900 mb-3">Saved Payment Methods</h3>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
          <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-[13px] font-semibold text-gray-500">No saved payment methods</p>
          <p className="text-[11px] text-gray-400 mt-1">Your UPI IDs and cards will appear here</p>
          <button className="mt-3 h-9 px-5 border border-[#0c831f] text-[#0c831f] text-[12px] font-bold rounded-lg hover:bg-[#f0fdf4] transition-colors">
            Add UPI / Card
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-[14px] font-bold text-gray-900 mb-3">Transaction History</h3>
        <div className="text-center py-6">
          <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-[13px] text-gray-500">No transactions yet</p>
          <p className="text-[11px] text-gray-400 mt-1">Your wallet transactions will show up here</p>
        </div>
      </div>
    </motion.div>
  );
}

function RewardsTab() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const coupons = [
    { code: "FRESH50", title: "50% OFF on first order", desc: "Maximum discount ₹100. Valid on orders above ₹199.", color: "from-green-500 to-emerald-600", icon: Star },
    { code: "VEGGIES20", title: "20% OFF on vegetables", desc: "No minimum order. Valid on all vegetable products.", color: "from-orange-500 to-amber-600", icon: Tag },
    { code: "FREEDEL", title: "FREE delivery above ₹299", desc: "Free delivery on orders above ₹299. No code needed.", color: "from-blue-500 to-indigo-600", icon: ShoppingBag },
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <motion.div key="rewards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-4 h-4 text-[#0c831f]" />
          <h3 className="text-[14px] font-bold text-gray-900">Available Coupons</h3>
        </div>
        <p className="text-[11px] text-gray-400 mb-4">Apply these codes at checkout for great discounts</p>

        <div className="space-y-3">
          {coupons.map(coupon => (
            <div key={coupon.code} className="relative overflow-hidden rounded-xl border border-gray-100">
              <div className={`bg-gradient-to-r ${coupon.color} px-4 py-3`}>
                <div className="flex items-center gap-2">
                  <coupon.icon className="w-4 h-4 text-white/80" />
                  <span className="text-[14px] font-bold text-white">{coupon.title}</span>
                </div>
              </div>
              <div className="px-4 py-3 bg-white flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-500 leading-relaxed">{coupon.desc}</p>
                </div>
                <button
                  onClick={() => handleCopy(coupon.code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all shrink-0 ${copiedCode === coupon.code ? "border-green-300 bg-green-50 text-green-600" : "border-dashed border-[#0c831f] text-[#0c831f] hover:bg-[#f0fdf4]"}`}
                >
                  {copiedCode === coupon.code ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> {coupon.code}</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-[14px] font-bold text-gray-900 mb-2">Cashback Rewards</h3>
        <div className="text-center py-4">
          <IndianRupee className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-[13px] text-gray-500">No cashback earned yet</p>
          <p className="text-[11px] text-gray-400 mt-1">Place orders to earn cashback rewards</p>
        </div>
      </div>
    </motion.div>
  );
}

function NotificationsTab() {
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  const notifications = [
    { id: 1, type: "order", title: "Order Delivered!", body: "Your order #1042 has been delivered. Enjoy your fresh groceries!", time: "2 hours ago", icon: ShoppingBag, color: "text-green-600 bg-green-50" },
    { id: 2, type: "offer", title: "Weekend Special!", body: "Get 30% off on all fruits this weekend. Use code FRUIT30", time: "5 hours ago", icon: Tag, color: "text-orange-600 bg-orange-50" },
    { id: 3, type: "order", title: "Out for Delivery", body: "Your order #1041 is out for delivery. Track it live!", time: "1 day ago", icon: ShoppingBag, color: "text-blue-600 bg-blue-50" },
    { id: 4, type: "promo", title: "New arrivals!", body: "Fresh dragon fruits & litchis now available. Order before they run out!", time: "2 days ago", icon: Star, color: "text-purple-600 bg-purple-50" },
    { id: 5, type: "offer", title: "Free Delivery Unlocked", body: "You've earned free delivery on your next 3 orders. No minimum order!", time: "3 days ago", icon: Gift, color: "text-[#0c831f] bg-[#e6f4ea]" },
    { id: 6, type: "system", title: "Profile Updated", body: "Your profile information has been updated successfully.", time: "5 days ago", icon: User, color: "text-gray-600 bg-gray-100" },
  ];

  const toggleRead = (id: number) => {
    setReadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-[14px] font-bold text-gray-900">Recent Notifications</h3>
        <button onClick={() => setReadIds(new Set(notifications.map(n => n.id)))} className="text-[11px] font-semibold text-[#0c831f] hover:underline">
          Mark all as read
        </button>
      </div>
      {notifications.map(n => (
        <div key={n.id}
          className={`bg-white rounded-xl border shadow-sm p-3.5 flex gap-3 items-start transition-colors cursor-pointer ${readIds.has(n.id) ? "border-gray-100 opacity-60" : "border-gray-200"}`}
          onClick={() => toggleRead(n.id)}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.color}`}>
            <n.icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{n.title}</p>
              {!readIds.has(n.id) && <span className="w-2 h-2 rounded-full bg-[#0c831f] shrink-0" />}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
            <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function HelpTab({ storeName, faqs: faqList, supportEmail }: { storeName: string; faqs: { q: string; a: string }[]; supportEmail: string }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqs = faqList;

  return (
    <motion.div key="help" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-[#0c831f]" />
          <h3 className="text-[14px] font-bold text-gray-900">Frequently Asked Questions</h3>
        </div>
        <div className="space-y-1">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-gray-50 last:border-0">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between py-3 text-left"
              >
                <span className="text-[13px] font-semibold text-gray-800 pr-3">{faq.q}</span>
                {openFaq === i ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <p className="text-[12px] text-gray-500 leading-relaxed pb-3">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-[14px] font-bold text-gray-900 mb-3">Contact Us</h3>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 p-3 bg-[#f7f7f7] rounded-xl">
            <Mail className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-[12px] font-semibold text-gray-800">Email Support</p>
              <p className="text-[11px] text-gray-500">{supportEmail || `support@${storeName.toLowerCase().replace(/\s+/g, "")}.in`}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#f7f7f7] rounded-xl">
            <Phone className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-[12px] font-semibold text-gray-800">Call Us</p>
              <p className="text-[11px] text-gray-500">1800-123-4567 (Toll Free)</p>
            </div>
          </div>
        </div>
      </div>

      <button className="w-full bg-[#0c831f] hover:bg-[#0a6f1a] text-white rounded-xl p-3.5 flex items-center justify-center gap-2 transition-colors">
        <MessageCircle className="w-4 h-4" />
        <span className="text-[13px] font-bold">Chat with us</span>
      </button>
    </motion.div>
  );
}

export function Account() {
  const [, setLocation] = useLocation();
  const { user, loading, logout, updateProfile, getAddresses, addAddress, updateAddress, deleteAddress, getOrders } = useAuth();
  const [tab, setTab] = useState<"profile" | "orders" | "addresses" | "wishlist" | "wallet" | "rewards" | "notifications" | "help">("profile");
  const { items: wishlistItems, toggle: toggleWishlist } = useWishlist();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editAddress, setEditAddress] = useState<any>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const { storeName, faqs, supportEmail } = useAccountConfig();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      setLoadingData(true);
      Promise.all([getAddresses(), getOrders()])
        .then(([addr, ord]) => { setAddresses(addr); setOrders(ord); })
        .catch(() => {})
        .finally(() => setLoadingData(false));
    }
  }, [user]);

  if (loading || !user) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-3 border-[#0c831f] border-t-transparent rounded-full animate-spin" /></div>;
  }

  const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
    placed: { color: "text-blue-600", bg: "bg-blue-50", label: "Order Placed" },
    confirmed: { color: "text-yellow-700", bg: "bg-yellow-50", label: "Confirmed" },
    packed: { color: "text-purple-600", bg: "bg-purple-50", label: "Packed" },
    out_for_delivery: { color: "text-orange-600", bg: "bg-orange-50", label: "Out for Delivery" },
    delivered: { color: "text-green-600", bg: "bg-green-50", label: "Delivered" },
    cancelled: { color: "text-red-600", bg: "bg-red-50", label: "Cancelled" },
  };

  const handleSaveAddress = async (data: any) => {
    try {
      if (editAddress) {
        const updated = await updateAddress(editAddress.id, data);
        setAddresses(prev => prev.map(a => a.id === editAddress.id ? updated : a));
      } else {
        const created = await addAddress(data);
        setAddresses(prev => [created, ...prev]);
      }
    } catch {}
    setShowAddressModal(false);
    setEditAddress(null);
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      await deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch {}
  };

  return (
    <div className="max-w-3xl mx-auto px-3 md:px-6 py-5 pb-24 md:pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-5 mb-4 border border-gray-100 shadow-lg shadow-black/5"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#e6f4ea] flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-[#0c831f]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[17px] font-bold text-gray-900">{user.name || "User"}</h2>
            <p className="text-[13px] text-gray-500 mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" />{user.phone}</p>
          </div>
          <button onClick={() => setShowEditProfile(true)} className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <Edit2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </motion.div>

      <div className="flex gap-1 mb-2 bg-gray-100 rounded-xl p-1">
        {[
          { key: "profile" as const, label: "Profile", icon: User },
          { key: "orders" as const, label: `Orders (${orders.length})`, icon: ShoppingBag },
          { key: "addresses" as const, label: `Addresses (${addresses.length})`, icon: MapPin },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[12px] font-semibold transition-colors ${tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {[
          { key: "wallet" as const, label: "Wallet", icon: Wallet },
          { key: "rewards" as const, label: "Rewards", icon: Gift },
          { key: "notifications" as const, label: "Notifications", icon: Bell },
          { key: "help" as const, label: "Help", icon: HelpCircle },
          { key: "wishlist" as const, label: `Wishlist (${wishlistItems.length})`, icon: Heart },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap border ${tab === key ? "border-[#0c831f] bg-[#f0fdf4] text-[#0c831f]" : "border-gray-200 bg-white text-gray-500 hover:text-gray-700"}`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "profile" && (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {[
              { icon: ShoppingBag, label: "My Orders", sub: "Track, return, or reorder", action: () => setTab("orders") },
              { icon: MapPin, label: "Saved Addresses", sub: "Manage your delivery addresses", action: () => setTab("addresses") },
              { icon: Wallet, label: "Wallet & Payments", sub: "UPI, cards, and wallet balance", action: () => setTab("wallet") },
              { icon: Heart, label: `Wishlist (${wishlistItems.length})`, sub: "Your saved favourites", action: () => setTab("wishlist") },
              { icon: Gift, label: "Rewards & Offers", sub: "Coupons and cashback", action: () => setTab("rewards") },
              { icon: Bell, label: "Notifications", sub: "Alerts, updates and promotions", action: () => setTab("notifications") },
              { icon: HelpCircle, label: "Help & Support", sub: "FAQs, chat, and contact us", action: () => setTab("help") },
            ].map(({ icon: Icon, label, sub, action }) => (
              <button key={label} onClick={action} className="w-full bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left">
                <div className="w-9 h-9 rounded-xl bg-[#f2f3f5] flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-gray-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900">{label}</p>
                  <p className="text-[11px] text-gray-500">{sub}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </button>
            ))}

            <button onClick={async () => { await logout(); setLocation("/"); }}
              className="w-full flex items-center justify-center gap-2 bg-white rounded-xl border border-gray-100 shadow-sm py-3.5 text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors mt-3"
            >
              <LogOut className="w-4 h-4" /> Log out
            </button>
            <p className="text-center text-[11px] text-gray-400 mt-4">{storeName} v1.0</p>
          </motion.div>
        )}

        {tab === "orders" && (
          <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {loadingData ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-xl border border-gray-100 h-24 animate-pulse" />)}</div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-[14px] font-semibold text-gray-900 mb-1">No orders yet</p>
                <p className="text-[12px] text-gray-400 mb-4">Start shopping to see your orders here</p>
                <Link href="/"><button className="h-10 px-6 bg-[#0c831f] text-white text-[13px] font-bold rounded-xl hover:bg-[#0a6f1a]">Shop Now</button></Link>
              </div>
            ) : (
              orders.map(order => {
                const status = STATUS_MAP[order.status] || STATUS_MAP.placed;
                const items = order.items as any[];
                return (
                  <Link key={order.id} href={`/order/${order.id}`}>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-gray-200 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>{status.label}</span>
                        <span className="text-[11px] text-gray-400">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex -space-x-2">
                          {items.slice(0, 3).map((item: any, i: number) => (
                            <img key={i} src={item.product?.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"} alt="" className="w-8 h-8 rounded-lg border-2 border-white object-cover bg-gray-100" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"; }} />
                          ))}
                          {items.length > 3 && <div className="w-8 h-8 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-gray-500">+{items.length - 3}</div>}
                        </div>
                        <span className="text-[12px] text-gray-500">{items.length} item{items.length > 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[15px] font-bold text-gray-900">₹{order.total}</span>
                        <span className="text-[12px] text-[#0c831f] font-semibold flex items-center gap-1">View Details <ChevronRight className="w-3.5 h-3.5" /></span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </motion.div>
        )}

        {tab === "wishlist" && (
          <motion.div key="wishlist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {wishlistItems.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-[14px] font-semibold text-gray-700">No favourites yet</p>
                <p className="text-[12px] text-gray-400 mt-1">Tap the heart icon on any product to save it here</p>
                <Link href="/products">
                  <button className="mt-4 text-[13px] font-bold text-[#0c831f] hover:underline">Browse products</button>
                </Link>
              </div>
            ) : (
              wishlistItems.map(productId => (
                <WishlistItemCard key={productId} productId={productId} onRemove={() => toggleWishlist(productId)} />
              ))
            )}
          </motion.div>
        )}

        {tab === "addresses" && (
          <motion.div key="addresses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <button onClick={() => { setEditAddress(null); setShowAddressModal(true); }}
              className="w-full bg-white rounded-xl border-2 border-dashed border-[#0c831f]/30 p-4 flex items-center justify-center gap-2 text-[#0c831f] hover:bg-[#f0fdf4] transition-colors"
            >
              <Plus className="w-4 h-4" /> <span className="text-[13px] font-bold">Add New Address</span>
            </button>

            {addresses.map(addr => (
              <div key={addr.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[12px] font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{addr.label}</span>
                      {addr.isDefault && <span className="text-[10px] font-bold text-[#0c831f] bg-[#e6f4ea] px-2 py-0.5 rounded">Default</span>}
                    </div>
                    <p className="text-[13px] text-gray-700 leading-relaxed">{addr.fullAddress}</p>
                    {addr.landmark && <p className="text-[11px] text-gray-400 mt-1">Near: {addr.landmark}</p>}
                    {(addr.city || addr.pincode) && <p className="text-[11px] text-gray-400">{[addr.city, addr.pincode].filter(Boolean).join(" - ")}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { setEditAddress(addr); setShowAddressModal(true); }} className="p-2 hover:bg-gray-50 rounded-lg"><Edit2 className="w-3.5 h-3.5 text-gray-400" /></button>
                    <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {tab === "wallet" && <WalletTab storeName={storeName} />}
        {tab === "rewards" && <RewardsTab />}
        {tab === "notifications" && <NotificationsTab />}
        {tab === "help" && <HelpTab storeName={storeName} faqs={faqs} supportEmail={supportEmail} />}
      </AnimatePresence>

      {showAddressModal && <AddressModal address={editAddress} onSave={handleSaveAddress} onClose={() => { setShowAddressModal(false); setEditAddress(null); }} />}
      {showEditProfile && <EditProfileModal user={user} onSave={updateProfile} onClose={() => setShowEditProfile(false)} />}
    </div>
  );
}
