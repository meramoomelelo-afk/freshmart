import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Clock, Package, MapPin, Phone, User, CalendarClock, Receipt, ShoppingBag } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { AdminLayout } from "./admin-layout";

const STATUS_OPTIONS = [
  { value: "all", label: "All Orders" },
  { value: "placed", label: "Placed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "packed", label: "Packed" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS: Record<string, string> = {
  placed: "bg-blue-50 text-blue-600",
  confirmed: "bg-yellow-50 text-yellow-700",
  packed: "bg-purple-50 text-purple-600",
  out_for_delivery: "bg-orange-50 text-orange-600",
  delivered: "bg-green-50 text-green-600",
  cancelled: "bg-red-50 text-red-600",
};

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<Record<string, string>>({});
  const [updatingSlot, setUpdatingSlot] = useState<string | null>(null);
  const [itemPrices, setItemPrices] = useState<Record<string, Record<number, number>>>({});
  const [itemQuantities, setItemQuantities] = useState<Record<string, Record<number, number>>>({});
  const [savingItems, setSavingItems] = useState<string | null>(null);
  const [sendingBill, setSendingBill] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error", ms = 3000) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), ms);
  };

  const load = async (p = page, status = statusFilter) => {
    setLoading(true);
    try {
      const data = await adminApi.getOrders({ page: String(p), status });
      setOrders(data.orders);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const prev = [...orders];
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      showToast(`Status updated to ${newStatus.replace(/_/g, " ")}`, "success", 2000);
    } catch (err: any) {
      setOrders(prev);
      showToast(err.message || "Failed to update status", "error");
    }
  };

  const getItemPrice = (orderId: string, idx: number, item: any): number => {
    if (itemPrices[orderId]?.[idx] !== undefined) return itemPrices[orderId][idx];
    return item.customPrice !== undefined ? Number(item.customPrice) : Number(item.product?.price || 0);
  };

  const getItemQty = (orderId: string, idx: number, item: any): number => {
    if (itemQuantities[orderId]?.[idx] !== undefined) return itemQuantities[orderId][idx];
    return Number(item.quantity) || 1;
  };

  const setItemPrice = (orderId: string, idx: number, price: number) => {
    setItemPrices(prev => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), [idx]: price } }));
  };

  const setItemQty = (orderId: string, idx: number, qty: number) => {
    setItemQuantities(prev => ({ ...prev, [orderId]: { ...(prev[orderId] || {}), [idx]: qty } }));
  };

  const hasChanges = (orderId: string) =>
    (itemPrices[orderId] && Object.keys(itemPrices[orderId]).length > 0) ||
    (itemQuantities[orderId] && Object.keys(itemQuantities[orderId]).length > 0);

  const getOrderNewTotal = (order: any): number => {
    const items = (order.items as any[]) || [];
    const origSubtotal = items.reduce((s, item) => {
      const p = item.customPrice !== undefined ? Number(item.customPrice) : Number(item.product?.price || 0);
      return s + p * (Number(item.quantity) || 1);
    }, 0);
    const newSubtotal = items.reduce((s, item, idx) => {
      return s + getItemPrice(order.id, idx, item) * getItemQty(order.id, idx, item);
    }, 0);
    return Math.max(0, Number(order.total) + newSubtotal - origSubtotal);
  };

  const saveItemPrices = async (order: any) => {
    setSavingItems(order.id);
    try {
      const updatedItems = (order.items as any[]).map((item, idx) => ({
        ...item,
        customPrice: getItemPrice(order.id, idx, item),
        quantity: getItemQty(order.id, idx, item),
      }));
      const newTotal = getOrderNewTotal(order);
      await adminApi.updateOrderItems(order.id, updatedItems, newTotal);
      setOrders(orders.map(o => o.id === order.id ? { ...o, items: updatedItems, total: newTotal } : o));
      setItemPrices(prev => { const n = { ...prev }; delete n[order.id]; return n; });
      setItemQuantities(prev => { const n = { ...prev }; delete n[order.id]; return n; });
      showToast("Changes saved!", "success", 2500);
    } catch (err: any) {
      showToast(err.message || "Failed to save", "error");
    }
    setSavingItems(null);
  };

  const sendBill = async (order: any) => {
    setSendingBill(order.id);
    try {
      const res = await adminApi.sendOrderBill(order.id);
      showToast(res?.sent === "whatsapp" ? "PDF invoice sent via WhatsApp!" : "Bill sent", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to send bill", "error");
    }
    setSendingBill(null);
  };

  const updateDeliverySlot = async (orderId: string, slot: string) => {
    if (!slot.trim()) return;
    setUpdatingSlot(orderId);
    try {
      await adminApi.updateOrderDeliverySlot(orderId, slot.trim());
      setOrders(orders.map(o => o.id === orderId ? { ...o, deliverySlot: slot.trim() } : o));
      showToast("Delivery slot updated & customer notified", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update slot", "error");
    }
    setUpdatingSlot(null);
  };

  const goPage = (p: number) => { setPage(p); load(p, statusFilter); };
  const changeFilter = (s: string) => { setStatusFilter(s); setPage(1); load(1, s); };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Orders</h1>
          <p className="text-[13px] text-gray-500">{total} order{total !== 1 ? "s" : ""} total</p>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => changeFilter(opt.value)}
              className={`shrink-0 h-9 px-3 rounded-lg text-[12px] font-semibold transition-colors ${statusFilter === opt.value ? "bg-[#0c831f] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">No orders found</div>
          ) : orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Order Row Header */}
              <div
                className="px-4 py-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-semibold text-gray-900">{order.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || "bg-gray-50 text-gray-600"}`}>
                        {order.status.replace(/_/g, " ").replace(/^\w/, (c: string) => c.toUpperCase())}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[15px] font-bold text-gray-900">₹{order.total}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedOrder === order.id ? "rotate-180" : ""}`} />
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedOrder === order.id && (
                <div className="border-t border-gray-100">

                  {/* Customer Info */}
                  <div className="px-4 py-3 bg-gray-50/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Customer</p>
                      <p className="text-[12px] text-gray-800 flex items-center gap-2 font-semibold"><User className="w-3.5 h-3.5 text-gray-400 shrink-0" />{order.name}</p>
                      <p className="text-[12px] text-gray-500 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />{order.phone}</p>
                      <p className="text-[12px] text-gray-500 flex items-start gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" /><span>{order.address}</span></p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Order Info</p>
                      <p className="text-[12px] text-gray-600">Payment: <span className="font-semibold capitalize">{(order.paymentMethod || "").replace(/_/g, " ")}</span></p>
                      {order.deliverySlot && (
                        <p className="text-[12px] text-gray-600">Delivery Slot: <span className="font-semibold">{order.deliverySlot}</span></p>
                      )}
                      {order.couponCode && (
                        <p className="text-[12px] text-[#0c831f] font-semibold">Coupon {order.couponCode}: -₹{order.couponDiscount}</p>
                      )}
                    </div>
                  </div>

                  {/* Items Section */}
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5" /> Order Items
                      </p>
                      <p className="text-[10px] text-orange-500 font-semibold">Tap qty or price to edit</p>
                    </div>

                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      {/* Table Header */}
                      <div className="grid items-center bg-gray-50 px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider"
                        style={{ gridTemplateColumns: "36px 1fr 64px 76px 52px" }}>
                        <div></div>
                        <div>Item</div>
                        <div className="text-center">Qty</div>
                        <div className="text-center">Price</div>
                        <div className="text-right">Total</div>
                      </div>

                      {/* Item Rows */}
                      {(order.items as any[])?.map((item: any, i: number) => {
                        const price = getItemPrice(order.id, i, item);
                        const qty = getItemQty(order.id, i, item);
                        const priceChanged = itemPrices[order.id]?.[i] !== undefined;
                        const qtyChanged = itemQuantities[order.id]?.[i] !== undefined;
                        return (
                          <div
                            key={i}
                            className={`grid items-center gap-2 px-3 py-2.5 border-t border-gray-50 ${i % 2 === 1 ? "bg-gray-50/40" : ""}`}
                            style={{ gridTemplateColumns: "36px 1fr 64px 76px 52px" }}
                          >
                            {/* Product Image */}
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                              {item.product?.imageUrl ? (
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[18px]">🛒</div>
                              )}
                            </div>

                            {/* Name */}
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold text-gray-800 truncate leading-tight">{item.product?.name || "Item"}</p>
                              {(item.product?.quantity || item.product?.unit) && (
                                <p className="text-[10px] text-gray-400 leading-tight">{item.product.quantity}{item.product.unit}</p>
                              )}
                            </div>

                            {/* Quantity Input */}
                            <div className="flex justify-center">
                              <input
                                type="number"
                                value={qty}
                                min={1}
                                onClick={e => e.stopPropagation()}
                                onChange={e => setItemQty(order.id, i, Math.max(1, Number(e.target.value) || 1))}
                                className={`w-14 h-8 text-center text-[13px] font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c831f]/30 focus:border-[#0c831f] transition-colors ${qtyChanged ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 bg-white text-gray-900"}`}
                              />
                            </div>

                            {/* Price Input */}
                            <div className="flex items-center gap-0.5 justify-center">
                              <span className="text-[10px] text-gray-400 font-medium">₹</span>
                              <input
                                type="number"
                                value={price}
                                min={0}
                                onClick={e => e.stopPropagation()}
                                onChange={e => setItemPrice(order.id, i, Number(e.target.value) || 0)}
                                className={`w-[60px] h-8 text-center text-[13px] font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c831f]/30 focus:border-[#0c831f] transition-colors ${priceChanged ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 bg-white text-gray-900"}`}
                              />
                            </div>

                            {/* Line Total */}
                            <div className="text-right">
                              <p className="text-[12px] font-bold text-gray-900">₹{(price * qty).toFixed(0)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Order Summary */}
                    <div className="mt-2 space-y-1 px-1">
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[12px] text-gray-400">
                          {hasChanges(order.id) ? "New total:" : "Order total:"}
                        </span>
                        <span className="text-[14px] font-bold text-gray-900">
                          ₹{hasChanges(order.id) ? getOrderNewTotal(order).toFixed(0) : order.total}
                        </span>
                      </div>
                      {hasChanges(order.id) && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => saveItemPrices(order)}
                            disabled={savingItems === order.id}
                            className="h-9 px-5 bg-orange-500 text-white text-[12px] font-bold rounded-xl hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            {savingItems === order.id ? "Saving…" : "💾 Save Changes"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-4 pt-3 pb-4 border-t border-gray-100 space-y-3">

                    {/* Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Status:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {["placed", "confirmed", "packed", "out_for_delivery", "delivered", "cancelled"].map(s => (
                          <button
                            key={s}
                            onClick={() => updateStatus(order.id, s)}
                            disabled={order.status === s}
                            className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${order.status === s ? "bg-[#0c831f] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                          >
                            {s.replace(/_/g, " ").replace(/^\w/, (c: string) => c.toUpperCase())}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Slot + Send Bill */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex gap-2 flex-1">
                        <div className="flex-1 relative">
                          <CalendarClock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={editingSlot[order.id] !== undefined ? editingSlot[order.id] : (order.deliverySlot || "")}
                            onChange={e => setEditingSlot({ ...editingSlot, [order.id]: e.target.value })}
                            placeholder="Change delivery slot…"
                            className="w-full h-9 pl-8 pr-3 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-[#0c831f] focus:ring-2 focus:ring-[#0c831f]/20"
                          />
                        </div>
                        <button
                          onClick={() => updateDeliverySlot(order.id, editingSlot[order.id] !== undefined ? editingSlot[order.id] : (order.deliverySlot || ""))}
                          disabled={updatingSlot === order.id}
                          className="h-9 px-3 bg-[#0c831f] text-white text-[11px] font-bold rounded-xl hover:bg-[#0a7019] disabled:opacity-50 shrink-0 transition-colors"
                        >
                          {updatingSlot === order.id ? "…" : "Update & Notify"}
                        </button>
                      </div>

                      <button
                        onClick={() => sendBill(order)}
                        disabled={sendingBill === order.id}
                        className="h-9 px-4 bg-blue-600 text-white text-[12px] font-bold rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 transition-colors shadow-sm"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        {sendingBill === order.id ? "Sending…" : "Send PDF Bill"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => goPage(page - 1)} disabled={page <= 1} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => goPage(page + 1)} disabled={page >= totalPages} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {toast && (
          <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-[13px] font-semibold whitespace-nowrap ${toast.type === "error" ? "bg-red-500 text-white" : "bg-[#0c831f] text-white"}`}>
            {toast.msg}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
