import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Zap, Eye, EyeOff, ShieldCheck, KeyRound, Mail } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { useStoreConfig } from "@/lib/store-config";

type Mode = "login" | "setup" | "forgot" | "reset";

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[0-9]/.test(password) || /[^a-zA-Z0-9]/.test(password),
    password.length >= 12,
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Strong"];
  const colors = ["", "bg-red-400", "bg-yellow-400", "bg-green-500"];
  if (!password) return null;
  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score] : "bg-gray-200"}`} />
        ))}
      </div>
      <p className={`text-[11px] ${score === 1 ? "text-red-500" : score === 2 ? "text-yellow-600" : "text-green-600"}`}>
        {labels[score]} — must be 8+ chars with a number or special character
      </p>
    </div>
  );
}

export function AdminLogin() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ username: "", password: "", displayName: "", email: "" });
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { config: storeConfig, ready: configReady } = useStoreConfig();
  const storeName = storeConfig.storeName || "Admin";

  useEffect(() => {
    adminApi.me().then(() => setLocation("/admin")).catch(() => {});
    adminApi.checkSetup()
      .then(d => { if (d.needsSetup) setMode("setup"); })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      await adminApi.login({ username: form.username, password: form.password });
      setLocation("/admin");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (!form.displayName) { setError("Display name is required"); setLoading(false); return; }
      if (!form.email) { setError("Email is required"); setLoading(false); return; }
      await adminApi.setup({
        username: form.username,
        password: form.password,
        displayName: form.displayName,
        email: form.email,
      });
      setLocation("/admin");
    } catch (err: any) {
      setError(err.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const result = await adminApi.forgotPassword(form.email);
      setSuccess(result.message || "If that email is registered, a reset token was generated. Check your server logs.");
      if (result.devToken) {
        setResetToken(result.devToken);
        setMode("reset");
      }
    } catch (err: any) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const result = await adminApi.resetPassword(resetToken, newPassword);
      setSuccess(result.message || "Password reset! Please log in.");
      setResetToken("");
      setNewPassword("");
      setTimeout(() => { setMode("login"); setSuccess(""); }, 2500);
    } catch (err: any) {
      setError(err.message || "Reset failed");
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

  const titles: Record<Mode, string> = {
    login: "Admin Login",
    setup: "Create Admin Account",
    forgot: "Forgot Password",
    reset: "Reset Password",
  };

  const subtitles: Record<Mode, string> = {
    login: "Sign in to manage your store",
    setup: "Set up your admin account to get started",
    forgot: "Enter your email to receive a reset token",
    reset: "Enter the reset token and your new password",
  };

  return (
    <div className="min-h-screen bg-[#f2f3f5] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-[#0c831f] rounded-xl p-2">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <span className="text-[#0c831f] font-extrabold text-2xl tracking-tight">{storeName}</span>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            {mode === "login" && <ShieldCheck className="w-5 h-5 text-[#0c831f]" />}
            {mode === "setup" && <ShieldCheck className="w-5 h-5 text-[#0c831f]" />}
            {mode === "forgot" && <Mail className="w-5 h-5 text-[#0c831f]" />}
            {mode === "reset" && <KeyRound className="w-5 h-5 text-[#0c831f]" />}
            <h1 className="text-[20px] font-bold text-gray-900">{titles[mode]}</h1>
          </div>
          <p className="text-[13px] text-gray-500 mb-6">{subtitles[mode]}</p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-[13px] text-red-600 font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-[13px] text-green-700 font-medium">{success}</p>
            </div>
          )}

          {(mode === "login" || mode === "setup") && (
            <form onSubmit={mode === "setup" ? handleSetup : handleLogin} className="space-y-4">
              {mode === "setup" && (
                <>
                  <div>
                    <label className="text-[13px] font-medium text-gray-700 block mb-1.5">Display Name</label>
                    <input
                      type="text"
                      value={form.displayName}
                      onChange={e => setForm({ ...form, displayName: e.target.value })}
                      className="w-full h-11 px-4 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all"
                      placeholder="Your name"
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-gray-700 block mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full h-11 px-4 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all"
                      placeholder="admin@example.com"
                      required
                      autoComplete="email"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Used to recover your account if you forget the password</p>
                  </div>
                </>
              )}

              <div>
                <label className="text-[13px] font-medium text-gray-700 block mb-1.5">Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full h-11 px-4 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all"
                  placeholder={mode === "setup" ? "admin" : "Enter username"}
                  required
                  autoComplete="username"
                />
                {mode === "setup" && (
                  <p className="text-[11px] text-gray-400 mt-1">Letters, numbers, _ . - only (3–50 chars)</p>
                )}
              </div>

              <div>
                <label className="text-[13px] font-medium text-gray-700 block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full h-11 px-4 pr-11 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all"
                    placeholder={mode === "setup" ? "Min 8 chars + number/symbol" : "Enter password"}
                    required
                    minLength={mode === "setup" ? 8 : 1}
                    autoComplete={mode === "setup" ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === "setup" && <PasswordStrengthBar password={form.password} />}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[15px] rounded-xl transition-colors disabled:opacity-60"
              >
                {loading ? "Please wait…" : mode === "setup" ? "Create Secure Account" : "Sign In"}
              </button>

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
                  className="w-full text-center text-[13px] text-[#0c831f] hover:underline mt-1"
                >
                  Forgot password?
                </button>
              )}
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-[13px] font-medium text-gray-700 block mb-1.5">Admin Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full h-11 px-4 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all"
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <p className="text-[12px] text-blue-700">
                  A one-time reset token will be generated and printed to your <strong>server logs</strong>. You will need access to the server console to retrieve it.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[15px] rounded-xl transition-colors disabled:opacity-60"
              >
                {loading ? "Generating token…" : "Send Reset Token"}
              </button>

              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                className="w-full text-center text-[13px] text-gray-500 hover:text-gray-700 mt-1"
              >
                ← Back to login
              </button>

              {success && (
                <button
                  type="button"
                  onClick={() => { setMode("reset"); setError(""); setSuccess(""); }}
                  className="w-full h-11 border-2 border-[#0c831f] text-[#0c831f] font-bold text-[14px] rounded-xl hover:bg-green-50 transition-colors"
                >
                  I have my token → Enter it now
                </button>
              )}
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-[13px] font-medium text-gray-700 block mb-1.5">Reset Token</label>
                <input
                  type="text"
                  value={resetToken}
                  onChange={e => setResetToken(e.target.value.trim())}
                  className="w-full h-11 px-4 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] font-mono focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all"
                  placeholder="Paste the token from server logs"
                  required
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="text-[13px] font-medium text-gray-700 block mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full h-11 px-4 pr-11 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all"
                    placeholder="Min 8 chars + number/symbol"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthBar password={newPassword} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[15px] rounded-xl transition-colors disabled:opacity-60"
              >
                {loading ? "Resetting…" : "Reset Password"}
              </button>

              <button
                type="button"
                onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
                className="w-full text-center text-[13px] text-gray-500 hover:text-gray-700 mt-1"
              >
                ← Request a new token
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[12px] text-gray-400 mt-6">
          <a href="/" className="hover:text-[#0c831f] transition-colors">← Back to store</a>
        </p>
      </div>
    </div>
  );
}
