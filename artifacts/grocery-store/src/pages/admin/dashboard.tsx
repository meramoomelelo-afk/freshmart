import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Package, Grid3X3, ShoppingBag, IndianRupee, TrendingUp, Clock, ChevronRight, Eye } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { AdminLayout } from "./admin-layout";

export function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded-lg" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white rounded-xl border border-gray-100" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const stats = [
    { label: "Total Products", value: data?.products ?? 0, icon: Package, color: "#0c831f", bg: "#e6f4ea", link: "/admin/products" },
    { label: "Categories", value: data?.categories ?? 0, icon: Grid3X3, color: "#7c3aed", bg: "#f3eeff", link: "/admin/categories" },
    { label: "Total Orders", value: data?.orders ?? 0, icon: ShoppingBag, color: "#ea580c", bg: "#fff0ea", link: "/admin/orders" },
    { label: "Revenue", value: `₹${(data?.revenue ?? 0).toLocaleString()}`, icon: IndianRupee, color: "#0369a1", bg: "#e0f0ff", link: "/admin/orders" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Dashboard</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Overview of your store</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg, link }) => (
            <Link key={label} href={link}>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-[22px] font-bold text-gray-900">{value}</p>
                <p className="text-[12px] text-gray-500 mt-0.5">{label}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="flex items-center gap-1 text-[12px] font-bold text-[#0c831f] hover:underline">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {data?.recentOrders?.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {data.recentOrders.map((order: any) => (
                <Link key={order.id} href="/admin/orders">
                  <div className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{order.name}</p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                        order.status === "placed" ? "bg-blue-50 text-blue-600" :
                        order.status === "confirmed" ? "bg-yellow-50 text-yellow-700" :
                        order.status === "delivered" ? "bg-green-50 text-green-600" :
                        order.status === "cancelled" ? "bg-red-50 text-red-600" :
                        "bg-gray-50 text-gray-600"
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace("_", " ")}
                      </span>
                      <span className="text-[14px] font-bold text-gray-900">₹{order.total}</span>
                      <Eye className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-[14px]">No orders yet</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
