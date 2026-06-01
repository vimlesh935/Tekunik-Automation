import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Loader, ArrowLeft, CheckCircle, Eye, EyeOff, AlertTriangle, Zap } from "lucide-react";
import { authService } from "../services/api";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email"); return; }
    if (!password) { setError("Please enter your password"); return; }
    setLoading(true);
    setError("");
    try {
      const data = await authService.login(email.trim(), password);
      const token = data.data?.token;
      if (!token) throw new Error("No token received from server");
      onLogin(token);
      setSuccess(true);
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
        {/* Brand mark */}
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Sign in to your account</p>
          </div>

          {success ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
              <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
              <p className="font-bold text-emerald-700">Login Successful!</p>
              <p className="text-emerald-600 text-sm mt-1">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="you@example.com"
                    className="w-full h-11 rounded-lg bg-slate-50 border border-slate-200 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-bold text-slate-700">Password</label>
                  <button type="button" onClick={() => navigate("/forgot-password")} className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Enter your password"
                    className="w-full h-11 rounded-lg bg-slate-50 border border-slate-200 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
                  <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-slate-950 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-[0.98] disabled:pointer-events-none shadow-sm"
              >
                {loading ? <><Loader size={16} className="animate-spin" /> Signing in...</> : "Sign In"}
              </button>

              <p className="text-center text-sm text-slate-500 pt-1">
                Don't have an account?{" "}
                <button type="button" onClick={() => navigate("/register")} className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                  Register Here
                </button>
              </p>
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
