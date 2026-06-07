import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { ArrowLeft, Package, CheckCircle2, Truck, MapPin, Phone, CreditCard, Clock, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";

const STEPS = [
  { key: "placed", label: "Order Placed", icon: Package, desc: "Your order has been placed successfully" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2, desc: "Store has confirmed your order" },
  { key: "packed", label: "Packed", icon: Package, desc: "Your items are packed and ready" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck, desc: "Rider is on the way" },
  { key: "delivered", label: "Delivered", icon: CheckCircle2, desc: "Order delivered successfully" },
];

export function OrderTracking() {
  const params = useParams();
  const orderId = params.id;
  const [, setLocation] = useLocation();
  const { getOrders } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders().then(orders => {
      const found = orders.find((o: any) => o.id === orderId);
      setOrder(found || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-3 border-[#0c831f] border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h2 className="text-[18px] font-bold text-gray-900 mb-1">Order not found</h2>
          <p className="text-[13px] text-gray-500 mb-4">This order doesn't exist or you don't have access to it.</p>
          <Link href="/account"><button className="h-10 px-6 bg-[#0c831f] text-white text-[13px] font-bold rounded-xl">Go to Account</button></Link>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";
  const currentStepIdx = STEPS.findIndex(s => s.key === order.status);
  const items = order.items as any[];

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24 md:pb-8">
      <button onClick={() => setLocation("/account")} className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-[18px] font-bold text-gray-900">Order Tracking</h1>
            {isCancelled ? (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600">Cancelled</span>
            ) : order.status === "delivered" ? (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-600">Delivered</span>
            ) : (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">In Progress</span>
            )}
          </div>
          <p className="text-[12px] text-gray-400">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-[12px] text-gray-400">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>

        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
            <h2 className="text-[15px] font-bold text-gray-900 mb-4">Delivery Status</h2>
            <div className="space-y-0">
              {STEPS.map((step, i) => {
                const isActive = i <= currentStepIdx;
                const isCurrent = i === currentStepIdx;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isActive ? "bg-[#0c831f]" : "bg-gray-100"}`}>
                        <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />
                      </div>
                      {i < STEPS.length - 1 && <div className={`w-0.5 h-8 ${i < currentStepIdx ? "bg-[#0c831f]" : "bg-gray-200"}`} />}
                    </div>
                    <div className="pb-6">
                      <p className={`text-[13px] font-semibold ${isActive ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                      <p className={`text-[11px] mt-0.5 ${isActive ? "text-gray-500" : "text-gray-300"}`}>{step.desc}</p>
                      {isCurrent && order.status !== "delivered" && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#0c831f] font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0c831f] animate-pulse" />
                          Current Status
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="text-[15px] font-bold text-gray-900 mb-3">Items ({items.length})</h2>
          <div className="space-y-3 divide-y divide-gray-50">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex gap-3 pt-3 first:pt-0">
                <img src={item.product?.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">{item.product?.name}</p>
                  <p className="text-[11px] text-gray-400">{item.product?.unit} x {item.quantity}</p>
                </div>
                <span className="text-[13px] font-bold text-gray-900 shrink-0">₹{(item.product?.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between">
            <span className="text-[14px] font-bold text-gray-900">Total</span>
            <span className="text-[16px] font-extrabold text-gray-900">₹{order.total}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-[15px] font-bold text-gray-900 mb-3">Order Details</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase">Delivery Address</p>
                <p className="text-[13px] text-gray-700 mt-0.5">{order.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase">Contact</p>
                <p className="text-[13px] text-gray-700 mt-0.5">{order.name} &middot; {order.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase">Payment</p>
                <p className="text-[13px] text-gray-700 mt-0.5">{order.paymentMethod === "card" ? "Credit/Debit Card" : order.paymentMethod === "upi" ? "UPI" : "Cash on Delivery"}</p>
              </div>
            </div>
            {order.deliverySlot && (
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase">Delivery Slot</p>
                  <p className="text-[13px] text-gray-700 mt-0.5">{order.deliverySlot}</p>
                </div>
              </div>
            )}
            {order.deliveryInstructions && (
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase">Delivery Instructions</p>
                  <p className="text-[13px] text-gray-700 mt-0.5">{order.deliveryInstructions}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
