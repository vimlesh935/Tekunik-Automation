import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Lock,
  Mail,
  Loader,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { getApiUrl } from "../services/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !secretKey.trim()) {
      setError("Please enter both email and secret key");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl("/api/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          secretKey: secretKey.trim(),
        }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server is offline or unreachable");
      }
      if (!res.ok) {
        if (res.status === 0 || res.status === 502 || res.status === 503)
          throw new Error(
            "Server is offline. Please ensure the backend server is running on port 8787.",
          );
        throw new Error(data.message || "Invalid credentials");
      }
      const adminToken = data.data?.token;
      if (adminToken) {
        localStorage.setItem("authToken", adminToken);
        window.location.href = "/admin/dashboard";
      } else {
        throw new Error("No token received from server");
      }
    } catch (err) {
      setError(
        err.message === "Failed to fetch" || err.name === "TypeError"
          ? "Cannot connect to server. Make sure the backend is running on port 8787."
          : err.message || "Authentication failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased flex items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-600 selection:text-white">
      {/* ── High-Tech Ambient Matrix Layers ─────────────────────────── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-amber-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-4 sm:left-8 inline-flex items-center gap-2 bg-slate-900 border border-slate-800 shadow-xl rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white hover:border-indigo-600 hover:bg-slate-900 transition-all duration-300 group z-10"
      >
        <ArrowLeft
          size={15}
          className="group-hover:-translate-x-1 transition-transform duration-300 text-indigo-600"
        />
        Back
      </button>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Brand Architecture Header */}
        <div className="flex items-center justify-center gap-2.5 mb-8 animate-[fadeIn_0.5s_ease-out]">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)] transform hover:rotate-12 transition-transform duration-300">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white tracking-tight">
              Tek
              <span className="text-indigo-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                Node
              </span>
            </span>
            <span className="text-[10px] font-black bg-amber-400/10 border border-amber-400/30 text-indigo-200 px-2 py-0.5 rounded-md uppercase tracking-widest">
              Admin Node
            </span>
          </div>
        </div>

        {/* Secure Authorization Card Container */}
        <div className="relative group/card animate-[fadeIn_0.6s_ease-out]">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-slate-800 via-indigo-600/40 to-slate-800 rounded-2xl opacity-70 group-hover/card:opacity-100 transition duration-500" />

          <div className="relative bg-slate-900 rounded-2xl p-8 sm:p-10 shadow-2xl border border-slate-800/50">
            <div className="text-center mb-8">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.1)]">
                <Shield size={24} className="text-indigo-400" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Terminal Gateway
              </h1>
              <p className="text-slate-400 text-sm mt-2 font-medium">
                Restricted to authorized root operators
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium mb-5">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 flex-shrink-0 text-red-400"
                />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Operator Email
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
                    placeholder="admin@teknode.com"
                    className="w-full h-12 rounded-xl bg-slate-950 border border-slate-800 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all duration-300"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  System Secret Key
                </label>
                <div className="relative group/input">
                  <Lock
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-600 transition-colors duration-300"
                  />
                  <input
                    type={showKey ? "text" : "password"}
                    value={secretKey}
                    onChange={(e) => {
                      setSecretKey(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter production access key"
                    className="w-full h-12 rounded-xl bg-slate-950 border border-slate-800 pl-11 pr-12 text-sm text-white placeholder:text-slate-600 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all duration-300"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors duration-300"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Action Button via Indigo-600 with Amber Hover Glow Micro-Highlight */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:pointer-events-none shadow-[0_4px_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] mt-2"
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin text-white" />
                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    <Shield size={16} />
                    Authorize Secure Access
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-slate-500 font-medium tracking-wide">
          &copy; {new Date().getFullYear()} Tek Node Systems. Secure Core System
          Architecture.
        </p>
      </div>
    </div>
  );
}
