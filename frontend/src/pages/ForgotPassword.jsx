import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Loader,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Zap,
} from "lucide-react";
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

  const inputCls =
    "w-full h-12 rounded-xl bg-slate-950 border border-slate-800 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all duration-300";
  const passwordInputCls =
    "w-full h-12 rounded-xl bg-slate-950 border border-slate-800 pl-11 pr-12 text-sm text-white placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all duration-300";
  const labelCls =
    "block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2";
  const iconCls =
    "absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-600 transition-colors duration-300 pointer-events-none";
  const buttonCls =
    "w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:pointer-events-none shadow-[0_4px_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]";
  const errorCls =
    "flex items-start gap-3 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium";
  const secondaryLinkCls =
    "text-indigo-600 hover:text-indigo-400 font-bold transition-colors duration-300 underline underline-offset-4 decoration-indigo-600/30";

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl("/api/forgot/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setMaskedEmail(data.data?.email || email);
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to server. Make sure the backend is running on port 8787."
          : err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpBackspace = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl("/api/forgot/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP");
      if (!data.data?.resetToken) throw new Error("No reset token received");
      setResetToken(data.data.resetToken);
      setStep("reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl("/api/forgot/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          resetToken,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl("/api/forgot/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend OTP");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = {
    email: "Forgot Password",
    otp: "Verify OTP",
    reset: "Reset Password",
  };
  const stepSubtitles = {
    email: "Enter your registered email to receive OTP",
    otp: "Enter the 6-digit code sent to your email",
    reset: "Create your new secure password",
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased flex items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-600 selection:text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-amber-400/5 rounded-full blur-[100px] pointer-events-none" />

      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-4 sm:left-8 inline-flex items-center gap-2 bg-slate-900 border border-slate-800 shadow-xl rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white hover:border-indigo-600 hover:bg-slate-900 transition-all duration-300 group z-10"
      >
        <ArrowLeft
          size={15}
          className="group-hover:-translate-x-1 transition-transform duration-300 text-indigo-600"
        />
        Back
      </button>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)] transform hover:rotate-12 transition-transform duration-300">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            Tek
            <span className="text-indigo-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              Node
            </span>
          </span>
        </div>

        <div className="relative group/card">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-slate-800 via-indigo-600/40 to-slate-800 rounded-2xl opacity-70 group-hover/card:opacity-100 transition duration-500" />

          <div className="relative bg-slate-900 rounded-2xl p-8 sm:p-10 shadow-2xl border border-slate-800/50">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {success ? "Password Reset!" : stepTitles[step]}
              </h1>
              <p className="text-slate-400 text-sm mt-2 font-medium">
                {success
                  ? "Your password has been updated"
                  : stepSubtitles[step]}
              </p>
            </div>

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
                  <CheckCircle size={24} className="text-emerald-400" />
                </div>
                <p className="font-bold text-emerald-400 text-lg">
                  Password Reset Successfully!
                </p>
                <p className="text-emerald-400/70 text-sm mt-1">
                  Redirecting to login...
                </p>
              </div>
            )}

            {step === "email" && !success && (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label className={labelCls}>Registered Email</label>
                  <div className="relative group/input">
                    <Mail size={16} className={iconCls} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="you@example.com"
                      className={inputCls}
                      autoComplete="email"
                    />
                  </div>
                </div>
                {error && (
                  <div className={errorCls}>
                    <AlertTriangle
                      size={16}
                      className="mt-0.5 flex-shrink-0 text-red-400"
                    />
                    <span>{error}</span>
                  </div>
                )}
                <button type="submit" disabled={loading} className={buttonCls}>
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin text-white" />{" "}
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Mail size={15} /> Send OTP
                    </>
                  )}
                </button>
                <p className="text-center text-sm text-slate-400 pt-2">
                  Remember your password?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className={secondaryLinkCls}
                  >
                    Sign In
                  </button>
                </p>
              </form>
            )}

            {step === "otp" && !success && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {maskedEmail && (
                  <div className="text-center text-sm font-semibold text-indigo-400 bg-indigo-600/10 border border-indigo-600/20 rounded-xl py-3 px-4">
                    OTP sent to {maskedEmail}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
                    Enter 6-digit OTP
                  </label>
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpBackspace(index, e)}
                        placeholder="·"
                        className="w-11 h-12 text-center text-lg font-bold rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all duration-300"
                      />
                    ))}
                  </div>
                </div>
                {error && (
                  <div className={errorCls}>
                    <AlertTriangle
                      size={16}
                      className="mt-0.5 flex-shrink-0 text-red-400"
                    />
                    <span>{error}</span>
                  </div>
                )}
                <button type="submit" disabled={loading} className={buttonCls}>
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin text-white" />{" "}
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </button>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-indigo-600 hover:text-indigo-400 font-semibold transition-colors duration-300 disabled:opacity-40"
                  >
                    Resend OTP
                  </button>
                  <span className="text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setError("");
                      setOtp(["", "", "", "", "", ""]);
                    }}
                    className="text-slate-400 hover:text-white font-semibold transition-colors duration-300"
                  >
                    Change Email
                  </button>
                </div>
              </form>
            )}

            {step === "reset" && !success && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className={labelCls}>New Password</label>
                  <div className="relative group/input">
                    <Lock size={16} className={iconCls} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Min 8 characters"
                      className={passwordInputCls}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors duration-300"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Confirm New Password</label>
                  <div className="relative group/input">
                    <Lock size={16} className={iconCls} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Confirm password"
                      className={passwordInputCls}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors duration-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className={errorCls}>
                    <AlertTriangle
                      size={16}
                      className="mt-0.5 flex-shrink-0 text-red-400"
                    />
                    <span>{error}</span>
                  </div>
                )}
                <button type="submit" disabled={loading} className={buttonCls}>
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin text-white" />{" "}
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-slate-500 font-medium tracking-wide">
          &copy; {new Date().getFullYear()} Tek Node. Secure Core System
          Architecture.
        </p>
      </div>
    </div>
  );
}
