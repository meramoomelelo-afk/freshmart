import { useState } from "react";
import { useLocation } from "wouter";
import { Phone, ArrowRight, ShieldCheck, Clock, Truck, Zap, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useStoreConfig } from "@/lib/store-config";

const DEFAULT_BADGES = [
  { icon: "clock", label: "10 min delivery" },
  { icon: "shield", label: "Secure payments" },
  { icon: "truck", label: "Free delivery ₹299+" },
];

const BADGE_ICONS: Record<string, any> = { clock: Clock, shield: ShieldCheck, truck: Truck };

export function Login() {
  const [, setLocation] = useLocation();
  const { sendOtp, verifyOtp, updateProfile } = useAuth();
  const { config: storeConfig, ready: configReady } = useStoreConfig();

  const storeName = storeConfig.storeName || "";
  const tagline = storeConfig.footerText || "Groceries delivered to your doorstep";
  const badges = (storeConfig.loginBadges && storeConfig.loginBadges.length > 0) ? storeConfig.loginBadges : DEFAULT_BADGES;

  const [step, setStep] = useState<"phone" | "otp" | "name">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [otpChannel, setOtpChannel] = useState<"sms" | "whatsapp">("sms");
  const [smsSent, setSmsSent] = useState(true);
  const [smsError, setSmsError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone.replace(/\D/g, "")}`;
      const res = await sendOtp(formattedPhone);
      if (res.channel === "whatsapp") setOtpChannel("whatsapp");
      else setOtpChannel("sms");
      setSmsSent(res.smsSent !== false);
      setSmsError((res as any).smsError || "");
      setPhone(formattedPhone);
      setStep("otp");
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await verifyOtp(phone, otp);
      if (res.isNewUser) {
        setIsNewUser(true);
        setStep("name");
      } else {
        setLocation("/account");
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleSetName = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(name);
      setLocation("/account");
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (!configReady && !storeName) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#0c831f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-black/5 overflow-hidden"
        >
          <div className="bg-gradient-to-br from-[#0c831f] to-[#0a6f1a] p-6 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-[22px] font-bold text-white">{storeName.toLowerCase()}</h1>
            <p className="text-white/80 text-[13px] mt-1">{tagline}</p>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {step === "phone" && (
                <motion.form
                  key="phone"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSendOtp}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-[18px] font-bold text-gray-900">Login or Sign up</h2>
                    <p className="text-[13px] text-gray-500 mt-1">Enter your phone number to continue</p>
                  </div>

                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[14px] font-medium text-gray-600 border-r border-gray-200 pr-2.5">
                      <span className="text-[16px]">🇮🇳</span> +91
                    </div>
                    <input
                      type="tel"
                      value={phone.replace("+91", "")}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="Enter mobile number"
                      className="w-full h-12 pl-[88px] pr-4 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[15px] font-medium focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all"
                      autoFocus
                    />
                  </div>

                  {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading || phone.replace(/\D/g, "").length < 10}
                    className="w-full h-12 bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[15px] rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? "Sending..." : <>Continue <ArrowRight className="w-4 h-4" /></>}
                  </button>

                  <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                  </p>
                </motion.form>
              )}

              {step === "otp" && (
                <motion.form
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleVerifyOtp}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-[18px] font-bold text-gray-900">Verify OTP</h2>
                    <p className="text-[13px] text-gray-500 mt-1">
                      Enter the 4-digit code sent to <span className="font-semibold text-gray-700">{phone}</span>
                    </p>
                  </div>

                  {otpChannel === "whatsapp" ? (
                    <div className="bg-[#dcf8c6] rounded-xl p-3 flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-[#25d366] shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.467l4.584-1.472A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.18-.693-5.82-1.87l-.418-.249-2.718.873.888-2.643-.273-.434A9.785 9.785 0 012.182 12c0-5.418 4.4-9.818 9.818-9.818 5.418 0 9.818 4.4 9.818 9.818 0 5.418-4.4 9.818-9.818 9.818z"/></svg>
                      <p className="text-[12px] text-[#075e54] font-medium">
                        OTP sent via <span className="font-bold">WhatsApp</span> — check your messages
                      </p>
                    </div>
                  ) : smsSent ? (
                    <div className="bg-[#f0fdf4] rounded-xl p-3 flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-[#0c831f] shrink-0" />
                      <p className="text-[12px] text-[#166534] font-medium">
                        OTP sent via <span className="font-bold">SMS</span> to your phone
                      </p>
                    </div>
                  ) : (
                    <div className="bg-[#fffbeb] rounded-xl p-3 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[12px] text-[#92400e] font-medium">
                          SMS could not be delivered. Your OTP is in the Admin panel under Notifications.
                        </p>
                        {smsError && (
                          <p className="text-[11px] text-[#b45309] mt-1">
                            Reason: {smsError}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 justify-center">
                    {[0, 1, 2, 3].map(i => (
                      <input
                        key={i}
                        type="text"
                        maxLength={1}
                        value={otp[i] || ""}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, "");
                          const newOtp = otp.split("");
                          newOtp[i] = val;
                          setOtp(newOtp.join(""));
                          if (val && e.target.nextElementSibling) {
                            (e.target.nextElementSibling as HTMLInputElement).focus();
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === "Backspace" && !otp[i] && e.currentTarget.previousElementSibling) {
                            (e.currentTarget.previousElementSibling as HTMLInputElement).focus();
                          }
                        }}
                        className="w-14 h-14 text-center text-[22px] font-bold bg-[#f7f7f7] border border-gray-200 rounded-xl focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all"
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>

                  {error && <p className="text-[12px] text-red-500 font-medium text-center">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading || otp.length < 4}
                    className="w-full h-12 bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[15px] rounded-xl transition-colors disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify & Login"}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                    className="w-full text-[13px] text-[#0c831f] font-semibold hover:underline"
                  >
                    Change Phone Number
                  </button>
                </motion.form>
              )}

              {step === "name" && (
                <motion.form
                  key="name"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSetName}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-[18px] font-bold text-gray-900">Welcome to {storeName}!</h2>
                    <p className="text-[13px] text-gray-500 mt-1">What should we call you?</p>
                  </div>

                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full h-12 px-4 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[15px] focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all"
                    autoFocus
                  />

                  {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="w-full h-12 bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[15px] rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? "Saving..." : <>Get Started <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="flex justify-center gap-6 mt-6">
          {badges.map(({ icon, label }) => {
            const Icon = BADGE_ICONS[icon] || Clock;
            return (
              <div key={label} className="flex items-center gap-1.5 text-gray-400">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
