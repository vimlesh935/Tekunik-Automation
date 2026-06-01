import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Loader, ArrowLeft, User, Lock, Phone, MapPin, Eye, EyeOff, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { authService } from "../services/api";

export default function Register({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", password: "", confirm_password: "",
    phone: "", age: "", address: "", city: "", pincode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateField = (field, value) => { setForm((prev) => ({ ...prev, [field]: value })); setError(""); };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) { setError("Email is required"); return; }
    if (!form.first_name.trim() || !form.last_name.trim()) { setError("First and last name are required"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (form.password !== form.confirm_password) { setError("Passwords do not match"); return; }
    if (!form.phone.trim()) { setError("Phone number is required"); return; }
    if (!form.age || isNaN(form.age) || form.age < 18) { setError("You must be at least 18 years old"); return; }
    if (!form.address.trim() || !form.city.trim() || !form.pincode.trim()) { setError("Address, city, and pincode are required"); return; }

    setLoading(true);
    setError("");
    try {
      await authService.register({
        email: form.email.trim(), first_name: form.first_name.trim(), last_name: form.last_name.trim(),
        password: form.password, phone: form.phone.trim(), age: form.age,
        address: form.address.trim(), city: form.city.trim(), pincode: form.pincode.trim(),
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message === "Failed to fetch"
        ? "Cannot connect to server. Make sure the backend is running on port 8787."
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full h-11 rounded-lg bg-slate-50 border border-slate-200 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all";
  const inputIconCls = "w-full h-11 rounded-lg bg-slate-50 border border-slate-200 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all";

  return (
    <div className="min-h-screen bg-[#f1f3f6] font-sans antialiased flex items-start sm:items-center justify-center p-4 pt-16 sm:pt-4 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50 pointer-events-none" />

      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-4 sm:left-8 inline-flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:border-slate-300 transition group z-10"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      <div className="w-full max-w-[520px] relative z-10">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 rounded bg-amber-400 flex items-center justify-center shadow-md">
            <Zap size={16} className="text-indigo-950 fill-indigo-950" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">
            Teku<span className="text-amber-500">nik</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-7 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Account</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Fill in your details to get started</p>
          </div>

          {success ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
              <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
              <p className="font-bold text-emerald-700">Registered Successfully!</p>
              <p className="text-emerald-600 text-sm mt-1">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">First Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="text" value={form.first_name} onChange={(e) => updateField("first_name", e.target.value)} placeholder="John" className={inputIconCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Last Name</label>
                  <input type="text" value={form.last_name} onChange={(e) => updateField("last_name", e.target.value)} placeholder="Doe" className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="you@example.com" className={inputIconCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="text" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+91 98765 43210" className={inputIconCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Age</label>
                  <input type="number" value={form.age} onChange={(e) => updateField("age", e.target.value)} placeholder="18" min="18" className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Address</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                  <textarea value={form.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Street address" rows={2}
                    className="w-full rounded-lg bg-slate-50 border border-slate-200 pl-10 pr-4 pt-2.5 pb-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">City</label>
                  <input type="text" value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Mumbai" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Pincode</label>
                  <input type="text" value={form.pincode} onChange={(e) => updateField("pincode", e.target.value)} placeholder="400001" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => updateField("password", e.target.value)} placeholder="Min 6 chars"
                      className="w-full h-11 rounded-lg bg-slate-50 border border-slate-200 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirm</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type={showConfirmPassword ? "text" : "password"} value={form.confirm_password} onChange={(e) => updateField("confirm_password", e.target.value)} placeholder="Confirm"
                      className="w-full h-11 rounded-lg bg-slate-50 border border-slate-200 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
                  <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full h-11 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-slate-950 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-[0.98] disabled:pointer-events-none shadow-sm">
                {loading ? <><Loader size={16} className="animate-spin" /> Creating Account...</> : "Create Account"}
              </button>

              <p className="text-center text-sm text-slate-500 pt-1">
                Already have an account?{" "}
                <button type="button" onClick={() => navigate("/login")} className="text-blue-600 hover:text-blue-700 font-bold transition-colors">Sign In</button>
              </p>
            </form>
          )}
        </div>
        <p className="text-center mt-5 text-xs text-slate-400 font-medium">&copy; {new Date().getFullYear()} Tekunik. All rights reserved.</p>
      </div>
    </div>
  );
}
