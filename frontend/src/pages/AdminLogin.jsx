import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Mail, Loader, ArrowLeft, Eye, EyeOff, AlertTriangle, Zap } from "lucide-react";
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
        body: JSON.stringify({ email: email.trim(), secretKey: secretKey.trim() }),
      });
      let data;
      try { data = await res.json(); } catch { throw new Error("Server is offline or unreachable"); }
      if (!res.ok) {
        if (res.status === 0 || res.status === 502 || res.status === 503) throw new Error("Server is offline. Please ensure the backend server is running on port 8787.");
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
      setError(err.message === "Failed to fetch" || err.name === "TypeError"
        ? "Cannot connect to server. Make sure the backend is running on port 8787."
        : err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] font-sans antialiased flex items-center justify-center p-4 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50 pointer-events-none" />

      <button
        onClick={() => navigate("/")}
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
            <span className="ml-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Admin</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
          <div className="text-center mb-7">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
              <Shield size={22} className="text-indigo-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Access</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Authorized personnel only</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium mb-5">
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="admin@tekunik.com"
                  className="w-full h-11 rounded-lg bg-slate-50 border border-slate-200 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Secret Key</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showKey ? "text" : "password"}
                  value={secretKey}
                  onChange={(e) => { setSecretKey(e.target.value); setError(""); }}
                  placeholder="Enter secret key"
                  className="w-full h-11 rounded-lg bg-slate-50 border border-slate-200 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  autoComplete="off"
                />
                <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-[0.98] disabled:pointer-events-none shadow-sm"
            >
              {loading ? <><Loader size={16} className="animate-spin" /> Verifying...</> : <><Shield size={15} /> Access Panel</>}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-xs text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} Tekunik Systems. Restricted Access.
        </p>
      </div>
    </div>
  );
}
