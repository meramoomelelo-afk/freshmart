import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ShieldCheck, Info } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface LoginSheetProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginSheet({ show, onClose, onSuccess }: LoginSheetProps) {
  const { sendOtp, verifyOtp, updateProfile } = useAuth();
  const [step, setStep] = useState<"phone" | "otp" | "name">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpChannel, setOtpChannel] = useState<"sms" | "whatsapp">("sms");
  const [smsSent, setSmsSent] = useState(true);
  const [smsError, setSmsError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const reset = () => {
    setStep("phone"); setPhone(""); setOtp(""); setName("");
    setError(""); setLoading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const formatted = phone.startsWith("+91") ? phone : `+91${phone.replace(/\D/g, "")}`;
      const res = await sendOtp(formatted);
      if (res.channel === "whatsapp") setOtpChannel("whatsapp");
      else setOtpChannel("sms");
      setSmsSent((res as any).smsSent !== false);
      setSmsError((res as any).smsError || "");
      setPhone(formatted);
      setStep("otp");
    } catch (err: any) { setError(err.message || "Failed to send OTP"); }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await verifyOtp(phone, otp);
      if (res.isNewUser) { setStep("name"); }
      else { reset(); onSuccess(); }
    } catch (err: any) { setError(err.message || "Invalid OTP"); }
    setLoading(false);
  };

  const handleSetName = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(name);
      reset(); onSuccess();
    } catch (err: any) { setError(err.message || "Failed to save name"); }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={() => { if (step === "phone") handleClose(); }}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[61] bg-white rounded-t-3xl shadow-2xl"
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="px-5 pt-2 pb-10">
              <AnimatePresence mode="wait">
                {step === "phone" && (
                  <motion.form key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSendOtp} className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h2 className="text-[20px] font-bold text-gray-900">Login or Sign up</h2>
                        <p className="text-[13px] text-gray-500 mt-0.5">Enter your mobile number to continue</p>
                      </div>
                      <button type="button" onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
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
                        className="w-full h-[52px] pl-[90px] pr-4 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[16px] font-medium focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all"
                        autoFocus
                      />
                    </div>
                    {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}
                    <button type="submit" disabled={loading || phone.replace(/\D/g, "").length < 10}
                      className="w-full h-[52px] bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[15px] rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading ? "Sending OTP..." : <><span>Continue</span><ArrowRight className="w-4 h-4" /></>}
                    </button>
                    <p className="text-[11px] text-gray-400 text-center">By continuing, you agree to our Terms of Service</p>
                  </motion.form>
                )}
                {step === "otp" && (
                  <motion.form key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h2 className="text-[20px] font-bold text-gray-900">Verify OTP</h2>
                        <p className="text-[13px] text-gray-500 mt-0.5">Sent to <span className="font-semibold text-gray-700">{phone}</span></p>
                      </div>
                      <button type="button" onClick={() => { setStep("phone"); setOtp(""); setError(""); }} className="text-[13px] text-[#0c831f] font-semibold">Change</button>
                    </div>
                    {otpChannel === "whatsapp" ? (
                      <div className="bg-[#dcf8c6] rounded-xl p-3 flex items-center gap-2.5">
                        <p className="text-[12px] text-[#075e54] font-medium">OTP sent via <span className="font-bold">WhatsApp</span></p>
                      </div>
                    ) : smsSent ? (
                      <div className="bg-[#f0fdf4] rounded-xl p-3 flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-[#0c831f] shrink-0" />
                        <p className="text-[12px] text-[#166534] font-medium">OTP sent via <span className="font-bold">SMS</span></p>
                      </div>
                    ) : (
                      <div className="bg-[#fffbeb] rounded-xl p-3 flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />
                        <p className="text-[12px] text-[#92400e] font-medium">SMS unavailable. Check Admin → Notifications for your OTP.{smsError ? ` (${smsError})` : ""}</p>
                      </div>
                    )}
                    <div className="flex gap-3 justify-center py-1">
                      {[0, 1, 2, 3].map(i => (
                        <input key={i} type="text" inputMode="numeric" maxLength={1}
                          ref={el => { otpRefs.current[i] = el; }}
                          value={otp[i] || ""}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, "");
                            const arr = otp.split("");
                            arr[i] = val;
                            setOtp(arr.join(""));
                            if (val && otpRefs.current[i + 1]) otpRefs.current[i + 1]?.focus();
                          }}
                          onKeyDown={e => { if (e.key === "Backspace" && !otp[i] && otpRefs.current[i - 1]) otpRefs.current[i - 1]?.focus(); }}
                          className="w-[60px] h-[60px] text-center text-[24px] font-bold bg-[#f7f7f7] border border-gray-200 rounded-xl focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all"
                          autoFocus={i === 0}
                        />
                      ))}
                    </div>
                    {error && <p className="text-[12px] text-red-500 font-medium text-center">{error}</p>}
                    <button type="submit" disabled={loading || otp.length < 4}
                      className="w-full h-[52px] bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[15px] rounded-xl transition-colors disabled:opacity-50">
                      {loading ? "Verifying..." : "Verify & Continue"}
                    </button>
                  </motion.form>
                )}
                {step === "name" && (
                  <motion.form key="name" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSetName} className="space-y-4">
                    <div className="mb-2">
                      <h2 className="text-[20px] font-bold text-gray-900">Welcome! 👋</h2>
                      <p className="text-[13px] text-gray-500 mt-0.5">What should we call you?</p>
                    </div>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                      className="w-full h-[52px] px-4 bg-[#f7f7f7] border border-gray-200 rounded-xl text-[16px] focus:outline-none focus:border-[#0c831f] focus:bg-white transition-all"
                      autoFocus />
                    {error && <p className="text-[12px] text-red-500 font-medium">{error}</p>}
                    <button type="submit" disabled={loading || !name.trim()}
                      className="w-full h-[52px] bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-[15px] rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading ? "Saving..." : <><span>Get Started</span><ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
