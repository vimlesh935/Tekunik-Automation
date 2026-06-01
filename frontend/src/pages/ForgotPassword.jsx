import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Loader, ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { getApiUrl } from "../services/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const otpRefs = useRef([]);

  const inputCls = "w-full h-11 rounded-lg bg-slate-50 border border-slate-200 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all";

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(getApiUrl("/api/forgot/send-otp"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setMaskedEmail(data.data?.email || email);
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Cannot connect to server. Make sure the backend is running on port 8787." : err.message);
    } finally { setLoading(false); }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value; setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpBackspace = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) { setError("Please enter all 6 digits"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(getApiUrl("/api/forgot/verify-otp"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP");
      if (!data.data?.resetToken) throw new Error("No reset token received");
      setResetToken(data.data.resetToken);
      setStep("reset");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(getApiUrl("/api/forgot/reset-password"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), resetToken, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(getApiUrl("/api/forgot/send-otp"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend OTP");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const stepTitles = { email: "Forgot Password", otp: "Verify OTP", reset: "Reset Password" };
  const stepSubtitles = {
    email: "Enter your registered email to receive OTP",
    otp: "Enter the 6-digit code sent to your email",
    reset: "Create your new secure password",
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] font-sans antialiased flex items-center justify-center p-4 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50 pointer-events-none" />

      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-4 sm:left-8 inline-flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:border-slate-300 transition group z-10"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 rounded bg-amber-400 flex items-center justify-center shadow-md">
            <Zap size={16} className="text-indigo-950 fill-indigo-950" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">
            Teku<span className="text-amber-500">nik</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
          <div className="text-center mb-7">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {success ? "Password Reset!" : stepTitles[step]}
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              {success ? "Your password has been updated" : stepSubtitles[step]}
            </p>
          </div>

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
              <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
              <p className="font-bold text-emerald-700">Password Reset Successfully!</p>
              <p className="text-emerald-600 text-sm mt-1">Redirecting to login...</p>
            </div>
          )}

          {step === "email" && !success && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Registered Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="you@example.com" className={inputCls} />
                </div>
              </div>
              {error && (
                <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
                  <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" /><span>{error}</span>
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full h-11 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-slate-950 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-[0.98] disabled:pointer-events-none shadow-sm">
                {loading ? <><Loader size={16} className="animate-spin" /> Sending OTP...</> : <><Mail size={15} /> Send OTP</>}
              </button>
              <p className="text-center text-sm text-slate-500">
                Remember your password?{" "}
                <button type="button" onClick={() => navigate("/login")} className="text-blue-600 hover:text-blue-700 font-bold transition-colors">Sign In</button>
              </p>
            </form>
          )}

          {step === "otp" && !success && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {maskedEmail && (
                <div className="text-center text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg py-2.5 px-4">
                  OTP sent to {maskedEmail}
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 text-center">Enter 6-digit OTP</label>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <input key={index} ref={(el) => (otpRefs.current[index] = el)} type="text" maxLength="1" value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpBackspace(index, e)}
                      placeholder="·"
                      className="w-11 h-12 text-center text-lg font-bold rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  ))}
                </div>
              </div>
              {error && (
                <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
                  <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" /><span>{error}</span>
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full h-11 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-slate-950 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-[0.98] disabled:pointer-events-none shadow-sm">
                {loading ? <><Loader size={16} className="animate-spin" /> Verifying...</> : "Verify OTP"}
              </button>
              <div className="flex items-center justify-center gap-4 text-sm">
                <button type="button" onClick={handleResendOtp} disabled={loading} className="text-blue-600 hover:text-blue-700 font-semibold transition-colors disabled:opacity-40">Resend OTP</button>
                <span className="text-slate-300">|</span>
                <button type="button" onClick={() => { setStep("email"); setError(""); setOtp(["", "", "", "", "", ""]); }} className="text-slate-500 hover:text-slate-700 font-semibold transition-colors">Change Email</button>
              </div>
            </form>
          )}

          {step === "reset" && !success && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(""); }} placeholder="Min 6 characters"
                    className="w-full h-11 rounded-lg bg-slate-50 border border-slate-200 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }} placeholder="Confirm password"
                    className="w-full h-11 rounded-lg bg-slate-50 border border-slate-200 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
                  <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" /><span>{error}</span>
                </div>
              )}
              <button type="submit" disabled={loading}
                className="w-full h-11 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-slate-950 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-[0.98] disabled:pointer-events-none shadow-sm">
                {loading ? <><Loader size={16} className="animate-spin" /> Resetting...</> : "Reset Password"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-5 text-xs text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} Tekunik. All rights reserved.
        </p>
      </div>
    </div>
  );
}
