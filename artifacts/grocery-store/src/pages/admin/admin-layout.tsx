import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, Grid3X3, ShoppingBag, Settings, LogOut, Menu, X, Zap, ChevronRight, Tag } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { useStoreConfig } from "@/lib/store-config";

interface AdminLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/products", icon: Package, label: "Products" },
  { href: "/admin/categories", icon: Grid3X3, label: "Categories" },
  { href: "/admin/orders", icon: ShoppingBag, label: "Orders" },
  { href: "/admin/coupons", icon: Tag, label: "Coupons" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState<any>(null);
  const { config: storeConfig } = useStoreConfig();
  const storeName = storeConfig.storeName || "Store";

  useEffect(() => {
    adminApi.me().then(d => setAdmin(d.user)).catch(() => setLocation("/admin/login"));
  }, []);

  const handleLogout = async () => {
    await adminApi.logout();
    setLocation("/admin/login");
  };

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      <div
        className={`fixed inset-0 bg-black/30 z-40 md:hidden transition-opacity ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`fixed md:sticky top-0 left-0 z-50 h-screen w-[260px] bg-white border-r border-gray-200 flex flex-col transition-transform md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 px-5 flex items-center justify-between border-b border-gray-100">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="bg-[#0c831f] rounded-lg p-1.5">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <span className="text-[#0c831f] font-extrabold text-[15px]">{storeName.toLowerCase()}</span>
              <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded ml-1.5">ADMIN</span>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = location === href || (href !== "/admin" && location.startsWith(href));
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all ${active ? "bg-[#0c831f] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}>
                  <Icon className="w-[18px] h-[18px]" />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 text-[13px] text-gray-500 hover:text-[#0c831f] hover:bg-gray-50 rounded-lg transition-colors mb-1">
            <ChevronRight className="w-4 h-4" /> View Store
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 rounded-lg transition-colors w-full"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
          <div className="px-3 py-2 mt-1">
            <p className="text-[12px] font-semibold text-gray-700">{admin.displayName}</p>
            <p className="text-[11px] text-gray-400">@{admin.username}</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 md:px-6 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg mr-3">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1" />
          <span className="text-[12px] text-gray-400 hidden sm:block">{storeName} Admin Panel</span>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
