import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Loader,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { authService } from "../services/api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await authService.login(email.trim(), password);
      const token = data.data?.token;
      if (!token) throw new Error("No token received from server");
      login(token);
      setSuccess(true);
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased flex items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-600 selection:text-white">
      {/* Background Micro-Highlights & Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-amber-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Back Button */}
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
        {/* Brand Mark with Amber Highlight */}
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

        {/* Auth Card Container */}
        <div className="relative group/card">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-slate-800 via-indigo-600/40 to-slate-800 rounded-2xl opacity-70 group-hover/card:opacity-100 transition duration-500" />

          <div className="relative bg-slate-900 rounded-2xl p-8 sm:p-10 shadow-2xl border border-slate-800/50">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Welcome Back
              </h1>
              <p className="text-slate-400 text-sm mt-2 font-medium">
                Sign in to secure your sessions
              </p>
            </div>

            {success ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
                  <CheckCircle size={24} className="text-emerald-400" />
                </div>
                <p className="font-bold text-emerald-400 text-lg">
                  Login Successful!
                </p>
                <p className="text-emerald-400/70 text-sm mt-1">
                  Redirecting to platform core dashboard...
                </p>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Email Address
                  </label>
                  <div className="relative group/input">
                    <Mail
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-600 transition-colors duration-300"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="you@example.com"
                      className="w-full h-12 rounded-xl bg-slate-950 border border-slate-800 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all duration-300"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-400 transition-colors duration-300"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative group/input">
                    <Lock
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-600 transition-colors duration-300"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="••••••••••••"
                      className="w-full h-12 rounded-xl bg-slate-950 border border-slate-800 pl-11 pr-12 text-sm text-white placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all duration-300"
                      autoComplete="current-password"
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

                {error && (
                  <div className="flex items-start gap-3 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                    <AlertTriangle
                      size={16}
                      className="mt-0.5 flex-shrink-0 text-red-400"
                    />
                    <span>{error}</span>
                  </div>
                )}

                {/* Primary Button via Indigo-600 with Amber Micro-Highlight Ring Border on Hover */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:pointer-events-none shadow-[0_4px_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin text-white" />
                      Authenticating...
                    </>
                  ) : (
                    "Sign In to Account"
                  )}
                </button>

                <p className="text-center text-sm text-slate-400 pt-2">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="text-indigo-600 hover:text-indigo-400 font-bold transition-colors duration-300 underline underline-offset-4 decoration-indigo-600/30"
                  >
                    Register Here
                  </button>
                </p>
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
