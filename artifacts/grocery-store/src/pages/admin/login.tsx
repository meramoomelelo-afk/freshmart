import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Zap, Eye, EyeOff } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { useStoreConfig } from "@/lib/store-config";

export function AdminLogin() {
  const [, setLocation] = useLocation();
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [form, setForm] = useState({ username: "", password: "", displayName: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { config: storeConfig, ready: configReady } = useStoreConfig();
  const storeName = storeConfig.storeName || "";

  useEffect(() => {
    adminApi.me().then(() => setLocation("/admin")).catch(() => {});
    adminApi.checkSetup().then(d => setNeedsSetup(d.needsSetup)).catch(() => setNeedsSetup(null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (needsSetup) {
        if (!form.displayName) { setError("Display name is required"); setLoading(false); return; }
        await adminApi.setup({ username: form.username, password: form.password, displayName: form.displayName });
      } else {
        await adminApi.login({ username: form.username, password: form.password });
      }
      setLocation("/admin");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (!configReady && !storeName) {
    return (
      <div className="min-h-screen bg-[#f2f3f5] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#0c831f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-[#0c831f] rounded-xl p-2">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <span className="text-[#0c831f] font-extrabold text-2xl tracking-tight">
            {storeName}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h1 className="text-[20px] font-bold text-gray-900 mb-1">
            {needsSetup ? "Create Admin Account" : "Admin Login"}
          </h1>
          <p className="text-[13px] text-gray-500 mb-6">
            {needsSetup ? "Set up your admin account to manage the store" : "Sign in to the admin panel"}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-[13px] text-red-600 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {needsSetup && (
              <div>
                <label className="text-[13px] font-medium text-gray-700 block mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={e => setForm({ ...form, displayName: e.target.value })}
                  className="w-full h-11 px-4 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all"
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-[13px] font-medium text-gray-700 block mb-1.5">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full h-11 px-4 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="text-[13px] font-medium text-gray-700 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full h-11 px-4 pr-11 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all"
                  placeholder="Enter password"
                  required
                  minLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[15px] rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? "Please wait..." : needsSetup ? "Create Account" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-gray-400 mt-6">
          <a href="/" className="hover:text-[#0c831f] transition-colors">← Back to store</a>
        </p>
      </div>
    </div>
  );
}
